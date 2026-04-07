"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { HeroData } from "@/types/hero";
import { absUrl } from "@/utils/absUrl";
import { sanitizeUrl } from "@/lib/sanitizeHtml";

const DEFAULT_IMG = "/images/drone/fallback-hero1.jpg";

function normalizeHref(href?: string | null) {
  const v = String(href || "").trim();
  if (!v) return "/drones";
  const normalized =
    v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://")
      ? v
      : `/${v}`;
  return sanitizeUrl(normalized) || "/drones";
}

type Props = {
  data: HeroData;
};

export default function HeroSection({ data }: Props) {
  const [videoError, setVideoError] = useState(false);

  const videoSrc = useMemo(() => {
    const raw = data.hero_video_url || data.hero_video_path || "";
    if (!raw) return "";
    return absUrl(raw);
  }, [data.hero_video_url, data.hero_video_path]);

  const heroImg = useMemo(() => {
    const raw = data.hero_image_url || data.hero_image_path || DEFAULT_IMG;
    if (raw.startsWith("/images/")) return raw;
    return absUrl(raw);
  }, [data.hero_image_url, data.hero_image_path]);

  const href = normalizeHref(data.button_href);

  const titleText =
    String(data.title || "").trim() || "Revolucione sua Gestão Agrícola";

  const subtitleText =
    String(data.subtitle || "").trim() ||
    "Conheça a tecnologia que otimiza o monitoramento e a eficiência no campo, com mais controle, mais precisão e decisões melhores.";

  return (
    <section
      className="
        relative w-full overflow-hidden
        min-h-[56vh] sm:min-h-[72vh] md:min-h-[88vh] lg:min-h-[92vh]
        flex items-center
      "
      aria-label="Hero do site"
    >
      {/* Background: video ou imagem */}
      {!!videoSrc && !videoError ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={heroImg}
          onError={() => setVideoError(true)}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${sanitizeUrl(heroImg) || DEFAULT_IMG}')` }}
        />
      )}

      {/* Overlays para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/75" />
      <div className="absolute inset-0 [background:radial-gradient(60%_60%_at_50%_40%,rgba(53,146,147,0.25),transparent_60%)]" />
      <div className="absolute inset-0 shadow-[inset_0_-120px_160px_rgba(0,0,0,0.65)]" />

      {/* Conteudo */}
      <div
        className="
          relative z-10 w-full
          px-4 sm:px-6 lg:px-10
          pt-[max(4rem,env(safe-area-inset-top))]
          pb-[max(2.5rem,env(safe-area-inset-bottom))]
        "
      >
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Tecnologia para o campo
            </div>

            <h1
              className="
                font-extrabold tracking-tight text-white
                text-[clamp(2rem,4.8vw,4.2rem)]
                leading-[1.05]
              "
            >
              {titleText}
            </h1>

            <p className="mt-4 text-[clamp(1rem,1.6vw,1.35rem)] leading-relaxed text-white/85">
              {subtitleText}
            </p>

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
                {data.button_label || "Saiba Mais"}
              </Link>

              <Link
                href="/contatos"
                className="
                  inline-flex w-full sm:w-auto items-center justify-center
                  rounded-xl px-6 py-3
                  text-sm font-semibold text-white/90
                  border border-white/20 bg-white/5 hover:bg-white/10
                  backdrop-blur
                  transition
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40
                "
              >
                Falar com um especialista
              </Link>
            </div>

            {/* Micro-infos */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-3">
              {[
                "Alta performance",
                "Suporte rápido",
                "Tecnologia DJI",
                "Resultados no campo",
              ].map((t) => (
                <div
                  key={t}
                  className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/80 backdrop-blur"
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
