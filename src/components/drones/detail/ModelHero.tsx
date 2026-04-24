"use client";

// Hero premium da página de detalhe /drones/[id].
// Substitui o bloco inline que existia na page antiga.
//
// Estrutura:
// - Fundo full-bleed com mídia (video/image) + gradientes cinematográficos
// - Eyebrow com accent do modelo (cyan/emerald/amber)
// - H1 grande com o nome do modelo
// - Tagline comercial abaixo
// - 3 chips de especificação rápida (capacidade, vazão, autonomia)
// - 2 CTAs (primário com accent + secundário neutro)
// - Halo radial decorativo atrás do texto para contraste sobre mídia

import { ArrowRight, MessageCircle } from "lucide-react";
import type { Accent } from "./accent";

type Chip = { label: string; value: string };

type Props = {
  modelLabel: string;
  eyebrow: string;          // "DJI Agras · Linha Kavita"
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
    <section className="relative overflow-hidden">
      {/* Mídia full-bleed */}
      <div className="absolute inset-0">
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="h-full w-full object-cover"
            src={heroUrl}
            alt={modelLabel}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-900 via-dark-900 to-black" />
        )}

        {/* Gradientes cinematográficos sobre a mídia */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        {/* Halo radial com accent do modelo */}
        <div
          className={[
            "pointer-events-none absolute -left-32 -top-32 h-[36rem] w-[36rem] rounded-full blur-3xl opacity-60",
            accent.halo,
          ].join(" ")}
        />
        <div
          className={[
            "pointer-events-none absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-40",
            accent.halo,
          ].join(" ")}
        />
      </div>

      {/* Conteúdo */}
      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:py-28 md:py-36">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <div
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] backdrop-blur",
              accent.badgeBorder,
              accent.badgeBg,
              accent.badgeText,
            ].join(" ")}
          >
            <span className={["h-1.5 w-1.5 rounded-full", accent.dot].join(" ")} />
            {eyebrow}
          </div>

          {/* Título */}
          <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-white">
            {modelLabel}
          </h1>

          {/* Tagline */}
          <p
            className={[
              "mt-4 text-lg sm:text-xl font-semibold",
              accent.textSoft,
            ].join(" ")}
          >
            {tagline}
          </p>

          {/* Descrição */}
          <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-200/90">
            {description}
          </p>

          {/* Chips de especificação — só aparecem se tivermos 3 slots */}
          {chips.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <div
                  key={`${c.label}-${i}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-2 backdrop-blur"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {c.label}
                  </span>
                  <span className={["text-sm font-extrabold", accent.text].join(" ")}>
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button
              onClick={onTalkToRep}
              className={[
                "group inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-extrabold text-white transition",
                "bg-gradient-to-r",
                accent.primaryGradient,
                accent.primaryShadow,
                "hover:brightness-[1.08] active:scale-[0.99]",
              ].join(" ")}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Falar com representante
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </button>

            <button
              onClick={onScrollToSpecs}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-3.5 text-sm font-extrabold text-slate-100 backdrop-blur hover:bg-white/10 active:scale-[0.99]"
            >
              Ver especificações
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
