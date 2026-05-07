"use client";

// Hero v2 — layout 50/50 interativo. Tabs T25P/T70P/T100 no topo
// controlam o conteúdo inteiro do hero: eyebrow, headline, descrição,
// 3 chips de specs e drone à direita. Cada modelo tem identidade
// visual própria via accent compartilhado (cyan/emerald/amber).
//
// Inspiração: DJI Store / Tesla Model selector. Cada tab é um modo.

import Image from "next/image";
import { Droplet, Gauge, MessageCircle, Plane, ArrowRight, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

import type { DronePageSettings, DroneRepresentative } from "@/types/drones";
import { absUrl } from "@/utils/absUrl";
import { getAccent, type Accent } from "@/components/drones/detail/accent";
import { getModelCopy } from "@/lib/drones/modelCopy";

// ─── Defaults editoriais (fallback se admin nada configurou) ────────────
const DEFAULT_CTA_BUTTON = "Fale com um representante";
const DEFAULT_CTA_MESSAGE =
  "Olá! Quero conhecer melhor os drones DJI Agras da Kavita.";

type ShowcaseModel = {
  key: string;
  label: string;
  is_active?: number;
  card_media_url?: string;
  card_media_path?: string;
  card_media_type?: string;
  hero_media_path?: string;
  hero_media_type?: string;
};

function buildWaLink(
  rep: DroneRepresentative,
  modelLabel: string,
  template?: string | null,
) {
  const phone = String(rep.whatsapp || "").replace(/\D/g, "");
  const baseMsg = template || DEFAULT_CTA_MESSAGE;
  const text = encodeURIComponent(
    `${baseMsg}\n\nModelo de interesse: ${modelLabel}\nLoja: ${rep.name}`,
  );
  const full = phone.startsWith("55") ? phone : `55${phone}`;
  return `https://wa.me/${full}?text=${text}`;
}

function detectMediaTypeByUrl(url: string): "image" | "video" | "" {
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return "video";
  if (/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(url)) return "image";
  return "";
}

function resolveModelMedia(m: ShowcaseModel) {
  // Prioridade: hero (destaque grande) → card (fallback). Hero é mais
  // adequado para o hero da landing pública.
  const path =
    m.hero_media_path ||
    m.card_media_url ||
    m.card_media_path ||
    "";
  const url = absUrl(path);
  const tRaw = String(
    m.hero_media_type || m.card_media_type || "",
  ).toLowerCase();
  const t = tRaw.includes("video")
    ? "video"
    : tRaw.includes("image")
      ? "image"
      : detectMediaTypeByUrl(url);
  return { url, type: t as "image" | "video" | "" };
}

type Props = {
  page: DronePageSettings;
  representatives: DroneRepresentative[];
  models?: ShowcaseModel[];
  selectedModel?: string;
  onSelectModel?: (key: string) => void;
};

export default function HeroSection({
  page,
  representatives,
  models = [],
  selectedModel,
  onSelectModel,
}: Props) {
  // Apenas modelos ativos. Se admin desativar T70P, ele some das tabs.
  const activeModels = useMemo(
    () => models.filter((m) => String(m.is_active ?? 1) === "1"),
    [models],
  );

  // Seleção atual com fallback para o primeiro modelo ativo.
  const selected = useMemo(() => {
    if (selectedModel) {
      const m = activeModels.find((x) => x.key === selectedModel);
      if (m) return m;
    }
    return activeModels[0];
  }, [activeModels, selectedModel]);

  if (!selected) {
    // Sem modelos: fallback minimalista (não deveria acontecer com seed).
    return (
      <section className="relative bg-[#050816] py-20 text-center text-slate-400">
        Configure os modelos no admin para exibir o hero.
      </section>
    );
  }

  const accent = getAccent(selected.key);
  const copy = getModelCopy(selected.key);
  const media = resolveModelMedia(selected);
  const ctaButton =
    (page.cta_button_label || "").trim() || DEFAULT_CTA_BUTTON;
  const primaryCtaHref = representatives?.[0]
    ? buildWaLink(representatives[0], selected.label, page.cta_message_template)
    : "#drones-representatives";

  return (
    <section className="relative isolate overflow-hidden bg-[#050816]">
      {/* ── Camadas de fundo cinematográficas ───────────────────────── */}
      {/* Halos accent que mudam por modelo selecionado — key={accent.key}
          força replay da transição. */}
      <div
        key={accent.key}
        aria-hidden
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(8,16,30,0.7),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.95),transparent_70%)]"
        />
        <div
          className={[
            "kvt-fade-in absolute -left-32 top-0 h-[42rem] w-[42rem] rounded-full blur-3xl opacity-50",
            accent.halo,
          ].join(" ")}
        />
        <div
          className={[
            "kvt-fade-in absolute -right-40 bottom-0 h-[36rem] w-[36rem] rounded-full blur-3xl opacity-40",
            accent.halo,
          ].join(" ")}
        />
        <div className="absolute inset-0 opacity-[0.05] mix-blend-soft-light bg-[linear-gradient(to_right,rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pt-8 pb-16 sm:pt-10 sm:pb-20 lg:pt-14 lg:pb-24">
        {/* ── Mode selector tabs ────────────────────────────────────── */}
        <ModelTabs
          models={activeModels}
          selectedKey={selected.key}
          onSelect={(k) => onSelectModel?.(k)}
        />

        {/* ── Grid 50/50: copy à esquerda, drone à direita ─────────── */}
        {/* Mobile (< lg): drone vem PRIMEIRO via flex order para virar
            protagonista visual; texto depois. Desktop respeita ordem
            natural com texto à esquerda. */}
        <div className="mt-10 flex flex-col items-center gap-10 lg:mt-14 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12">
          {/* COLUNA TEXTO — re-renderiza com fade quando troca de modelo */}
          <div
            key={`copy-${selected.key}`}
            className="kvt-fade-up min-w-0 order-2 lg:order-1"
          >
            {/* Eyebrow accent dinâmico (DJI AGRAS T25P / T70P / T100) */}
            <div
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] backdrop-blur",
                accent.badgeBorder,
                accent.badgeBg,
                accent.badgeText,
              ].join(" ")}
            >
              <span
                className={["h-1.5 w-1.5 rounded-full", accent.dot].join(" ")}
              />
              DJI Agras · {selected.key.toUpperCase()}
            </div>

            {/* Headline cinematográfico — vem do copy.tagline do modelo */}
            <h1 className="mt-6 text-4xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[3.75rem]">
              {copy.tagline}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300/90 sm:text-[17px]">
              {copy.description}
            </p>

            {/* 3 chips horizontais (Operação/Precisão/Manejo etc) */}
            {copy.benefits.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {copy.benefits.slice(0, 3).map((b, i) => (
                  <BenefitChip
                    key={`${selected.key}-${b.label}-${i}`}
                    label={b.label}
                    value={b.value}
                    accent={accent}
                    icon={getChipIcon(i)}
                  />
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={primaryCtaHref}
                target={representatives?.[0] ? "_blank" : undefined}
                rel={representatives?.[0] ? "noreferrer" : undefined}
                className={[
                  "group inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-extrabold text-white transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-white/40",
                  "bg-gradient-to-r hover:brightness-[1.08]",
                  accent.primaryGradient,
                  accent.primaryShadow,
                ].join(" ")}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {ctaButton}
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </a>

              <a
                href="#drones-specs"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-extrabold text-slate-100 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.99]"
              >
                Ver especificações
              </a>
            </div>

            {/* Selo das 3 cidades */}
            <div className="mt-6 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
              <span className="font-mono uppercase tracking-[0.12em]">
                Manhuaçu · Espera Feliz · Cachoeira do Itapemirim
              </span>
            </div>
          </div>

          {/* COLUNA DRONE — full-bleed na coluna, sem cápsula/borda */}
          <div
            key={`media-${selected.key}`}
            className="kvt-fade-in relative w-full order-1 lg:order-2"
          >
            <ModelStage media={media} accent={accent} label={selected.label} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Mode selector (tabs) ────────────────────────────────────────────────

function ModelTabs({
  models,
  selectedKey,
  onSelect,
}: {
  models: ShowcaseModel[];
  selectedKey: string;
  onSelect: (key: string) => void;
}) {
  if (!models.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
        Modelo
      </span>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {models.map((m) => {
          const isActive = m.key === selectedKey;
          const accent = getAccent(m.key);
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onSelect(m.key)}
              aria-pressed={isActive}
              className={[
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-extrabold transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-white/30",
                isActive
                  ? `bg-gradient-to-r ${accent.primaryGradient} border-transparent text-white ${accent.primaryShadow}`
                  : "border-white/15 bg-white/[0.04] text-slate-300 hover:border-white/25 hover:bg-white/[0.08] hover:text-white",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  isActive ? "bg-white" : accent.dot,
                ].join(" ")}
                aria-hidden
              />
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Chip de benefício (3 indicadores no hero) ──────────────────────────

function BenefitChip({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: Accent;
  icon: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.55)] px-4 py-3 backdrop-blur-md">
      <span
        className={[
          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
          accent.badgeBorder,
          accent.badgeBg,
          accent.text,
        ].join(" ")}
      >
        {icon}
      </span>
      <div className="leading-tight">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </div>
        <div className={["text-base font-extrabold", accent.text].join(" ")}>
          {value}
        </div>
      </div>
    </div>
  );
}

function getChipIcon(idx: number): React.ReactNode {
  // Ícones rotativos para os 3 chips. Como o copy.benefits não traz
  // ícone, usamos uma sequência sensata (operação → precisão → manejo).
  const Icon = [Droplet, Gauge, Plane][idx] || Droplet;
  return <Icon className="h-4 w-4" aria-hidden />;
}

// ─── Stage do drone (coluna direita do hero) ────────────────────────────

function ModelStage({
  media,
  accent,
  label,
}: {
  media: { url: string; type: "image" | "video" | "" };
  accent: Accent;
  label: string;
}) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.75rem] sm:aspect-[5/4] sm:rounded-[2rem] lg:aspect-[1/1]">
      {/* Halo radial massivo atrás do drone — vibe de "estúdio cinematográfico" */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,var(--tw-gradient-stops))] opacity-60",
          accent.glow,
        ].join(" ")}
      />

      {media.url && media.type === "video" ? (
        <video
          className="relative h-full w-full object-cover"
          src={media.url}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
        />
      ) : media.url && media.type === "image" ? (
        <Image
          src={media.url}
          alt={`${label} em operação`}
          fill
          priority
          quality={90}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="relative object-cover"
        />
      ) : (
        // Fallback decorativo: gradient + grid + ícone do drone
        <div className="relative h-full w-full">
          <div
            aria-hidden
            className="absolute inset-0 opacity-30 mix-blend-overlay bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:32px_32px]"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              viewBox="0 0 64 64"
              className={["h-32 w-32 opacity-80", accent.text].join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
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
          </div>
        </div>
      )}

      {/* Overlay sutil para integrar com o gradient do hero (lado esquerdo
          mais escuro pra reforçar o foco do texto na coluna esquerda). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050816]/30 via-transparent to-transparent"
      />
    </div>
  );
}
