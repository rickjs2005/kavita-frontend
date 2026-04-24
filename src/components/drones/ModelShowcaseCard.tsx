"use client";

// Card redesenhado dos modelos DJI Agras para a landing /drones.
// Substitui o ModelCard antigo (inline no DronesClient).
//
// Premissas do redesenho:
// - Mídia ocupa protagonista (aspect 4:3, overlay só no rodapé).
// - 3 stats "hero" em coluna separada com valor grande + label.
// - Cor de accent por modelo (cyan / emerald / amber) para diferenciar
//   visualmente T25P / T70P / T100 sem depender só de fotos.
// - 2 CTAs: "Falar sobre este modelo" (primário) + "Ver detalhes" (neutro).
// - Badge comercial curta (Versátil / Alta Performance / Potência Máxima).

import { ArrowRight, MessageCircle } from "lucide-react";
import { absUrl } from "@/utils/absUrl";

type MediaTypeLower = "image" | "video";

export type ModelShowcaseModel = {
  key: string;
  label: string;
  is_active?: number;
  sort_order?: number;
  card_media_url?: string;
  card_media_path?: string;
  card_media_type?: string;
  // Fallback: quando o admin seleciona so a midia de HERO (destaque
  // grande), usamos essa aqui se card_media_* estiver vazio. Assim o
  // card nao fica sem imagem quando ja existe uma midia cadastrada.
  hero_media_path?: string;
  hero_media_type?: string;
  _raw?: unknown;
};

export type ModelShowcaseSpec = { label: string; value: string };

type Props = {
  model: ModelShowcaseModel;
  badge: string;
  tagline: string;
  description: string;
  specs: ModelShowcaseSpec[]; // 3 key specs
  isFirst?: boolean;
  onOpen: (key: string) => void;
  onTalkToRep: (key: string) => void;
};

// ─── Paleta de accent por modelo (cor-chave visual) ─────────────
// Cyan → T25P (versatilidade, tecnologia leve)
// Emerald → T70P (agro, produtividade)
// Amber → T100 (potência, premium)
// Fallback → slate (modelo novo que entre via admin)
type Accent = {
  ring: string; // borda do card
  glow: string; // halo radial no fundo
  text: string; // cor do valor destacado
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dot: string;
  primaryGradient: string; // CTA primário
  primaryShadow: string;
};

const ACCENTS: Record<string, Accent> = {
  t25p: {
    ring: "border-cyan-400/25",
    glow: "from-cyan-500/20 via-sky-500/10 to-transparent",
    text: "text-cyan-300",
    badgeBg: "bg-cyan-500/15",
    badgeBorder: "border-cyan-400/30",
    badgeText: "text-cyan-200",
    dot: "bg-cyan-400",
    primaryGradient: "from-cyan-500 via-sky-400 to-teal-400",
    primaryShadow: "shadow-[0_18px_60px_-22px_rgba(34,211,238,0.9)]",
  },
  t70p: {
    ring: "border-emerald-400/25",
    glow: "from-emerald-500/20 via-teal-500/10 to-transparent",
    text: "text-emerald-300",
    badgeBg: "bg-emerald-500/15",
    badgeBorder: "border-emerald-400/30",
    badgeText: "text-emerald-200",
    dot: "bg-emerald-400",
    primaryGradient: "from-emerald-500 via-emerald-400 to-teal-400",
    primaryShadow: "shadow-[0_18px_60px_-22px_rgba(16,185,129,0.9)]",
  },
  t100: {
    ring: "border-amber-400/25",
    glow: "from-amber-500/20 via-orange-500/10 to-transparent",
    text: "text-amber-300",
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-400/30",
    badgeText: "text-amber-200",
    dot: "bg-amber-400",
    primaryGradient: "from-amber-500 via-orange-400 to-amber-400",
    primaryShadow: "shadow-[0_18px_60px_-22px_rgba(251,191,36,0.9)]",
  },
};

const DEFAULT_ACCENT: Accent = {
  ring: "border-white/10",
  glow: "from-slate-500/15 via-slate-500/5 to-transparent",
  text: "text-slate-200",
  badgeBg: "bg-slate-500/15",
  badgeBorder: "border-slate-400/30",
  badgeText: "text-slate-200",
  dot: "bg-slate-400",
  primaryGradient: "from-emerald-500 via-emerald-400 to-teal-400",
  primaryShadow: "shadow-[0_18px_60px_-25px_rgba(16,185,129,0.95)]",
};

function getAccent(key: string): Accent {
  return ACCENTS[String(key || "").toLowerCase()] ?? DEFAULT_ACCENT;
}

// ─── Detecção de tipo de mídia ─────────────────────────────────────
function detectMediaTypeByUrl(url: string): MediaTypeLower | "" {
  const u = String(url || "");
  if (u.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return "video";
  if (u.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i)) return "image";
  return "";
}

function normalizeMediaType(raw: unknown, url: string): MediaTypeLower | "" {
  const s = String(raw || "").toLowerCase();
  if (s.includes("video")) return "video";
  if (s.includes("image")) return "image";
  return detectMediaTypeByUrl(url);
}

function resolveCardMedia(model: ModelShowcaseModel) {
  const raw = (model._raw as Record<string, unknown> | undefined) || {};

  // Prioridade: card_media_url (frontend resolvido) → card_media_path
  // (backend) → hero_media_path (fallback se admin selecionou so hero)
  // → campos legados do _raw. Assim o card nunca fica sem imagem
  // desde que qualquer midia de destaque tenha sido cadastrada.
  const pathCandidate =
    model.card_media_url ||
    model.card_media_path ||
    model.hero_media_path ||
    (raw.card_media_url as string) ||
    (raw.card_media_path as string) ||
    (raw.hero_media_path as string) ||
    (raw.media_url as string) ||
    (raw.image_url as string) ||
    (raw.cover_url as string) ||
    "";

  const url = absUrl(String(pathCandidate));
  const type = normalizeMediaType(
    model.card_media_type ??
      model.hero_media_type ??
      (raw.card_media_type as string) ??
      (raw.hero_media_type as string) ??
      (raw.media_type as string),
    url,
  );
  return { url, type };
}

// ─── Componente ────────────────────────────────────────────────────

export default function ModelShowcaseCard({
  model,
  badge,
  tagline,
  description,
  specs,
  isFirst = false,
  onOpen,
  onTalkToRep,
}: Props) {
  const { url, type } = resolveCardMedia(model);
  const accent = getAccent(model.key);

  return (
    <article
      className={[
        "group relative w-[84vw] shrink-0 snap-start sm:w-[440px] md:w-[480px] lg:w-full",
        "transition-transform hover:-translate-y-0.5",
      ].join(" ")}
    >
      {/* Halo radial com cor de accent do modelo */}
      <div
        className={[
          "pointer-events-none absolute -inset-4 rounded-[36px] blur-3xl opacity-60",
          "bg-gradient-to-br",
          accent.glow,
        ].join(" ")}
        aria-hidden
      />

      <div
        className={[
          "relative overflow-hidden rounded-[32px]",
          "border bg-dark-850/85 backdrop-blur-xl",
          "shadow-[0_30px_90px_-50px_rgba(0,0,0,0.95)]",
          accent.ring,
        ].join(" ")}
      >
        {/* Mídia hero do card — 4:3, protagonista, overlay só na parte de baixo.
            As classes de filtro (brightness/saturate/contrast) padronizam
            a percepção visual entre os 3 modelos: imagens mais escuras
            (caso do T25P) ganham realce; imagens claras não estouram.
            Zoom inicial de 1.02 + object-center enquadra melhor imagens
            onde o drone nao está perfeitamente centralizado. */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-white/5 via-white/2 to-transparent">
          {url && type === "video" ? (
            <video
              className="h-full w-full object-cover object-center
                         brightness-[1.08] saturate-[1.1] contrast-[1.05]
                         scale-[1.02]
                         transition-[transform,filter] duration-700
                         group-hover:scale-[1.05] group-hover:brightness-[1.12]"
              src={url}
              muted
              playsInline
              loop
              preload="metadata"
              autoPlay={isFirst}
            />
          ) : url && type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="h-full w-full object-cover object-center
                         brightness-[1.08] saturate-[1.1] contrast-[1.05]
                         scale-[1.02]
                         transition-[transform,filter] duration-700
                         group-hover:scale-[1.05] group-hover:brightness-[1.12]"
              src={url}
              alt={`${model.label} — drone agrícola DJI Agras`}
              loading={isFirst ? "eager" : "lazy"}
            />
          ) : (
            // Fallback institucional — sem texto "configure no admin"
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-950"
              aria-label={`${model.label} — imagem em breve`}
            >
              <div className="text-center">
                <svg
                  viewBox="0 0 64 64"
                  className={`mx-auto h-14 w-14 ${accent.text}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="16" cy="16" r="6" />
                  <circle cx="48" cy="16" r="6" />
                  <circle cx="16" cy="48" r="6" />
                  <circle cx="48" cy="48" r="6" />
                  <path d="M22 16h20M22 48h20M16 22v20M48 22v20" />
                  <rect x="26" y="26" width="12" height="12" rx="2" />
                </svg>
                <div className="mt-3 text-base font-extrabold text-slate-100">
                  {model.label}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  DJI Agras
                </div>
              </div>
            </div>
          )}

          {/* Gradiente inferior — preserva legibilidade do nome do modelo
              sem esmagar a imagem. Valores calibrados após padronização:
              from-black/70 (antes /80) + via-black/5 (antes /10) deixa a
              imagem respirar mais, especialmente em mídias escuras. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

          {/* Badge comercial no topo esquerdo.
              Padding e tracking calibrados para nao inchar em palavras
              curtas (ex: "Versatil" 8 chars) vs longas (ex: "Alta
              Performance" 16 chars). tracking-[0.04em] e mais sutil que
              tracking-wide; leading-none impede altura extra em bold. */}
          <div className="absolute left-4 top-4">
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[5px]",
                "text-[10.5px] font-extrabold uppercase leading-none tracking-[0.04em]",
                accent.badgeBg,
                accent.badgeBorder,
                accent.badgeText,
              ].join(" ")}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
              {badge}
            </span>
          </div>

          {/* Nome do modelo sobreposto embaixo da imagem */}
          <div className="absolute inset-x-4 bottom-4">
            <h3 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] sm:text-3xl">
              {model.label}
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-200/90">
              {tagline}
            </p>
          </div>
        </div>

        {/* Corpo: descrição curta + 3 stats grandes + CTAs */}
        <div className="space-y-5 p-5 sm:p-6">
          <p className="text-[13px] leading-relaxed text-slate-300">
            {description}
          </p>

          {/* Specs em destaque: valor grande + label pequeno */}
          {specs.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {specs.map((s, i) => (
                <div
                  key={`${s.label}-${i}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3"
                >
                  <div
                    className={`text-base font-extrabold leading-tight ${accent.text} sm:text-lg`}
                    title={s.value}
                  >
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2 CTAs: WhatsApp primário (com cor do accent) + Detalhes secundário */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onTalkToRep(model.key)}
              className={[
                "relative inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-sm font-extrabold text-white",
                "bg-gradient-to-r transition hover:brightness-110 active:scale-[0.99]",
                accent.primaryGradient,
                accent.primaryShadow,
              ].join(" ")}
              aria-label={`Falar com representante sobre ${model.label}`}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Falar agora
            </button>

            <button
              onClick={() => onOpen(model.key)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/15 bg-white/[0.04] px-3 py-3 text-sm font-extrabold text-slate-100 transition hover:bg-white/[0.08] active:scale-[0.99]"
            >
              Ver detalhes
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {/* Rodapé discreto */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-slate-400">
            <span className="font-bold">Kavita Drones · DJI Agras</span>
            <span className="inline-flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
              atendimento regional
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
