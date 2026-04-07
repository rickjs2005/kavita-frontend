"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { HeroSlide } from "@/types/heroSlide";
import { absUrl } from "@/utils/absUrl";
import { sanitizeUrl } from "@/lib/sanitizeHtml";

const DEFAULT_IMG = "/images/drone/fallback-hero1.jpg";
const AUTOPLAY_MS = 5000;

function normalizeHref(href?: string | null) {
  const v = String(href || "").trim();
  if (!v) return "/drones";
  const n = v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://") ? v : `/${v}`;
  return sanitizeUrl(n) || "/drones";
}

function resolveMedia(slide: HeroSlide) {
  const videoRaw = slide.hero_video_url || slide.hero_video_path || "";
  const imageRaw = slide.hero_image_url || slide.hero_image_path || "";
  return {
    videoSrc: videoRaw ? absUrl(videoRaw) : "",
    imageSrc: imageRaw ? (imageRaw.startsWith("/images/") ? imageRaw : absUrl(imageRaw)) : DEFAULT_IMG,
  };
}

const FALLBACK_SLIDE: HeroSlide = {
  id: 0, title: "Revolucione sua Gestão Agrícola",
  subtitle: "Conheça a tecnologia que otimiza o monitoramento e a eficiência no campo.",
  badge_text: "Tecnologia para o campo", slide_type: "institutional",
  hero_video_url: null, hero_video_path: null, hero_image_url: null, hero_image_path: null,
  button_label: "Saiba Mais", button_href: "/drones",
  button_secondary_label: "Falar com um especialista", button_secondary_href: "/contatos",
  sort_order: 0, is_active: 1, starts_at: null, ends_at: null, created_at: "", updated_at: "",
};

// ── Background ──────────────────────────────────────────────────────────────

function SlideBackground({ slide }: { slide: HeroSlide }) {
  const [videoError, setVideoError] = useState(false);
  const { videoSrc, imageSrc } = resolveMedia(slide);

  useEffect(() => setVideoError(false), [slide.id]);

  if (videoSrc && !videoError) {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover scale-[1.02]"
        src={videoSrc}
        autoPlay loop muted playsInline preload="auto"
        poster={imageSrc} disablePictureInPicture
        onError={() => setVideoError(true)}
      />
    );
  }

  return (
    <img
      className="absolute inset-0 h-full w-full object-cover scale-[1.02]"
      src={sanitizeUrl(imageSrc) || DEFAULT_IMG}
      alt="" loading="eager" decoding="async"
    />
  );
}

// ── Content ─────────────────────────────────────────────────────────────────

function SlideContent({ slide, isFirst }: { slide: HeroSlide; isFirst: boolean }) {
  const titleText = String(slide.title || "").trim() || "Revolucione sua Gestão Agrícola";
  const subtitleText = String(slide.subtitle || "").trim();
  const href = normalizeHref(slide.button_href);
  const secondaryHref = slide.button_secondary_href ? normalizeHref(slide.button_secondary_href) : null;

  const typeColors: Record<string, string> = {
    promotional: "bg-amber-400", institutional: "bg-primary", informational: "bg-sky-400",
  };

  const Heading = isFirst ? "h1" : "h2";

  return (
    <div className="max-w-4xl">
      {/* Badge */}
      {slide.badge_text ? (
        <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.08] px-4 py-1.5 backdrop-blur-sm">
          <span className={`h-2 w-2 rounded-full ${typeColors[slide.slide_type] || "bg-primary"} ring-2 ring-white/20`} />
          <span className="text-[13px] font-medium tracking-wide text-white/90 uppercase">
            {slide.badge_text}
          </span>
        </div>
      ) : null}

      {/* Title */}
      <Heading
        className="
          font-extrabold tracking-tight text-white
          text-[clamp(2.25rem,5.5vw,5rem)]
          leading-[0.95]
          drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]
        "
      >
        {titleText}
      </Heading>

      {/* Subtitle */}
      {subtitleText ? (
        <p className="mt-5 max-w-2xl text-[clamp(1rem,1.8vw,1.4rem)] leading-relaxed text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
          {subtitleText}
        </p>
      ) : null}

      {/* CTAs */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={href}
          className="
            group inline-flex w-full sm:w-auto items-center justify-center gap-2
            rounded-2xl px-8 py-4
            text-[15px] font-bold text-white
            bg-primary hover:bg-primary-hover
            shadow-[0_4px_24px_rgba(53,146,147,0.4)]
            hover:shadow-[0_6px_32px_rgba(53,146,147,0.55)]
            transition-all duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40
          "
        >
          {slide.button_label || "Saiba Mais"}
          <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {secondaryHref && slide.button_secondary_label ? (
          <Link
            href={secondaryHref}
            className="
              inline-flex w-full sm:w-auto items-center justify-center gap-2
              rounded-2xl px-8 py-4
              text-[15px] font-semibold text-white/90
              border border-white/25 bg-white/[0.06] hover:bg-white/[0.12]
              backdrop-blur-sm
              transition-all duration-200
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40
            "
          >
            {slide.button_secondary_label}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

// ── Carousel ────────────────────────────────────────────────────────────────

type Props = { slides: HeroSlide[] };

export default function HeroCarousel({ slides }: Props) {
  const effectiveSlides = slides.length > 0 ? slides : [FALLBACK_SLIDE];
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [progressKey, setProgressKey] = useState(0);
  const total = effectiveSlides.length;

  const goTo = useCallback((idx: number) => {
    setCurrent(((idx % total) + total) % total);
    setProgressKey((k) => k + 1);
  }, [total]);

  useEffect(() => {
    if (total <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
      setProgressKey((k) => k + 1);
    }, AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total, paused]);

  if (effectiveSlides.length === 0) return null;
  const slide = effectiveSlides[current];

  return (
    <section
      className="
        relative w-full overflow-hidden
        min-h-[60vh] sm:min-h-[75vh] md:min-h-[90vh] lg:min-h-[95vh]
        flex items-end
      "
      aria-label="Carrossel de destaques"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* Background media */}
      <div key={slide.id} className="absolute inset-0 animate-[fadeIn_0.7s_ease-out]">
        <SlideBackground slide={slide} />
      </div>

      {/* Cinematic overlay — multi-stop gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 via-40% to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent via-60% to-transparent" />

      {/* Content — positioned at bottom with generous padding */}
      <div className="relative z-10 w-full px-5 sm:px-8 lg:px-12 pb-10 sm:pb-14 lg:pb-16 pt-32">
        <div className="mx-auto w-full max-w-7xl">
          <div className="flex items-end justify-between gap-8">
            {/* Text block */}
            <div key={slide.id} className="flex-1 animate-[fadeIn_0.5s_ease-out]">
              <SlideContent slide={slide} isFirst={current === 0} />
            </div>

            {/* Side navigation (desktop only) */}
            {total > 1 ? (
              <div className="hidden lg:flex flex-col items-center gap-3 pb-4">
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  className="
                    inline-flex h-11 w-11 items-center justify-center
                    rounded-full border border-white/25 bg-white/[0.08]
                    text-white/80 hover:bg-white/20 backdrop-blur-sm
                    transition-all duration-200
                  "
                  aria-label="Slide anterior"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                {/* Vertical dots */}
                <div className="flex flex-col items-center gap-2 py-2">
                  {effectiveSlides.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => goTo(i)}
                      className={`rounded-full transition-all duration-300 ${
                        i === current
                          ? "h-8 w-2.5 bg-white"
                          : "h-2.5 w-2.5 bg-white/35 hover:bg-white/60"
                      }`}
                      aria-label={`Slide ${i + 1}`}
                      aria-current={i === current ? "true" : undefined}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => goTo(current + 1)}
                  className="
                    inline-flex h-11 w-11 items-center justify-center
                    rounded-full border border-white/25 bg-white/[0.08]
                    text-white/80 hover:bg-white/20 backdrop-blur-sm
                    transition-all duration-200
                  "
                  aria-label="Próximo slide"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            ) : null}
          </div>

          {/* Bottom bar: progress + mobile nav + counter */}
          {total > 1 ? (
            <div className="mt-8 flex items-center gap-4">
              {/* Progress bar */}
              <div className="flex-1 max-w-sm" key={progressKey}>
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/15">
                  <div
                    className={`h-full rounded-full bg-primary ${!paused ? "animate-[progressBar_linear_forwards]" : "w-0"}`}
                    style={!paused ? { animationDuration: `${AUTOPLAY_MS}ms` } : undefined}
                  />
                </div>
              </div>

              {/* Mobile navigation */}
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white/70 hover:bg-white/15 backdrop-blur-sm transition"
                  aria-label="Slide anterior"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => goTo(current + 1)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white/70 hover:bg-white/15 backdrop-blur-sm transition"
                  aria-label="Próximo slide"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Counter */}
              <span className="text-sm font-medium text-white/50 tabular-nums tracking-wider">
                {String(current + 1).padStart(2, "0")}
                <span className="mx-1.5 text-white/25">/</span>
                {String(total).padStart(2, "0")}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
