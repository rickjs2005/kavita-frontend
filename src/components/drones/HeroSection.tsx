"use client";

// Hero v3 — landing /drones (showroom Kavita Drones).
// Inspiração: imagem de referência com drones DJI Agras voando sobre
// lavoura cinematográfica + HUD de specs sobreposto.
//
// Layout:
//   ┌ Coluna esquerda (texto)            ┐ Coluna direita (mídia)    ┐
//   │ Headline 3 linhas (TRANSFORMA      │ Drones DJI sobre lavoura  │
//   │   em cor accent)                   │ HUD de 4 specs sobrepostos│
//   │ Sub                                │ no canto inferior         │
//   │ 2 CTAs                             │                           │
//   │ 3 trust pills                      │                           │
//   └────────────────────────────────────┴───────────────────────────┘
//
// Sem tabs de modelo no hero — a landing apresenta a marca/produto
// como um todo. Os 3 modelos têm protagonismo na seção
// ModelsShowcase abaixo. Detalhe de cada modelo continua em
// /drones/[id].
//
// API mantida: continua aceitando models/selectedModel/onSelectModel
// para compatibilidade do DronesClient, mas o hero não os usa
// visualmente (selectedModel ainda controla SpecBar/Tech etc se
// estiverem ativos).

import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Radar,
  ShieldCheck,
  Timer,
  Droplet,
} from "lucide-react";

import type { DronePageSettings, DroneRepresentative } from "@/types/drones";
import { absUrl } from "@/utils/absUrl";

// ─── Defaults editoriais ─────────────────────────────────────────────────
const DEFAULT_HERO_SUBTITLE =
  "Soluções DJI Agriculture para pulverização e espalhamento com máxima precisão, eficiência e segurança.";
const DEFAULT_CTA_BUTTON = "Fale com um especialista";
const DEFAULT_CTA_MESSAGE =
  "Olá! Quero conhecer melhor os drones DJI Agras da Kavita.";

// HUD de 4 specs no hero. Números conservadores da categoria — não
// específicos de modelo (a landing apresenta o produto como um todo).
const HERO_SPECS = [
  { Icon: Droplet, label: "Capacidade de tanque", value: "Até 20 L" },
  { Icon: Radar, label: "Largura de pulverização", value: "Até 7 m" },
  { Icon: Timer, label: "Produtividade no campo", value: "Até 12 ha/h" },
  { Icon: ShieldCheck, label: "Detecção de obstáculos", value: "360°" },
] as const;

const TRUST_PILLS = [
  "Tecnologia DJI",
  "Suporte especializado",
  "Resultados comprovados",
] as const;

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
  template?: string | null,
) {
  const phone = String(rep.whatsapp || "").replace(/\D/g, "");
  const baseMsg = template || DEFAULT_CTA_MESSAGE;
  const text = encodeURIComponent(`${baseMsg}\n\nLoja: ${rep.name}`);
  const full = phone.startsWith("55") ? phone : `55${phone}`;
  return `https://wa.me/${full}?text=${text}`;
}

function detectMediaTypeByUrl(url: string): "image" | "video" | "" {
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return "video";
  if (/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(url)) return "image";
  return "";
}

type Props = {
  page: DronePageSettings;
  representatives: DroneRepresentative[];
  // Mantidos para compatibilidade com DronesClient — o hero não usa.
  models?: ShowcaseModel[];
  selectedModel?: string;
  onSelectModel?: (key: string) => void;
};

export default function HeroSection({
  page,
  representatives,
}: Props) {
  // Mídia hero global (vem do admin, page settings).
  const heroVideoRaw = page.hero_video_path
    ? absUrl(page.hero_video_path)
    : "";
  const heroImgRaw = page.hero_image_fallback_path
    ? absUrl(page.hero_image_fallback_path)
    : "";
  const heroMediaUrl = heroVideoRaw || heroImgRaw;
  const heroMediaType: "image" | "video" | "" = heroVideoRaw
    ? "video"
    : heroImgRaw
      ? detectMediaTypeByUrl(heroImgRaw) || "image"
      : "";

  const ctaButton =
    (page.cta_button_label || "").trim() || DEFAULT_CTA_BUTTON;
  const subtitle =
    (page.hero_subtitle || "").trim() || DEFAULT_HERO_SUBTITLE;

  const primaryCtaHref = representatives?.[0]
    ? buildWaLink(representatives[0], page.cta_message_template)
    : "#drones-representatives";

  // Headline composta com palavra TRANSFORMA destacada. Se admin
  // sobrescrever hero_title, exibe puro (sem o gradient mid). Mantém
  // controle pra quem souber que está fazendo.
  const adminTitle = (page.hero_title || "").trim();

  return (
    <section className="relative isolate overflow-hidden bg-[#050816]">
      {/* ── Camadas de fundo cinematográficas ───────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(8,16,30,0.7),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(0,0,0,0.95),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 h-[40rem] w-[40rem] rounded-full bg-emerald-500/12 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-[36rem] w-[36rem] rounded-full bg-cyan-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-soft-light bg-[linear-gradient(to_right,rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.6)_1px,transparent_1px)] bg-[size:48px_48px]"
      />

      <div className="relative mx-auto max-w-7xl px-5 pt-10 pb-14 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-14">
          {/* ── Coluna esquerda: texto ──────────────────────────────── */}
          <div className="kvt-fade-up order-2 min-w-0 lg:order-1">
            {/* Headline — 3 linhas com palavra TRANSFORMA em gradient
                cyan→emerald. Quando admin define hero_title, usamos o
                texto puro como única linha (mas perde o split visual). */}
            {adminTitle ? (
              <h1 className="text-3xl font-extrabold uppercase leading-[1.0] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-[0.98]">
                {adminTitle}
              </h1>
            ) : (
              <h1 className="text-3xl font-extrabold uppercase leading-[1.0] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.5rem] lg:leading-[0.98]">
                <span className="block">Tecnologia que</span>
                <span className="block bg-gradient-to-r from-cyan-300 via-emerald-300 to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(45,212,191,0.25)]">
                  Transforma
                </span>
                <span className="block">A sua lavoura</span>
              </h1>
            )}

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300/90 sm:text-[17px]">
              {subtitle}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={primaryCtaHref}
                target={representatives?.[0] ? "_blank" : undefined}
                rel={representatives?.[0] ? "noreferrer" : undefined}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 px-7 py-4 text-sm font-extrabold text-white shadow-[0_18px_60px_-22px_rgba(16,185,129,0.9)] transition hover:brightness-[1.08] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
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
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-extrabold text-slate-100 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.98]"
              >
                Conheça os modelos
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>

            {/* Trust pills */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              {TRUST_PILLS.map((label, i) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 text-slate-300"
                >
                  {i === 0 ? (
                    <CheckCircle2
                      className="h-3.5 w-3.5 text-emerald-400"
                      aria-hidden
                    />
                  ) : (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                      aria-hidden
                    />
                  )}
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Coluna direita: mídia + HUD ─────────────────────────── */}
          <div className="kvt-fade-in order-1 relative lg:order-2">
            <HeroStage
              mediaUrl={heroMediaUrl}
              mediaType={heroMediaType}
            />

            {/* HUD de specs — sobreposto no canto inferior em desktop,
                blocos abaixo da mídia em mobile. */}
            <div className="mt-3 lg:absolute lg:bottom-4 lg:left-4 lg:right-4 lg:mt-0">
              <div className="rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.85)] p-3 backdrop-blur-xl shadow-[0_30px_80px_-40px_rgba(0,0,0,0.95)]">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {HERO_SPECS.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center gap-2.5"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
                        <s.Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold leading-tight text-white">
                          {s.value}
                        </div>
                        <div className="text-[10.5px] leading-tight text-slate-400">
                          {s.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Stage da mídia (drones voando) ──────────────────────────────────────

function HeroStage({
  mediaUrl,
  mediaType,
}: {
  mediaUrl: string;
  mediaType: "image" | "video" | "";
}) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.75rem] sm:aspect-[5/4] sm:rounded-[2rem] lg:aspect-[1/1]">
      {/* Halo radial atrás da mídia */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(34,211,238,0.18),rgba(16,185,129,0.1)_40%,transparent_70%)]"
      />

      {mediaUrl && mediaType === "video" ? (
        <video
          className="relative h-full w-full object-cover"
          src={mediaUrl}
          muted
          playsInline
          autoPlay
          loop
          preload="metadata"
        />
      ) : mediaUrl && mediaType === "image" ? (
        <Image
          src={mediaUrl}
          alt="Drones DJI Agras Kavita em operação"
          fill
          priority
          quality={88}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="relative object-cover"
        />
      ) : (
        // Fallback decorativo cinematográfico — gradient agro-tech
        // com silhueta de drones quando admin não subiu mídia.
        <FallbackStage />
      )}

      {/* Vinheta sutil pra integrar a mídia com o fundo da página */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050816]/45 via-transparent to-transparent"
      />
    </div>
  );
}

function FallbackStage() {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-emerald-950/60 via-slate-900 to-black">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30 mix-blend-overlay bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:32px_32px]"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <svg
            viewBox="0 0 64 64"
            className="mx-auto h-24 w-24 text-emerald-300/80"
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
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-200/80">
            Kavita Drones
          </p>
        </div>
      </div>
    </div>
  );
}
