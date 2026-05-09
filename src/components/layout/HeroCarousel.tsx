"use client";

// src/components/layout/HeroCarousel.tsx
//
// Hero rotativo da home pública. Layout 2 colunas (≥md): texto à
// esquerda sobre fundo verde escuro, imagem do slide à direita
// (full-bleed). Mobile: stack vertical, texto sobre imagem com
// overlay escurecido.
//
// Schema do slide (HeroSlide) — não alterado:
//   id, title, subtitle, badge_text, slide_type,
//   hero_image_url|path, hero_video_url|path,
//   button_label/href, button_secondary_label/href,
//   sort_order, is_active, starts_at, ends_at, ...
//
// Detalhes visuais:
//   - última palavra do `title` recebe cor emerald-400 via split
//     (mantém o título inteiro em um único nó textual quando
//     necessário; aqui não há test que dependa disso, mas o split
//     é resiliente a slides curtos)
//   - 3 mini-features fixos abaixo do CTA (Negociação segura /
//     Melhores preços / +Transparência) — são "garantias" da
//     plataforma, não do slide; não vêm do backend
//   - autoplay 7s, pausa em hover/touch
//   - setas circulares ABS no eixo central (esquerda/direita)
//   - 3 dots simples no rodapé (vs progress-bar antigo)
//
// Preservado: video support, fallback de imagem com onError,
// sanitizeUrl, A11y (aria-label/-roledescription/-current).

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { HeroSlide } from "@/types/heroSlide";
import { absUrl } from "@/utils/absUrl";
import { sanitizeUrl } from "@/lib/sanitizeHtml";

const DEFAULT_IMG = "/images/drone/fallback-hero-v2.jpg";
const LEGACY_FALLBACK_IMG = "/images/drone/fallback-hero1.jpg";
const AUTOPLAY_MS = 7000;

function normalizeHref(href?: string | null) {
  const v = String(href || "").trim();
  if (!v) return "/drones";
  const n =
    v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://")
      ? v
      : `/${v}`;
  return sanitizeUrl(n) || "/drones";
}

function resolveMedia(slide: HeroSlide) {
  const videoRaw = slide.hero_video_url || slide.hero_video_path || "";
  const imageRaw = slide.hero_image_url || slide.hero_image_path || "";
  return {
    videoSrc: videoRaw ? absUrl(videoRaw) : "",
    imageSrc: imageRaw
      ? imageRaw.startsWith("/images/")
        ? imageRaw
        : absUrl(imageRaw)
      : DEFAULT_IMG,
  };
}

/**
 * Separa o título em "início" + "última palavra" para que a última
 * palavra possa ser destacada com cor diferente. Slides com 1 palavra
 * não são fragmentados (highlight === "" e head === título inteiro).
 */
function splitTitleHighlight(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return { head: "", highlight: "" };
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace === -1) return { head: "", highlight: trimmed };
  return {
    head: trimmed.slice(0, lastSpace),
    highlight: trimmed.slice(lastSpace + 1),
  };
}

const FALLBACK_SLIDE: HeroSlide = {
  id: 0,
  title: "Venda seu café com mais segurança",
  subtitle:
    "Encontre corretoras confiáveis, acompanhe oportunidades e negocie com mais transparência e melhores condições.",
  badge_text: "Mercado do Café",
  slide_type: "institutional",
  hero_video_url: null,
  hero_video_path: null,
  hero_image_url: null,
  hero_image_path: null,
  button_label: "Ver corretoras",
  button_href: "/mercado-do-cafe",
  button_secondary_label: null,
  button_secondary_href: null,
  sort_order: 0,
  is_active: 1,
  starts_at: null,
  ends_at: null,
  created_at: "",
  updated_at: "",
};

// ── Background ─────────────────────────────────────────────────

function SlideBackground({ slide }: { slide: HeroSlide }) {
  const [videoError, setVideoError] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const { videoSrc, imageSrc } = resolveMedia(slide);

  useEffect(() => {
    setVideoError(false);
    setImgFailed(false);
  }, [slide.id]);

  if (videoSrc && !videoError) {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={imageSrc}
        disablePictureInPicture
        onError={() => setVideoError(true)}
      />
    );
  }

  const src = imgFailed
    ? LEGACY_FALLBACK_IMG
    : sanitizeUrl(imageSrc) || DEFAULT_IMG;

  return (
    <Image
      src={src}
      alt=""
      fill
      priority
      quality={90}
      sizes="100vw"
      className="object-cover"
      onError={() => setImgFailed(true)}
    />
  );
}

// ── Mini-features fixos abaixo do CTA ─────────────────────────

const FEATURES = [
  {
    title: "Negociação segura",
    subtitle: "Ambiente protegido",
    Icon: function ShieldF() {
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3l8 3v6c0 4.5-3.2 8.5-8 10-4.8-1.5-8-5.5-8-10V6l8-3z" />
          <path d="M9 12l2.2 2.2L15.5 10" />
        </svg>
      );
    },
  },
  {
    title: "Melhores preços",
    subtitle: "Compare e negocie",
    Icon: function TrendF() {
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );
    },
  },
  {
    title: "+ Transparência",
    subtitle: "Informações claras",
    Icon: function ClockF() {
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      );
    },
  },
];

// ── Conteúdo do slide (texto à esquerda) ──────────────────────

function SlideContent({
  slide,
  isFirst,
}: {
  slide: HeroSlide;
  isFirst: boolean;
}) {
  const titleText =
    String(slide.title || "").trim() || "Venda seu café com mais segurança";
  const subtitleText = String(slide.subtitle || "").trim();
  const href = normalizeHref(slide.button_href);

  const { head, highlight } = splitTitleHighlight(titleText);

  const Heading = isFirst ? "h1" : "h2";

  return (
    <>
      {/* Pill — badge_text com ícone discreto */}
      {slide.badge_text ? (
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300 ring-1 ring-emerald-400/40 backdrop-blur-sm sm:text-[11px]">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M20 4c-7 0-13 4-13 11 0 2.5 1.5 5 4 5 7 0 9-9 9-16z" />
            <path d="M7 20c2-4 5-7 9-9" />
          </svg>
          {slide.badge_text}
        </span>
      ) : null}

      {/* Título — última palavra em emerald-400 */}
      <Heading className="mt-4 text-[clamp(1.85rem,5vw,3.25rem)] font-extrabold leading-[1.05] tracking-tight text-white sm:mt-5 [text-shadow:0_1px_18px_rgba(0,0,0,0.55)]">
        {head ? (
          <>
            {head}
            {highlight ? (
              <>
                {" "}
                <span className="text-emerald-400">{highlight}</span>
              </>
            ) : null}
          </>
        ) : (
          highlight
        )}
      </Heading>

      {/* Subtítulo */}
      {subtitleText ? (
        <p className="mt-3 max-w-[34rem] text-[14px] leading-relaxed text-white/80 sm:mt-4 sm:text-base">
          {subtitleText}
        </p>
      ) : null}

      {/* CTA principal */}
      <Link
        href={href}
        className="mt-5 inline-flex w-fit items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-[14px] font-bold text-white shadow-[0_12px_28px_-8px_rgba(16,185,129,0.65)] transition-all hover:bg-emerald-400 hover:shadow-[0_16px_32px_-8px_rgba(16,185,129,0.75)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:mt-6 sm:px-7 sm:py-3.5 sm:text-[15px]"
      >
        {slide.button_label || "Saiba mais"}
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      </Link>

      {/* 3 mini-features — garantias da plataforma (não vêm do slide) */}
      <ul className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
        {FEATURES.map(({ title, subtitle, Icon }) => (
          <li
            key={title}
            className="flex items-start gap-2.5 sm:flex-col sm:items-start sm:gap-2"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 backdrop-blur-sm sm:h-10 sm:w-10">
              <Icon />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight text-white sm:text-sm">
                {title}
              </p>
              <p className="text-[11px] leading-tight text-white/55 sm:text-[12px]">
                {subtitle}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

// ── Carousel ───────────────────────────────────────────────────

type Props = {
  slides: HeroSlide[];
  className?: string;
};

export default function HeroCarousel({ slides, className = "" }: Props) {
  const effectiveSlides = slides.length > 0 ? slides : [FALLBACK_SLIDE];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = effectiveSlides.length;

  const goTo = useCallback(
    (idx: number) => {
      setCurrent(((idx % total) + total) % total);
    },
    [total],
  );

  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, paused]);

  if (effectiveSlides.length === 0) return null;
  const slide = effectiveSlides[current];

  return (
    <section
      className={`relative w-full overflow-hidden bg-[#06343a] ${className}`}
      aria-label="Carrossel de destaques"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Background — imagem/vídeo do slide. No desktop com layout
          2-cols, gradient horizontal escurece o lado esquerdo para o
          texto ficar legível; no mobile, gradient vertical do topo
          ao rodapé sustenta o texto sobre a imagem inteira. */}
      <div
        key={slide.id}
        className="absolute inset-0 animate-[fadeIn_0.6s_ease-out]"
      >
        <SlideBackground slide={slide} />
      </div>

      {/* Overlay — desktop: vertical à esquerda; mobile: do rodapé */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30 sm:bg-gradient-to-r sm:from-[#06343a] sm:via-[#06343a]/85 sm:via-40% sm:to-transparent" />

      {/* Conteúdo — 2 colunas no md+, 1 col no mobile */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 px-4 py-10 sm:grid-cols-[1.1fr_1fr] sm:gap-8 sm:px-8 sm:py-14 lg:px-14 lg:py-20">
        <div className="flex max-w-2xl flex-col">
          <SlideContent slide={slide} isFirst={current === 0} />
        </div>
        {/* 2ª coluna fica vazia no DOM — a imagem aparece pelo
            background à direita graças ao gradiente. Mantida como
            spacer no grid para o texto não invadir o lado direito
            no desktop. */}
        <div aria-hidden className="hidden sm:block" />
      </div>

      {/* Setas — desktop somente, ABS verticalmente centradas */}
      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            aria-label="Slide anterior"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/85 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:flex sm:h-11 sm:w-11 lg:left-6 lg:h-12 lg:w-12"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goTo(current + 1)}
            aria-label="Próximo slide"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white/85 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:flex sm:h-11 sm:w-11 lg:right-6 lg:h-12 lg:w-12"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      ) : null}

      {/* Dots — embaixo, centralizados */}
      {total > 1 ? (
        <div className="relative z-10 flex items-center justify-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:pb-6 sm:pt-0">
          {effectiveSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir para slide ${i + 1}`}
              aria-current={i === current ? "true" : undefined}
              className={
                i === current
                  ? "h-2 w-9 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)] transition-all duration-300"
                  : "h-2 w-2 rounded-full bg-white/30 transition-all duration-300 hover:bg-white/60"
              }
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
