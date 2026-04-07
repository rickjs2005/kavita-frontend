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
        className="absolute inset-0 h-full w-full object-cover"
        src={videoSrc} autoPlay loop muted playsInline preload="auto"
        poster={imageSrc} disablePictureInPicture
        onError={() => setVideoError(true)}
      />
    );
  }
  return (
    <img
      className="absolute inset-0 h-full w-full object-cover"
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

  const typeAccent: Record<string, string> = {
    promotional: "border-amber-400/40 text-amber-300",
    institutional: "border-primary/40 text-primary",
    informational: "border-sky-400/40 text-sky-300",
  };

  const Heading = isFirst ? "h1" : "h2";

  return (
    <>
      {/* Badge */}
      {slide.badge_text ? (
        <div className={`mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-lg border bg-black/30 px-3 py-1 backdrop-blur-md text-[12px] sm:text-[13px] font-semibold tracking-wider sm:tracking-widest uppercase ${typeAccent[slide.slide_type] || "border-primary/40 text-primary"}`}>
          {slide.badge_text}
        </div>
      ) : null}

      {/* Title — larger base size for mobile impact */}
      <Heading className="text-[1.75rem] sm:text-[clamp(2rem,6vw,4.5rem)] font-black leading-[0.95] tracking-tight text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]">
        {titleText}
      </Heading>

      {/* Divider — hidden on mobile, shown on sm+ */}
      <div className="hidden sm:block mt-6 h-1 w-20 rounded-full bg-primary" />

      {/* Subtitle */}
      {subtitleText ? (
        <p className="mt-3 sm:mt-5 max-w-xl text-[0.9rem] sm:text-[clamp(0.95rem,1.5vw,1.25rem)] leading-relaxed text-white/80">
          {subtitleText}
        </p>
      ) : null}

      {/* CTAs */}
      <div className="mt-6 sm:mt-10 flex flex-col gap-2.5 sm:gap-3 sm:flex-row sm:items-center">
        <Link
          href={href}
          className="
            group inline-flex w-full items-center justify-center gap-2
            rounded-xl bg-primary px-6 py-3 sm:px-7 sm:py-3.5
            text-[14px] sm:text-[15px] font-bold text-white
            shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_4px_20px_rgba(53,146,147,0.35)]
            active:scale-[0.98]
            hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_6px_28px_rgba(53,146,147,0.5)]
            transition-all duration-200
            sm:w-auto
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80
          "
        >
          {slide.button_label || "Saiba Mais"}
          <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>

        {secondaryHref && slide.button_secondary_label ? (
          <Link
            href={secondaryHref}
            className="
              inline-flex w-full items-center justify-center
              rounded-xl px-6 py-2.5 sm:px-7 sm:py-3.5
              text-[13px] sm:text-[15px] font-medium sm:font-semibold text-white/70 sm:text-white/85
              border border-white/15 sm:border-white/20
              bg-transparent sm:bg-white/[0.07]
              hover:text-white hover:bg-white/[0.1]
              backdrop-blur-sm
              transition-all duration-200
              sm:w-auto
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80
            "
          >
            {slide.button_secondary_label}
          </Link>
        ) : null}
      </div>
    </>
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
        relative w-full overflow-hidden flex flex-col
        min-h-[50vh] sm:min-h-[80vh] lg:min-h-[92vh]
      "
      aria-label="Carrossel de destaques"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      {/* ── Background ── */}
      <div key={slide.id} className="absolute inset-0 animate-[fadeIn_0.7s_ease-out]">
        <SlideBackground slide={slide} />
      </div>

      {/* ── Overlay ── */}
      {/* Mobile: stronger overall gradient (full-width text needs uniform contrast) */}
      {/* Desktop: directional gradient (text on left, media on right) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 via-50% to-black/30 sm:from-black/80 sm:via-black/30 sm:via-55% sm:to-black/20" />
      <div className="absolute inset-0 hidden sm:block bg-gradient-to-r from-black/40 via-transparent via-50% to-transparent" />
      <div className="absolute inset-0 [background:radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(53,146,147,0.08),transparent_70%)]" />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-1 flex-col justify-end sm:justify-center px-4 sm:px-8 lg:px-14 pb-0 sm:pb-0">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-2xl lg:max-w-3xl" key={slide.id}>
            <div className="animate-[fadeIn_0.5s_ease-out]">
              <SlideContent slide={slide} isFirst={current === 0} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      {total > 1 ? (
        <div className="relative z-10 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pb-8 lg:px-14">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 sm:gap-5">
            {/* Progress bars */}
            <div className="flex flex-1 items-center gap-1 sm:gap-1.5" key={progressKey}>
              {effectiveSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className="group relative h-[3px] sm:h-1 flex-1 max-w-[100px] sm:max-w-[120px] overflow-hidden rounded-full bg-white/15"
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === current ? "true" : undefined}
                >
                  <div
                    className={
                      i === current
                        ? `absolute inset-y-0 left-0 rounded-full bg-primary ${!paused ? "animate-[progressBar_linear_forwards]" : "w-full"}`
                        : i < current
                          ? "absolute inset-0 rounded-full bg-white/40"
                          : ""
                    }
                    style={i === current && !paused ? { animationDuration: `${AUTOPLAY_MS}ms` } : undefined}
                  />
                </button>
              ))}
            </div>

            {/* Arrows */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <span className="hidden text-sm font-medium tabular-nums text-white/40 sm:inline">
                {String(current + 1).padStart(2, "0")}
                <span className="mx-1 text-white/20">/</span>
                {String(total).padStart(2, "0")}
              </span>

              <button
                type="button"
                onClick={() => goTo(current - 1)}
                className="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/60 active:bg-white/20 hover:bg-white/15 hover:text-white backdrop-blur-sm transition-all"
                aria-label="Slide anterior"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => goTo(current + 1)}
                className="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/60 active:bg-white/20 hover:bg-white/15 hover:text-white backdrop-blur-sm transition-all"
                aria-label="Próximo slide"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
