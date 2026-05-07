"use client";

// Hero da landing genérica /drones — showroom premium dos 3 modelos
// DJI Agras. Layout cinematográfico inspirado em /drones/[id], mas
// adaptado para apresentar os TRÊS modelos como protagonistas em vez
// de um só.
//
// Estrutura desktop:
//   ┌ Eyebrow accent
//   ├ Headline gigante (cinema)
//   ├ Subtítulo + descrição
//   ├ Vitrine (3 cápsulas lado-a-lado, accent por modelo)
//   ├ CTAs (WhatsApp primário + ver modelos)
//   └ Selo das 3 cidades (Manhuaçu / Espera Feliz / Cachoeira do Itapemirim)
//
// Mobile: empilha vertical, vitrine vira scroll horizontal com snap.

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, ShieldCheck, Store } from "lucide-react";

import type { DronePageSettings, DroneRepresentative } from "@/types/drones";
import { absUrl } from "@/utils/absUrl";
import { getAccent } from "@/components/drones/detail/accent";
import { getModelCopy } from "@/lib/drones/modelCopy";

// ─── Defaults editoriais ─────────────────────────────────────────────────
const DEFAULT_HERO_TITLE =
  "Pulverização aérea para o campo brasileiro";
const DEFAULT_HERO_SUBTITLE =
  "Três modelos DJI Agras, uma operação que vira produtividade. Da picape ao prestador de serviço de alta vazão.";
const DEFAULT_CTA_BUTTON = "Falar com representante";
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

function buildWaLink(rep: DroneRepresentative, template?: string | null) {
  const phone = String(rep.whatsapp || "").replace(/\D/g, "");
  const msg = template || DEFAULT_CTA_MESSAGE;
  const text = encodeURIComponent(`${msg}\n\nLoja: ${rep.name}`);
  const full = phone.startsWith("55") ? phone : `55${phone}`;
  return `https://wa.me/${full}?text=${text}`;
}

function resolveCardMedia(m: ShowcaseModel): {
  url: string;
  type: "image" | "video" | "";
} {
  const raw =
    m.card_media_url ||
    m.card_media_path ||
    m.hero_media_path ||
    "";
  const url = absUrl(raw);
  const tRaw = String(
    m.card_media_type || m.hero_media_type || "",
  ).toLowerCase();
  const t = tRaw.includes("video")
    ? "video"
    : tRaw.includes("image")
      ? "image"
      : /\.(mp4|webm|ogg)(\?.*)?$/i.test(url)
        ? "video"
        : /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(url)
          ? "image"
          : "";
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
  const router = useRouter();

  const title = (page.hero_title || "").trim() || DEFAULT_HERO_TITLE;
  const subtitle =
    (page.hero_subtitle || "").trim() || DEFAULT_HERO_SUBTITLE;
  const ctaButton =
    (page.cta_button_label || "").trim() || DEFAULT_CTA_BUTTON;

  // CTA primário: aponta para o primeiro representante. Se não houver,
  // rola até a seção de representantes.
  const primaryCtaHref = representatives?.[0]
    ? buildWaLink(representatives[0], page.cta_message_template)
    : "#drones-representatives";

  const repCount = representatives?.length ?? 0;

  // Filtra apenas modelos ativos. Cap em 3 para a vitrine — se admin
  // cadastrar T200P no futuro, o quarto fica fora do hero (aparece nos
  // cards completos abaixo).
  const showcase = models
    .filter((m) => String(m.is_active ?? 1) === "1")
    .slice(0, 3);

  function openModel(key: string) {
    if (onSelectModel) onSelectModel(key);
    router.push(`/drones/${key}`);
  }

  return (
    <section className="relative isolate overflow-hidden bg-[#050816]">
      {/* ── Camadas de fundo cinematográficas ───────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(8,16,30,0.7),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.95),transparent_70%)]"
      />
      {/* Halo cyan (T25P) à esquerda */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-20 h-[36rem] w-[36rem] rounded-full bg-cyan-500/12 blur-3xl"
      />
      {/* Halo emerald (T70P) ao centro-baixo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -bottom-40 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-emerald-500/12 blur-3xl"
      />
      {/* Halo amber (T100) à direita */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-32 h-[32rem] w-[32rem] rounded-full bg-amber-500/10 blur-3xl"
      />
      {/* Grid sutil de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-soft-light bg-[linear-gradient(to_right,rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-[size:48px_48px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 pt-12 pb-14 sm:pt-20 sm:pb-20 lg:pt-28 lg:pb-24">
        {/* ── Bloco texto ─────────────────────────────────────────── */}
        <div className="kvt-fade-up mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-200 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            DJI Agras · Representante autorizado Kavita
          </div>

          <h1 className="mt-6 text-4xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.25rem]">
            {title}
          </h1>

          <p className="mt-5 text-base font-semibold text-emerald-200/90 sm:text-lg">
            {subtitle}
          </p>

          {/* Selo das 3 cidades */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
            <span className="font-mono uppercase tracking-[0.12em]">
              Manhuaçu · Espera Feliz · Cachoeira do Itapemirim
            </span>
          </div>
        </div>

        {/* ── Vitrine: 3 cápsulas dos modelos ─────────────────────── */}
        {showcase.length > 0 && (
          <div className="kvt-fade-up kvt-delay-1 mt-12 sm:mt-14">
            <div className="-mx-5 px-5 sm:mx-0 sm:px-0">
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pb-2 sm:grid sm:snap-none sm:gap-5 sm:overflow-visible sm:pb-0 sm:grid-cols-3">
                {showcase.map((m, idx) => (
                  <ModelCapsule
                    key={m.key}
                    model={m}
                    active={selectedModel === m.key}
                    onClick={() => openModel(m.key)}
                    delayMs={120 * idx}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CTAs principais ─────────────────────────────────────── */}
        <div className="kvt-fade-up kvt-delay-2 mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-3">
          <a
            href={primaryCtaHref}
            target={representatives?.[0] ? "_blank" : undefined}
            rel={representatives?.[0] ? "noreferrer" : undefined}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 px-7 py-4 text-sm font-extrabold text-white shadow-[0_18px_60px_-22px_rgba(16,185,129,0.9)] transition hover:brightness-[1.08] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400/60 sm:w-auto"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            {ctaButton}
            <ArrowRight
              className="h-4 w-4 transition group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>

          <a
            href="#drones-models"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-extrabold text-slate-100 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.98] sm:w-auto"
          >
            Comparar modelos
          </a>
        </div>

        {/* Linha de credibilidade abaixo dos CTAs */}
        {repCount > 0 && (
          <p className="kvt-fade-up kvt-delay-3 mt-5 text-center text-xs text-slate-400">
            <Store className="mr-1.5 inline h-3 w-3 text-slate-500" aria-hidden />
            {repCount}{" "}
            {repCount === 1
              ? "loja autorizada"
              : "lojas autorizadas"}{" "}
            na rede Kavita ·{" "}
            <a
              href="#drones-representatives"
              className="font-semibold text-emerald-300 underline-offset-2 hover:text-emerald-200 hover:underline"
            >
              ver lista
            </a>
          </p>
        )}

        {/* Hero media do admin (vídeo/imagem) — só mostra se admin
            configurou. Aparece como banner discreto entre vitrine e
            seções abaixo, não compete com as cápsulas dos modelos. */}
        <HeroAdminMedia page={page} />
      </div>
    </section>
  );
}

// ─── Cápsula individual de modelo (premium showcase) ─────────────────────

function ModelCapsule({
  model,
  active,
  onClick,
  delayMs,
}: {
  model: ShowcaseModel;
  active: boolean;
  onClick: () => void;
  delayMs?: number;
}) {
  const accent = getAccent(model.key);
  const copy = getModelCopy(model.key);
  const media = resolveCardMedia(model);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group relative shrink-0 basis-[78%] snap-start overflow-hidden rounded-[1.75rem] border bg-gradient-to-b from-white/[0.04] to-transparent text-left backdrop-blur-md transition sm:basis-auto",
        accent.ring,
        "hover:-translate-y-1 hover:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
        active ? "ring-2 ring-white/30" : "",
      ].join(" ")}
      style={delayMs ? { animationDelay: `${delayMs}ms` } : undefined}
      aria-label={`Abrir ${model.label}`}
    >
      {/* Halo accent atrás */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full blur-3xl opacity-50 transition group-hover:opacity-90",
          accent.halo,
        ].join(" ")}
      />

      {/* Mídia */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-950/40 via-slate-900 to-black">
        {media.url && media.type === "video" ? (
          <video
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
            src={media.url}
            muted
            playsInline
            loop
            preload="metadata"
          />
        ) : media.url && media.type === "image" ? (
          <Image
            src={media.url}
            alt={model.label}
            fill
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 80vw, 33vw"
          />
        ) : (
          // Fallback decorativo
          <div className="absolute inset-0">
            <div
              className={[
                "absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_50%_50%,var(--tw-gradient-stops))]",
                accent.glow,
              ].join(" ")}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                viewBox="0 0 64 64"
                className={["h-16 w-16 opacity-80", accent.text].join(" ")}
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

        {/* Gradiente para legibilidade do título */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
        />

        {/* Badge accent topo */}
        <div className="absolute left-4 top-4">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] backdrop-blur",
              accent.badgeBorder,
              accent.badgeBg,
              accent.badgeText,
            ].join(" ")}
          >
            <span className={["h-1.5 w-1.5 rounded-full", accent.dot].join(" ")} />
            {copy.badge}
          </span>
        </div>

        {/* Título sobre mídia */}
        <div className="absolute inset-x-4 bottom-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
            DJI Agras
          </p>
          <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-[1.6rem]">
            {model.label}
          </h3>
          <p className={["mt-1 text-xs font-semibold", accent.textSoft].join(" ")}>
            {copy.tagline}
          </p>
        </div>
      </div>

      {/* CTA inline */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <span className="line-clamp-1 text-[11px] text-slate-400">
          {copy.description}
        </span>
        <span
          className={[
            "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] transition group-hover:translate-x-0.5",
            accent.badgeBorder,
            accent.badgeBg,
            accent.badgeText,
          ].join(" ")}
        >
          Ver
          <ArrowRight className="h-3 w-3" aria-hidden />
        </span>
      </div>
    </button>
  );
}

// ─── Banner discreto da mídia hero do admin (opcional) ────────────────────

function HeroAdminMedia({ page }: { page: DronePageSettings }) {
  const heroVideo = page.hero_video_path
    ? absUrl(page.hero_video_path)
    : null;
  const heroImg = page.hero_image_fallback_path
    ? absUrl(page.hero_image_fallback_path)
    : null;

  if (!heroVideo && !heroImg) return null;

  return (
    <div className="kvt-fade-up kvt-delay-3 mt-14 sm:mt-16">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)] backdrop-blur-md">
        <div className="relative aspect-[16/8] sm:aspect-[16/6.5]">
          {heroVideo ? (
            <video
              className="h-full w-full object-cover"
              src={heroVideo}
              muted
              playsInline
              autoPlay
              loop
              preload="metadata"
              poster={heroImg || undefined}
            />
          ) : heroImg ? (
            <Image
              src={heroImg}
              alt="Drone agrícola Kavita em operação"
              fill
              priority
              quality={88}
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
          />
        </div>
      </div>
    </div>
  );
}
