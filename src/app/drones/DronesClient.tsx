"use client";

import {
  JSX,
  Key,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import HeroSection from "@/components/drones/HeroSection";
import RepresentativesSection from "@/components/drones/RepresentativesSection";
import CommentsSection from "@/components/drones/CommentsSection";
import InterestFormSection from "@/components/drones/InterestFormSection";
import WhyDrones from "@/components/drones/WhyDrones";
import WhoIsFor from "@/components/drones/WhoIsFor";
import HowItWorks from "@/components/drones/HowItWorks";
import DronesFAQ from "@/components/drones/DronesFAQ";
import ModelsShowcase, {
  type ModelShowcaseEntry,
} from "@/components/drones/ModelsShowcase";
import { absUrl } from "@/utils/absUrl";
import apiClient from "@/lib/apiClient";

// ─── Copy por modelo ────────────────────────────────────────────────
// Conteúdo dos cards da linha DJI Agras. Mantido aqui (não no admin)
// porque os modelos são catálogo da DJI, não conteúdo editorial.
// Se a DJI lançar novo modelo, adicionar entrada aqui ou cair no
// default genérico.
type ModelCopy = {
  badge: string;
  tagline: string;
  description: string;
  benefits: Array<{ label: string; value: string }>;
};

const MODEL_COPY: Record<string, ModelCopy> = {
  t25p: {
    badge: "Versátil",
    tagline: "Pulverização precisa para relevos variados",
    description:
      "Ideal para propriedades menores, agricultura familiar e áreas com relevo irregular. Compacto, cabe na picape e voa em qualquer talhão.",
    benefits: [
      { label: "Operação", value: "Compacta" },
      { label: "Precisão", value: "Alta" },
      { label: "Manejo", value: "Ágil" },
    ],
  },
  t70p: {
    badge: "Alta Performance",
    tagline: "Mais hectares por dia sem perder precisão",
    description:
      "Para quem precisa cobrir mais área na janela de safra com economia de insumos. Produtividade elevada e vazão estável.",
    benefits: [
      { label: "Capacidade", value: "70 kg" },
      { label: "Autonomia", value: "Longa" },
      { label: "Economia", value: "Insumos" },
    ],
  },
  t100: {
    badge: "Potência Máxima",
    tagline: "Máximo desempenho para operações intensas",
    description:
      "Desenhado para grandes lavouras, cooperativas e prestadores de serviço de alta vazão. Carga, alcance e tecnologia no topo da linha.",
    benefits: [
      { label: "Capacidade", value: "100 kg" },
      { label: "Vazão", value: "Máxima" },
      { label: "Alcance", value: "Amplo" },
    ],
  },
};

const MODEL_COPY_DEFAULT: ModelCopy = {
  badge: "Drone agrícola DJI Agras",
  tagline: "Pulverização com tecnologia DJI",
  description:
    "Fale com um representante para conhecer especificações e adequação à sua propriedade.",
  benefits: [
    { label: "Precisão", value: "DJI" },
    { label: "Suporte", value: "Regional" },
    { label: "Tecnologia", value: "Agras" },
  ],
};

function getModelCopy(key: string): ModelCopy {
  return MODEL_COPY[key?.toLowerCase?.() ?? ""] ?? MODEL_COPY_DEFAULT;
}

type MediaTypeLower = "image" | "video";
type MediaTypeUpper = "IMAGE" | "VIDEO";

type DroneModel = {
  key: string;
  label: string;
  is_active?: number;
  sort_order?: number;

  // ✅ vindo do backend (já resolvido pela seleção do admin)
  card_media_url?: string; // pode vir absoluto ou relativo
  card_media_path?: string; // se vier como /uploads/...
  card_media_type?: MediaTypeLower | MediaTypeUpper;

  // ✅ opcional: ids da seleção (se você quiser usar no client depois)
  current_card_media_id?: number | null;
  current_hero_media_id?: number | null;

  _raw?: any;
};

type RootResponse = {
  landing?: any;
  model_data?: any;
  gallery?: any[];
  comments?: any;
};

// ─── Key-specs extraídos do model_data (cadastrados pelo admin) ─────
// O admin cadastra specs em grupos (SpecsGroup[]): cada grupo tem
// title + items[string]. Na landing principal queremos MOSTRAR as 3-4
// specs mais comerciais (capacidade, vazão, largura). Esta função
// achata todos os grupos e escolhe até 3 items (com prioridade para
// termos-chave). Se o admin ainda não preencheu, retorna [] e o card
// cai no fallback estático (MODEL_COPY.benefits).
type ModelData = {
  specs_title?: string | null;
  specs_items_json?: Array<{ title?: string; items?: string[] }> | null;
} | null;

function extractKeySpecs(md: ModelData, max = 3): string[] {
  if (!md?.specs_items_json || !Array.isArray(md.specs_items_json)) return [];

  const flat: string[] = [];
  for (const group of md.specs_items_json) {
    if (!group?.items) continue;
    for (const item of group.items) {
      if (typeof item === "string" && item.trim()) flat.push(item.trim());
    }
  }
  if (!flat.length) return [];

  // Prioriza termos comerciais (capacidade/tanque/vazão/largura/velocidade).
  const priorityRe =
    /capacidade|tanque|vaz[ãa]o|largura|velocidade|autonomia|hectare/i;
  const priority = flat.filter((s) => priorityRe.test(s));
  const rest = flat.filter((s) => !priorityRe.test(s));

  return [...priority, ...rest].slice(0, max);
}

/**
 * Divide "Rótulo: valor" em { label, value } para ficar bonito no card.
 * Se não tiver ":", usa a primeira palavra como label e o resto como value.
 * Trunca valores muito longos (>40 chars) com reticências para não
 * quebrar o grid de 3 colunas do card.
 */
function splitSpec(s: string): { label: string; value: string } {
  const MAX_VALUE = 40;
  const shorten = (v: string) =>
    v.length > MAX_VALUE ? `${v.slice(0, MAX_VALUE - 1).trim()}…` : v;

  const idx = s.indexOf(":");
  if (idx > 0) {
    const label = s.slice(0, idx).trim();
    const value = s.slice(idx + 1).trim();
    return { label, value: shorten(value) };
  }
  // Fallback: primeira palavra como label, resto como value
  const parts = s.split(/\s+/);
  return {
    label: parts[0] || "",
    value: shorten(parts.slice(1).join(" ") || s),
  };
}

function extractArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  if (v?.data && Array.isArray(v.data)) return v.data;
  if (v?.data?.items && Array.isArray(v.data.items)) return v.data.items;
  return [];
}

function fallbackModels(): DroneModel[] {
  return [
    { key: "t25p", label: "DJI Agras T25P", is_active: 1, sort_order: 10 },
    { key: "t70p", label: "DJI Agras T70P", is_active: 1, sort_order: 20 },
    { key: "t100", label: "DJI Agras T100", is_active: 1, sort_order: 30 },
  ];
}

function sortModels(models: DroneModel[]) {
  return [...models].sort(
    (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      a.label.localeCompare(b.label),
  );
}

function pickInitialModel(models: DroneModel[], urlModel?: string) {
  const active = models.filter((m) => String(m.is_active ?? 1) === "1");
  const base = active.length ? active : models;

  if (urlModel && base.some((m) => m.key === urlModel)) return urlModel;
  return base[0]?.key || "";
}

function ModelTab({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={[
        "px-4 py-2 rounded-full text-xs font-extrabold border transition",
        active
          ? "bg-emerald-500 text-white border-emerald-400/40 shadow-[0_12px_35px_-18px_rgba(16,185,129,0.9)]"
          : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

/** ✅ Detecta tipo pela URL */
function detectMediaTypeByUrl(url: string): MediaTypeLower | "" {
  const u = String(url || "");
  if (u.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return "video";
  if (u.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i)) return "image";
  return "";
}

function normalizeMediaTypeToLower(v: any, url?: string): MediaTypeLower | "" {
  const s = String(v || "")
    .toLowerCase()
    .trim();
  if (s.includes("video")) return "video";
  if (s.includes("image")) return "image";
  const byUrl = detectMediaTypeByUrl(String(url || ""));
  return byUrl || "";
}

/**
 * ✅ Resolve a mídia do card do modelo
 * Prioridade:
 * 1) card_media_url
 * 2) card_media_path
 * 3) campos alternativos do _raw (compat)
 */
function resolveCardMedia(model: DroneModel) {
  const raw = model._raw || {};

  const candidates = [
    model.card_media_url,
    model.card_media_path,

    raw.card_media_url,
    raw.card_media_path,
    raw.media_url,
    raw.file_url,
    raw.src,
    raw.media_path,
    raw.mediaPath,
    raw.path,
    raw.video_url,
    raw.image_url,
    raw.image,
    raw.video,
    raw.cover_url,
    raw.thumb_url,
    raw.thumbnail_url,
  ].filter(Boolean) as string[];

  const url = absUrl(candidates[0] || "");

  const type = normalizeMediaTypeToLower(
    model.card_media_type ??
    raw.card_media_type ??
    raw.media_type ??
    raw.type ??
    raw.kind ??
    raw.file_type,
    url,
  );

  return { url, type: type as MediaTypeLower | "" };
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-extrabold text-slate-200">
      {children}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="text-[10px] font-bold text-slate-400">{label}</div>
      <div className="text-[12px] font-extrabold text-slate-100">{value}</div>
    </div>
  );
}

function ModelCard({
  model,
  modelData,
  onOpen,
  onTalkToRep,
  isFirst,
}: {
  model: DroneModel;
  modelData: ModelData;
  onOpen: (key: string) => void;
  onTalkToRep: (modelKey: string) => void;
  isFirst: boolean;
}) {
  const { url, type } = resolveCardMedia(model);
  const copy = getModelCopy(model.key);

  // Prefere specs reais do admin; cai no copy estático se ainda não tiver.
  const realSpecs = extractKeySpecs(modelData, 3);
  const useRealSpecs = realSpecs.length > 0;

  return (
    <div className="relative w-[84vw] sm:w-[430px] md:w-[470px] shrink-0 snap-start">
      <div className="absolute -inset-3 rounded-[32px] bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.14),transparent_60%)] blur-2xl opacity-70" />

      <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-dark-850/80 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="relative">
          <div className="relative aspect-[16/10] bg-gradient-to-br from-white/10 via-white/5 to-transparent">
            {url && type === "video" ? (
              <video
                className="h-full w-full object-cover"
                src={url}
                muted
                playsInline
                loop
                preload="metadata"
                // Evita autoplay simultâneo em vários cards no carrossel —
                // só o primeiro toca automático, os demais ficam estáticos
                // (ajuda em conexões 4G mais lentas no campo).
                autoPlay={isFirst}
              />
            ) : url && type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="h-full w-full object-cover"
                src={url}
                alt={`${model.label} — drone agrícola DJI Agras`}
                loading={isFirst ? "eager" : "lazy"}
              />
            ) : (
              // Fallback visual quando o admin ainda não configurou a mídia.
              // Sem texto de dev — apenas um marco institucional discreto
              // com o nome do modelo.
              <div
                className="h-full w-full flex items-center justify-center bg-gradient-to-br from-emerald-900/40 via-slate-900/60 to-emerald-950/80"
                aria-label={`${model.label} — imagem em breve`}
              >
                <div className="text-center px-6">
                  <svg
                    viewBox="0 0 64 64"
                    className="mx-auto h-10 w-10 text-emerald-300/70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="16" cy="16" r="5" />
                    <circle cx="48" cy="16" r="5" />
                    <circle cx="16" cy="48" r="5" />
                    <circle cx="48" cy="48" r="5" />
                    <path d="M21 16h22M21 48h22M16 21v22M48 21v22" />
                    <rect x="26" y="26" width="12" height="12" rx="2" />
                  </svg>
                  <div className="mt-2 text-sm font-extrabold text-slate-100">
                    {model.label}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    DJI Agras · Kavita Drones
                  </div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

            <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3">
              <Badge>{copy.badge}</Badge>

              <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-200">
                MODELO
              </span>
            </div>

            <div className="absolute left-4 bottom-4 right-4">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 py-2 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]" />
                <span className="text-[11px] font-bold text-slate-200">
                  {copy.tagline}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                {model.label}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {copy.description}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {useRealSpecs
              ? realSpecs.map((s, i) => {
                  const { label, value } = splitSpec(s);
                  return <MiniStat key={`${label}-${i}`} label={label} value={value} />;
                })
              : copy.benefits.map((b) => (
                  <MiniStat key={b.label} label={b.label} value={b.value} />
                ))}
          </div>

          {/* CTA duplo: conversa direta (WhatsApp) vs. conhecer detalhes.
              A ordem destaca o comercial — Fase 1 do redesign. */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => onTalkToRep(model.key)}
              className="relative inline-flex items-center justify-center rounded-2xl px-3 py-3 text-sm font-extrabold text-white
                         bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400
                         shadow-[0_18px_60px_-25px_rgba(16,185,129,0.95)]
                         hover:brightness-[1.05] active:scale-[0.99]"
              title={`Falar com representante sobre ${model.label}`}
            >
              Falar sobre este modelo
            </button>
            <button
              onClick={() => onOpen(model.key)}
              className="relative inline-flex items-center justify-center rounded-2xl px-3 py-3 text-sm font-extrabold text-slate-100
                         border border-white/15 bg-white/[0.04]
                         hover:bg-white/[0.08] active:scale-[0.99]"
            >
              Ver detalhes
            </button>
          </div>

          <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-bold">Kavita Drones · DJI Agras</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
              atendimento com representante
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-white/0 group-hover:ring-white/12 transition" />
      </div>
    </div>
  );
}

function ModelsCarouselSection({
  models,
  modelDataByKey,
  onOpenModel,
  onTalkToRepGeneric,
  onTalkToRepForModel,
}: {
  models: DroneModel[];
  modelDataByKey: Record<string, ModelData>;
  onOpenModel: (key: string) => void;
  onTalkToRepGeneric: () => void;
  onTalkToRepForModel: (modelKey: string) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  function scrollByCards(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;

    const amount = Math.round(el.clientWidth * 0.85) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section id="drones-models" className="py-10 sm:py-14 scroll-mt-24">
      <style>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              Modelos disponíveis
            </h2>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Escolha um modelo para ver <b>especificações</b>,{" "}
              <b>funcionalidades</b>, <b>benefícios</b> e a <b>galeria</b>{" "}
              completa.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scrollByCards(-1)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-slate-200 hover:bg-white/10"
              aria-label="Anterior"
            >
              ←
            </button>
            <button
              onClick={() => scrollByCards(1)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-slate-200 hover:bg-white/10"
              aria-label="Próximo"
            >
              →
            </button>
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-dark-900 to-transparent opacity-80" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-dark-900 to-transparent opacity-80" />

          <div
            ref={scrollerRef}
            className="relative flex gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth no-scrollbar"
          >
            {models.map((m, i) => (
              <ModelCard
                key={m.key}
                model={m}
                modelData={modelDataByKey[m.key] ?? null}
                onOpen={onOpenModel}
                onTalkToRep={onTalkToRepForModel}
                isFirst={i === 0}
              />
            ))}
          </div>

          <div className="relative mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-xs text-slate-400">
              No celular, arraste para o lado. No desktop, use as setas.
            </div>

            <button
              onClick={onTalkToRepGeneric}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-extrabold text-emerald-200 hover:bg-emerald-500/15"
            >
              Fale com um representante
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Seção de confiança ─────────────────────────────────────────────
// Bloco simples de "por que falar com a Kavita antes de comprar".
// Sem prova regulatória real aqui (isso exige selos ANAC/MAPA/RT no
// rodapé quando a operação formalizar). Esta seção foca no valor do
// atendimento humano/regional — honesto sobre o que já existe hoje.
function TrustSection() {
  const pillars = [
    {
      title: "Atendimento regional",
      desc: "Representantes autorizados Kavita em cidades produtoras — contato humano, não call center.",
    },
    {
      title: "Suporte na escolha do modelo",
      desc: "Orientação sobre qual DJI Agras cabe no tamanho da sua área, relevo e cultura.",
    },
    {
      title: "Contato direto por WhatsApp",
      desc: "Fale diretamente com o representante da sua região, sem intermediários.",
    },
    {
      title: "Orientação antes da compra",
      desc: "Tire dúvidas sobre operação, manutenção e treinamento antes de decidir.",
    },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Por que escolher a Kavita
          </p>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Atendimento humano para uma decisão técnica
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Drone agrícola é investimento sério. A Kavita oferece conversa
            direta com representante autorizado para você escolher com
            segurança o modelo certo para sua operação.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 className="mt-3 text-sm font-extrabold text-white">
                {p.title}
              </h3>
              <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-slate-300">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Converte o array de modelos + mapa de model_data em entries prontas
// para o <ModelsShowcase>. Cada entry já vem com badge/tagline/description
// do MODEL_COPY e 3 specs reais (se o admin preencheu) ou o fallback
// dos benefits estáticos.
function buildShowcaseEntries(
  models: DroneModel[],
  modelDataByKey: Record<string, ModelData>,
): ModelShowcaseEntry[] {
  return models
    .filter((m) => String(m.is_active ?? 1) === "1")
    .map((m) => {
      const copy = getModelCopy(m.key);
      const md = modelDataByKey[m.key] ?? null;
      const realSpecs = extractKeySpecs(md, 3);

      const specs = realSpecs.length
        ? realSpecs.map((s) => splitSpec(s))
        : copy.benefits;

      return {
        model: {
          key: m.key,
          label: m.label,
          is_active: m.is_active,
          sort_order: m.sort_order,
          card_media_url: m.card_media_url,
          card_media_path: m.card_media_path,
          card_media_type: m.card_media_type
            ? String(m.card_media_type)
            : undefined,
          _raw: m._raw,
        },
        badge: copy.badge,
        tagline: copy.tagline,
        description: copy.description,
        specs,
      };
    });
}

export default function DronesPublicPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [models, setModels] = useState<DroneModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const [landing, setLanding] = useState<any>(null);
  const [modelData, setModelData] = useState<any>(null);
  // Mapa de model_data por key — usado pelo carrossel de cards da landing
  // para mostrar specs reais (capacidade, vazão, etc.) em cada cartão,
  // em vez do benefits estático do MODEL_COPY.
  const [modelDataByKey, setModelDataByKey] = useState<Record<string, ModelData>>({});
  const [comments, setComments] = useState<any[]>([]);
  const [representatives, setRepresentatives] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchModels = useCallback(async (): Promise<DroneModel[]> => {
    let json: unknown;
    try {
      json = await apiClient.get("/api/public/drones/models");
    } catch {
      return fallbackModels();
    }
    const raw = extractArray(json);

    const normalized = raw
      .map((m: any) => {
        const key = String(m.key || m.model_key || "")
          .trim()
          .toLowerCase();
        const label = String(m.label || m.name || "").trim();

        // ✅ backend ideal: já manda a mídia do card resolvida pela seleção (models_json)
        const cardMediaUrl = m.card_media_url || "";
        const cardMediaPath = m.card_media_path || m.card_media || ""; // tolerante
        const cardMediaType =
          m.card_media_type || m.card_media_kind || m.media_type || undefined;

        // fallback compat antigo (se ainda existir)
        const legacyUrl =
          m.media_url ||
          m.file_url ||
          m.src ||
          m.media_path ||
          m.mediaPath ||
          m.path ||
          m.video_url ||
          m.image_url ||
          m.image ||
          m.video ||
          m.cover_url ||
          m.thumb_url ||
          "";

        const chosenUrl = cardMediaUrl || cardMediaPath || legacyUrl;

        return {
          key,
          label,
          is_active: Number(m.is_active ?? 1),
          sort_order: Number(m.sort_order ?? 0),

          // ✅ preferir os campos novos de card
          card_media_url: chosenUrl ? absUrl(chosenUrl) : undefined,
          card_media_path: cardMediaPath ? String(cardMediaPath) : undefined,
          card_media_type: cardMediaType,

          // ✅ ids (opcionais)
          current_card_media_id:
            m.current_card_media_id != null
              ? Number(m.current_card_media_id)
              : null,
          current_hero_media_id:
            m.current_hero_media_id != null
              ? Number(m.current_hero_media_id)
              : null,

          _raw: m,
        } as DroneModel;
      })
      .filter((m: DroneModel) => m.key && m.label);

    return sortModels(normalized.length ? normalized : fallbackModels());
  }, []);

  const fetchPage = useCallback(async (modelKey?: string) => {
    const path = modelKey
      ? `/api/public/drones?model=${modelKey}`
      : `/api/public/drones`;
    try {
      return (await apiClient.get(path)) as RootResponse;
    } catch {
      return null;
    }
  }, []);

  const fetchRepresentatives = useCallback(async () => {
    try {
      const json = await apiClient.get("/api/public/drones/representantes");
      return extractArray(json);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [modelsDb, reps] = await Promise.all([
        fetchModels(),
        fetchRepresentatives(),
      ]);
      setModels(modelsDb);
      setRepresentatives(reps);

      const urlModel = search.get("model") || "";
      const initial = pickInitialModel(modelsDb, urlModel);

      setSelectedModel(initial);

      // Busca landing + model_data do modelo selecionado (fluxo original).
      // Em paralelo, busca model_data de TODOS os modelos ativos para
      // alimentar os cards do carrossel com specs reais. Cada request
      // falha silenciosamente — fallback para copy.benefits no card.
      const activeKeys = modelsDb
        .filter((m) => String(m.is_active ?? 1) === "1")
        .map((m) => m.key);

      const [root, perModelRoots] = await Promise.all([
        fetchPage(initial),
        Promise.all(activeKeys.map((k) => fetchPage(k))),
      ]);

      setLanding(root?.landing || null);
      setModelData(root?.model_data || null);
      setComments(extractArray(root?.comments));

      const map: Record<string, ModelData> = {};
      activeKeys.forEach((k, idx) => {
        map[k] = (perModelRoots[idx]?.model_data as ModelData) ?? null;
      });
      setModelDataByKey(map);

      setLoading(false);
    })();
  }, [fetchModels, fetchPage, fetchRepresentatives, search]);

  async function changeModel(key: string) {
    if (!key || key === selectedModel) return;

    setSelectedModel(key);
    router.replace(`/drones?model=${key}`);

    setLoading(true);
    const root = await fetchPage(key);

    setLanding(root?.landing || null);
    setModelData(root?.model_data || null);
    setComments(extractArray(root?.comments));
    setLoading(false);
  }

  const mergedPage = useMemo(
    () => ({ ...(landing || {}), ...(modelData || {}) }),
    [landing, modelData],
  );

  const sectionsOrder = useMemo(() => {
    // Ordem canônica da landing — fases 1/2/3 do redesign:
    // hero → why (educativa) → models (cards c/ specs reais) →
    // who (segmentação) → how (processo 5 passos) → trust →
    // interest (form WhatsApp) → representatives (lista) →
    // faq (objeções) → comments (prova social).
    //
    // Se o admin mandar sections_order_json, respeitamos. Caso
    // contrário, usamos a ordem fixa abaixo. Seções legadas de
    // detalhe (specs/features/benefits/gallery) só existem em
    // /drones/[id], então filtramos da ordem se vierem do admin.
    const raw = mergedPage?.sections_order_json || [
      "hero",
      "why",
      "models",
      "who",
      "how",
      "trust",
      "interest",
      "representatives",
      "faq",
      "comments",
    ];

    const filtered = raw.filter(
      (k: any) =>
        !["specs", "features", "benefits", "gallery"].includes(String(k)),
    );

    // Injeta as seções novas na ordem certa, caso venham do admin
    // faltando alguma (compatibilidade com sections_order_json legado).
    function ensureAfter(list: string[], after: string, key: string) {
      if (list.includes(key)) return;
      const idx = list.indexOf(after);
      if (idx >= 0) list.splice(idx + 1, 0, key);
      else list.push(key);
    }
    function ensureBefore(list: string[], before: string, key: string) {
      if (list.includes(key)) return;
      const idx = list.indexOf(before);
      if (idx >= 0) list.splice(idx, 0, key);
      else list.push(key);
    }

    ensureAfter(filtered, "hero", "why");
    ensureAfter(filtered, "why", "models");
    ensureAfter(filtered, "models", "who");
    ensureAfter(filtered, "who", "how");
    ensureAfter(filtered, "how", "trust");
    ensureBefore(filtered, "representatives", "interest");
    ensureAfter(filtered, "representatives", "faq");

    return filtered;
  }, [mergedPage]);

  const sections: Record<string, JSX.Element> = {
    hero: <HeroSection page={mergedPage} representatives={representatives} />,

    why: <WhyDrones />,

    who: <WhoIsFor />,

    how: <HowItWorks />,

    faq: <DronesFAQ />,

    models: (
      <ModelsShowcase
        entries={buildShowcaseEntries(models, modelDataByKey)}
        onOpenModel={(key) => router.push(`/drones/${key}`)}
        onTalkToRepGeneric={() => {
          const el = document.getElementById("drones-representatives");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onTalkToRepForModel={(key) => {
          if (key !== selectedModel) {
            setSelectedModel(key);
            router.replace(`/drones?model=${key}`);
          }
          const el = document.getElementById("drones-representatives");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    ),

    trust: <TrustSection />,

    interest: (
      <InterestFormSection
        models={models.filter((m) => String(m.is_active ?? 1) === "1")}
        representative={representatives?.[0]}
        messageTemplate={mergedPage?.cta_message_template}
      />
    ),

    representatives: (
      <div id="drones-representatives">
        <RepresentativesSection
          page={mergedPage}
          representatives={representatives}
        />
      </div>
    ),

    comments: (
      <CommentsSection
        comments={comments}
        modelKey={selectedModel}
        onCreated={() => changeModel(selectedModel)}
      />
    ),
  };

  if (loading && !landing) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100">
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-3 flex gap-3 items-center">
          <span className="text-xs font-semibold text-slate-300 shrink-0">
            Modelo:
          </span>

          <select
            className="sm:hidden w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
            value={selectedModel}
            onChange={(e) => changeModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>

          <div className="hidden sm:flex gap-2 overflow-x-auto no-scrollbar">
            {models.map((m) => (
              <button key={m.key} onClick={() => changeModel(m.key)}>
                <ModelTab active={m.key === selectedModel} label={m.label} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {sectionsOrder.map((key: Key | null | undefined, idx: number) => {
        const sectionKey = String(key);
        return (
          <div key={sectionKey}>
            {sections[sectionKey]}
            {idx < sectionsOrder.length - 1 && (
              <div className="max-w-6xl mx-auto px-5">
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
