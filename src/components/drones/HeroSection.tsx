"use client";

import type { DronePageSettings, DroneRepresentative } from "@/types/drones";
import { absUrl } from "@/utils/absUrl";
import { Gauge, Leaf, Plane, ShieldCheck } from "lucide-react";

// Defaults de copy. Usados quando o admin ainda não preencheu o hero —
// evita a landing ficar vazia ou mostrar placeholder de dev em produção.
const DEFAULT_HERO_TITLE =
  "Tecnologia aérea para pulverizar, economizar e produzir mais no campo";
const DEFAULT_HERO_SUBTITLE =
  "Conheça os drones agrícolas DJI Agras da Kavita para pulverização, dispersão e operações de alta precisão — em pequenas, médias e grandes propriedades.";
const DEFAULT_CTA_TITLE = "Fale com um representante";
const DEFAULT_CTA_BUTTON = "Falar com especialista";
const DEFAULT_CTA_MESSAGE =
  "Olá! Quero conhecer melhor os drones DJI Agras da Kavita.";

// Indicadores rápidos do hero — linguagem comercial, não técnica.
// Números conservadores da categoria (não específicos de modelo).
const HERO_INDICATORS = [
  { icon: Plane, label: "Pulverização aérea" },
  { icon: Gauge, label: "Até 20 ha/hora" },
  { icon: Leaf, label: "Economia de insumo" },
  { icon: ShieldCheck, label: "Suporte regional" },
];

function buildWaLink(rep: DroneRepresentative, template?: string | null) {
  const phone = String(rep.whatsapp || "").replace(/\D/g, "");
  const msg = template || DEFAULT_CTA_MESSAGE;
  const text = encodeURIComponent(`${msg}\n\nLoja: ${rep.name}`);
  const full = phone.startsWith("55") ? phone : `55${phone}`;
  return `https://wa.me/${full}?text=${text}`;
}

export default function HeroSection({
  page,
  representatives,
}: {
  page: DronePageSettings;
  representatives: DroneRepresentative[];
}) {
  const heroVideo = page.hero_video_path
    ? absUrl(page.hero_video_path)
    : null;
  const heroImg = page.hero_image_fallback_path
    ? absUrl(page.hero_image_fallback_path)
    : null;

  const title = (page.hero_title || "").trim() || DEFAULT_HERO_TITLE;
  const subtitle =
    (page.hero_subtitle || "").trim() || DEFAULT_HERO_SUBTITLE;
  const ctaButton =
    (page.cta_button_label || "").trim() || DEFAULT_CTA_BUTTON;

  // CTA primário aponta para o primeiro representante ativo. Se não
  // houver representante, rola até a seção de representantes (onde o
  // visitante vê a lista completa e escolhe).
  const primaryCtaHref = representatives?.[0]
    ? buildWaLink(representatives[0], page.cta_message_template)
    : "#drones-representatives";

  const repCount = representatives?.length ?? 0;

  return (
    <section className="relative overflow-hidden">
      {/* fundo: gradiente escuro + halo verde que dá sensação de "profundidade premium" */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
      <div className="absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 pt-10 pb-10 sm:pt-16 sm:pb-14">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
          {/* Coluna esquerda: copy + CTAs + indicadores */}
          <div className="text-slate-100">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Kavita Drones · DJI Agras
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              {subtitle}
            </p>

            {/* CTAs principais — mais destaque para "Falar com especialista" */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={primaryCtaHref}
                target={representatives?.[0] ? "_blank" : undefined}
                rel={representatives?.[0] ? "noreferrer" : undefined}
                className="inline-flex w-full items-center justify-center rounded-full
                           bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400
                           px-7 py-3.5 text-sm font-extrabold text-white
                           shadow-[0_18px_60px_-20px_rgba(16,185,129,0.9)]
                           transition hover:brightness-110 active:scale-[0.99]
                           focus:outline-none focus:ring-2 focus:ring-emerald-400/60 sm:w-auto"
              >
                {ctaButton}
              </a>

              <a
                href="#drones-models"
                className="inline-flex w-full items-center justify-center rounded-full
                           border border-white/15 bg-white/[0.04] px-7 py-3.5
                           text-sm font-extrabold text-white transition
                           hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-white/20 sm:w-auto"
              >
                Ver modelos
              </a>
            </div>

            {/* Indicadores rápidos: linguagem comercial, alta visibilidade */}
            <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {HERO_INDICATORS.map((ind) => (
                <div
                  key={ind.label}
                  className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <ind.icon className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                  <span className="text-[12px] font-extrabold text-slate-100">
                    {ind.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Link sutil para ver representantes (substitui os 4 cards no hero) */}
            {repCount > 0 && (
              <p className="mt-5 text-xs text-slate-400">
                {repCount} {repCount === 1 ? "representante autorizado" : "representantes autorizados"} na rede Kavita ·{" "}
                <a
                  href="#drones-representatives"
                  className="font-semibold text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline"
                >
                  ver lista completa
                </a>
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.6)]">
            {heroVideo ? (
              <video
                className="w-full rounded-2xl aspect-video object-cover bg-black/30"
                src={heroVideo}
                controls
                playsInline
                preload="metadata"
                poster={heroImg || undefined}
              />
            ) : heroImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="w-full rounded-2xl aspect-video object-cover bg-black/30"
                src={heroImg}
                alt="Drone agrícola DJI Agras em operação"
                loading="eager"
              />
            ) : (
              // Fallback neutro — sem texto de admin vazando para o produtor.
              // Gradiente agro/tech com ícone sutil mantém o hero coerente
              // mesmo enquanto o conteúdo não é configurado no admin.
              <div
                className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-emerald-900/50 via-slate-900 to-emerald-950"
                aria-label="Drone agrícola Kavita"
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.25),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.18),transparent_55%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-6">
                    <svg
                      viewBox="0 0 64 64"
                      className="mx-auto h-14 w-14 text-emerald-300/80"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
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
                    <p className="mt-3 text-sm font-semibold text-emerald-100">
                      Kavita Drones
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      DJI Agras para o campo brasileiro
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
