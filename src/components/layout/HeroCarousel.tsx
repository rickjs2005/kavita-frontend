"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { HeroSlide } from "@/types/heroSlide";
import { absUrl } from "@/utils/absUrl";
import { sanitizeUrl } from "@/lib/sanitizeHtml";

const DEFAULT_IMG = "/images/drone/fallback-hero1.jpg";
const AUTOPLAY_MS = 6000;

function normalizeHref(href?: string | null) {
  const v = String(href || "").trim();
  if (!v) return "/drones";
  const normalized =
    v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://")
      ? v
      : `/${v}`;
  return sanitizeUrl(normalized) || "/drones";
}

function resolveMedia(slide: HeroSlide) {
  const videoRaw = slide.hero_video_url || slide.hero_video_path || "";
  const imageRaw = slide.hero_image_url || slide.hero_image_path || "";
  return {
    videoSrc: videoRaw ? absUrl(videoRaw) : "",
    imageSrc: imageRaw
      ? imageRaw.startsWith("/images/") ? imageRaw : absUrl(imageRaw)
      : DEFAULT_IMG,
  };
}

// Static fallback when no slides exist (migration should seed one, but just in case)
const FALLBACK_SLIDE: HeroSlide = {
  id: 0,
  title: "Revolucione sua Gestão Agrícola",
  subtitle: "Conheça a tecnologia que otimiza o monitoramento e a eficiência no campo.",
  badge_text: "Tecnologia para o campo",
  slide_type: "institutional",
  hero_video_url: null,
  hero_video_path: null,
  hero_image_url: null,
  hero_image_path: null,
  button_label: "Saiba Mais",
  button_href: "/drones",
  button_secondary_label: "Falar com um especialista",
  button_secondary_href: "/contatos",
  sort_order: 0,
  is_active: 1,
  starts_at: null,
  ends_at: null,
  created_at: "",
  updated_at: "",
};

// ── Slide Background ────────────────────────────────────────────────────────

function SlideBackground({ slide }: { slide: HeroSlide }) {
  const [videoError, setVideoError] = useState(false);
  const { videoSrc, imageSrc } = resolveMedia(slide);

  useEffect(() => setVideoError(false), [slide.id]);

  if (videoSrc && !videoError) {
    return (
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster={imageSrc}
        onError={() => setVideoError(true)}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 bg-cover bg-center"
      style={{ backgroundImage: `url('${sanitizeUrl(imageSrc) || DEFAULT_IMG}')` }}
    />
  );
}

// ── Slide Content ───────────────────────────────────────────────────────────

function SlideContent({ slide, isFirst }: { slide: HeroSlide; isFirst: boolean }) {
  const titleText = String(slide.title || "").trim() || "Revolucione sua Gestão Agrícola";
  const subtitleText = String(slide.subtitle || "").trim();
  const href = normalizeHref(slide.button_href);
  const secondaryHref = slide.button_secondary_href
    ? normalizeHref(slide.button_secondary_href)
    : null;

  const typeColors: Record<string, string> = {
    promotional: "bg-amber-500",
    institutional: "bg-primary",
    informational: "bg-sky-500",
  };

  // First visible slide gets h1 for SEO; subsequent slides get h2
  const Heading = isFirst ? "h1" : "h2";

  return (
    <div className="max-w-3xl">
      {slide.badge_text ? (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur">
          <span className={`h-1.5 w-1.5 rounded-full ${typeColors[slide.slide_type] || "bg-primary"}`} />
          {slide.badge_text}
        </div>
      ) : null}

      <Heading
        className="
          font-extrabold tracking-tight text-white
          text-[clamp(1.75rem,4.8vw,4.2rem)]
          leading-[1.05]
        "
      >
        {titleText}
      </Heading>

      {subtitleText ? (
        <p className="mt-4 text-[clamp(0.95rem,1.6vw,1.35rem)] leading-relaxed text-white/85">
          {subtitleText}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href={href}
          className="
            inline-flex w-full sm:w-auto items-center justify-center
            rounded-xl px-6 py-3
            text-sm font-semibold text-white
            bg-primary hover:bg-primary-hover
            shadow-lg shadow-black/30
            transition
            focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40
          "
        >
          {slide.button_label || "Saiba Mais"}
        </Link>

        {secondaryHref && slide.button_secondary_label ? (
          <Link
            href={secondaryHref}
            className="
              inline-flex w-full sm:w-auto items-center justify-center
              rounded-xl px-6 py-3
              text-sm font-semibold text-white/90
              border border-white/20 bg-white/5 hover:bg-white/10
              backdrop-blur transition
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

// ── Main Carousel ───────────────────────────────────────────────────────────

type Props = {
  slides: HeroSlide[];
};

export default function HeroCarousel({ slides }: Props) {
  const effectiveSlides = slides.length > 0 ? slides : [FALLBACK_SLIDE];

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = effectiveSlides.length;

  const goTo = useCallback(
    (idx: number) => setCurrent(((idx % total) + total) % total),
    [total],
  );

  // Autoplay — pauses on hover AND touch
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
      className="
        relative w-full overflow-hidden
        min-h-[56vh] sm:min-h-[72vh] md:min-h-[88vh] lg:min-h-[92vh]
        flex items-center
      "
      aria-label="Carrossel de destaques"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div key={slide.id} className="absolute inset-0 animate-[fadeIn_0.6s_ease-out]">
        <SlideBackground slide={slide} />
      </div>

      {/* Overlay — single layer, lighter to keep video visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/60" />

      {/* Content */}
      <div
        className="
          relative z-10 w-full
          px-4 sm:px-6 lg:px-10
          pt-[max(4rem,env(safe-area-inset-top))]
          pb-[max(2.5rem,env(safe-area-inset-bottom))]
        "
      >
        <div className="mx-auto w-full max-w-6xl">
          <div key={slide.id} className="animate-[fadeIn_0.5s_ease-out]">
            <SlideContent slide={slide} isFirst={current === 0} />
          </div>

          {/* Navigation */}
          {total > 1 ? (
            <div className="mt-8 flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goTo(current - 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white/80 hover:bg-white/10 backdrop-blur transition"
                  aria-label="Slide anterior"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => goTo(current + 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white/80 hover:bg-white/10 backdrop-blur transition"
                  aria-label="Próximo slide"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-2">
                {effectiveSlides.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`h-2.5 rounded-full transition-all ${
                      i === current
                        ? "w-7 bg-white"
                        : "w-2.5 bg-white/40 hover:bg-white/60"
                    }`}
                    aria-label={`Ir para slide ${i + 1}`}
                  />
                ))}
              </div>

              <span className="text-xs text-white/50 tabular-nums">
                {current + 1}/{total}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
