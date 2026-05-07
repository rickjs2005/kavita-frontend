"use client";

// Hero cinematográfico da página /drones/[id].
// Layout 50/50 desktop com texto à esquerda e mídia destacada à
// direita (cápsula com glow accent + halos radiais). No mobile,
// empilha verticalmente mantendo a presença forte da mídia.
//
// Mantém a mesma API de Props da versão anterior — page.tsx não
// precisa mudar nada.

import Image from "next/image";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import type { Accent } from "./accent";

type Chip = { label: string; value: string };

type Props = {
  modelLabel: string;
  eyebrow: string;
  tagline: string;
  description: string;
  heroUrl: string;
  heroType: "image" | "video" | "";
  accent: Accent;
  chips: Chip[];
  onTalkToRep: () => void;
  onScrollToSpecs: () => void;
};

export default function ModelHero({
  modelLabel,
  eyebrow,
  tagline,
  description,
  heroUrl,
  heroType,
  accent,
  chips,
  onTalkToRep,
  onScrollToSpecs,
}: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-[#050816]">
      {/* Camadas de fundo cinematográficas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(8,16,30,0.7),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.95),transparent_70%)]"
      />
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute -left-40 top-10 h-[40rem] w-[40rem] rounded-full blur-3xl opacity-50",
          accent.halo,
        ].join(" ")}
      />
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute -right-40 bottom-0 h-[34rem] w-[34rem] rounded-full blur-3xl opacity-40",
          accent.halo,
        ].join(" ")}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-soft-light bg-[linear-gradient(to_right,rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-[size:48px_48px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* ── Coluna esquerda: copy ───────────────────────────── */}
          <div className="kvt-fade-up">
            {/* Eyebrow */}
            <div
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] backdrop-blur",
                accent.badgeBorder,
                accent.badgeBg,
                accent.badgeText,
              ].join(" ")}
            >
              <span className={["h-1.5 w-1.5 rounded-full", accent.dot].join(" ")} />
              {eyebrow}
            </div>

            {/* Título — escala cinematográfica. Mobile cap em 4xl (36px)
                pra não estourar 320px; sobe pra 6xl em md e 7xl em lg. */}
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.0] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl lg:leading-[0.95]">
              {modelLabel}
            </h1>

            {/* Tagline */}
            <p
              className={[
                "mt-5 text-lg sm:text-xl lg:text-2xl font-semibold leading-snug",
                accent.textSoft,
              ].join(" ")}
            >
              {tagline}
            </p>

            {/* Descrição */}
            <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-slate-300/90">
              {description}
            </p>

            {/* Chips de specs rápidas */}
            {chips.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {chips.map((c, i) => (
                  <div
                    key={`${c.label}-${i}`}
                    className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-md transition hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                      {c.label}
                    </span>
                    <span
                      className={[
                        "text-sm font-extrabold tabular-nums",
                        accent.text,
                      ].join(" ")}
                    >
                      {c.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                onClick={onTalkToRep}
                className={[
                  "group inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-extrabold text-white transition",
                  "bg-gradient-to-r",
                  accent.primaryGradient,
                  accent.primaryShadow,
                  "hover:brightness-[1.08] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/40",
                ].join(" ")}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Falar com representante
                <ArrowRight
                  className="h-4 w-4 transition group-hover:translate-x-0.5"
                  aria-hidden
                />
              </button>

              <button
                onClick={onScrollToSpecs}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-extrabold text-slate-100 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                Ver especificações
              </button>
            </div>

            {/* Selo autoridade DJI */}
            <div className="mt-6 inline-flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck
                className={["h-3.5 w-3.5", accent.text].join(" ")}
                aria-hidden
              />
              Representante autorizada DJI · Manhuaçu · Espera Feliz · Cachoeira do Itapemirim
            </div>
          </div>

          {/* ── Coluna direita: cápsula da mídia ─────────────────── */}
          <div className="relative kvt-fade-up kvt-delay-1">
            {/* Halo radial atrás da cápsula */}
            <div
              aria-hidden
              className={[
                "pointer-events-none absolute -inset-6 rounded-[2.5rem] blur-2xl opacity-60",
                accent.halo,
              ].join(" ")}
            />

            <div
              className={[
                "relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-1.5 backdrop-blur-xl",
                accent.ring,
                "shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]",
              ].join(" ")}
            >
              {/* Gradiente interno simulando "ambiente agrícola" desfocado */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-gradient-to-br from-emerald-950/40 via-slate-900 to-black">
                {heroUrl && heroType === "video" ? (
                  <video
                    className="h-full w-full object-cover"
                    src={heroUrl}
                    muted
                    playsInline
                    autoPlay
                    loop
                    preload="metadata"
                  />
                ) : heroUrl && heroType === "image" ? (
                  <Image
                    src={heroUrl}
                    alt={modelLabel}
                    fill
                    priority
                    quality={88}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  // Fallback decorativo — drone-grid + halos
                  <div className="absolute inset-0">
                    <div
                      className={[
                        "absolute inset-0 opacity-70",
                        "bg-[radial-gradient(circle_at_50%_50%,var(--tw-gradient-stops))]",
                        accent.glow,
                      ].join(" ")}
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-30 mix-blend-overlay bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:32px_32px]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        viewBox="0 0 64 64"
                        className={["h-24 w-24 opacity-80", accent.text].join(" ")}
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

                {/* Gradiente de profundidade sobre a mídia */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                />

                {/* Badge "Autorizada DJI" flutuante no topo */}
                <div className="absolute left-4 top-4">
                  <span
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md",
                      accent.badgeBorder,
                      accent.badgeBg,
                      accent.badgeText,
                    ].join(" ")}
                  >
                    <span
                      className={["h-1.5 w-1.5 rounded-full", accent.dot].join(" ")}
                    />
                    Autorizada DJI Agras
                  </span>
                </div>

                {/* Etiqueta de modelo no canto inferior */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">
                      Linha
                    </p>
                    <p className="text-sm font-extrabold tracking-tight text-white">
                      DJI Agras
                    </p>
                  </div>
                  <div
                    className={[
                      "rounded-xl border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-md",
                      accent.badgeBorder,
                      "bg-black/40",
                      accent.badgeText,
                    ].join(" ")}
                  >
                    {modelLabel}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
