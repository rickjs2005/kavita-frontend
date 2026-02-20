"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type HeroConfig = {
  hero_video_url?: string;
  hero_video_path?: string;

  hero_image_url?: string;
  hero_image_path?: string;

  // ✅ NOVO (opcional)
  title?: string;
  subtitle?: string;

  button_label?: string;
  button_href?: string;
};

const DEFAULT_IMG = "/images/drone/fallback-hero1.jpg";

function toMediaUrl(raw?: string | null) {
  if (!raw) return "";
  const p = String(raw).trim().replace(/\\/g, "/");
  if (!p) return "";

  // absoluto
  if (/^https?:\/\//i.test(p)) return p;

  // relativo -> backend
  const clean = p.replace(/^\/+/, "");
  if (clean.startsWith("uploads/")) return `${API_BASE}/${clean}`;
  if (clean.startsWith("public/")) return `${API_BASE}/${clean}`;
  return `${API_BASE}/uploads/${clean}`;
}

function normalizeHref(href?: string | null) {
  const v = String(href || "").trim();
  if (!v) return "/drones";
  if (v.startsWith("/") || v.startsWith("http://") || v.startsWith("https://")) return v;
  return `/${v}`;
}

export default function HeroSection() {
  const [videoError, setVideoError] = useState(false);

  const [cfg, setCfg] = useState<HeroConfig>({
    hero_video_url: "",
    hero_image_url: DEFAULT_IMG,

    // ✅ NOVO (defaults vazios, mas o render tem fallback)
    title: "",
    subtitle: "",

    button_label: "Saiba Mais",
    button_href: "/drones",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/public/site-hero`, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) return;

        const data = (await res.json()) as Partial<HeroConfig>;

        setCfg((p) => ({
          ...p,
          hero_video_url: data.hero_video_url ?? p.hero_video_url,
          hero_video_path: data.hero_video_path ?? p.hero_video_path,
          hero_image_url: data.hero_image_url ?? p.hero_image_url,
          hero_image_path: data.hero_image_path ?? p.hero_image_path,

          // ✅ NOVO
          title: data.title ?? p.title,
          subtitle: data.subtitle ?? p.subtitle,

          button_label: data.button_label ?? p.button_label,
          button_href: data.button_href ?? p.button_href,
        }));

        setVideoError(false);
      } catch {
        // mantém defaults
      }
    }
    load();
  }, []);

  const videoSrc = useMemo(() => {
    const raw = cfg.hero_video_url || cfg.hero_video_path || "";
    return toMediaUrl(raw);
  }, [cfg.hero_video_url, cfg.hero_video_path]);

  const heroImg = useMemo(() => {
    const raw = cfg.hero_image_url || cfg.hero_image_path || DEFAULT_IMG;
    if (raw.startsWith("/images/")) return raw;
    return toMediaUrl(raw) || DEFAULT_IMG;
  }, [cfg.hero_image_url, cfg.hero_image_path]);

  const href = normalizeHref(cfg.button_href);

  // ✅ fallback para manter o copy atual se title/subtitle vierem vazios
  const titleText =
    String(cfg.title || "").trim() || "Revolucione sua Gestão Agrícola";

  const subtitleText =
    String(cfg.subtitle || "").trim() ||
    "Conheça a tecnologia que otimiza o monitoramento e a eficiência no campo, com mais controle, mais precisão e decisões melhores.";

  return (
    <section
      className="
        relative w-full overflow-hidden
        min-h-[72vh] sm:min-h-[88vh] lg:min-h-[92vh]
        flex items-center
      "
      aria-label="Hero do site"
    >
      {/* Background: vídeo ou imagem */}
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
          style={{ backgroundImage: `url('${heroImg}')` }}
        />
      )}

      {/* Overlays para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/75" />
      <div className="absolute inset-0 [background:radial-gradient(60%_60%_at_50%_40%,rgba(53,146,147,0.25),transparent_60%)]" />
      <div className="absolute inset-0 shadow-[inset_0_-120px_160px_rgba(0,0,0,0.65)]" />

      {/* Conteúdo */}
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
            {/* Badge opcional (não depende de backend) */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#359293]" />
              Tecnologia para o campo
            </div>

            <h1
              className="
                font-extrabold tracking-tight text-white
                text-[clamp(2rem,4.8vw,4.2rem)]
                leading-[1.05]
              "
            >
              {titleText.includes("Gestão Agrícola") ? (
                <>
                  Revolucione sua{" "}
                  <span className="text-white/95">Gestão Agrícola</span>
                </>
              ) : (
                titleText
              )}
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
                  bg-[#359293] hover:bg-[#2f7f80]
                  shadow-lg shadow-black/30
                  transition
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black/40
                "
              >
                {cfg.button_label || "Saiba Mais"}
              </Link>

              {/* CTA secundário opcional (mantém UX melhor no desktop) */}
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

            {/* Micro-infos (responsivo) */}
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