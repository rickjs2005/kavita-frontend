"use client";

import type { DronePageSettings, DroneRepresentative } from "@/types/drones";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function buildWaLink(rep: DroneRepresentative, template?: string | null) {
  const phone = String(rep.whatsapp || "").replace(/\D/g, "");
  const msg = template || "Olá! Quero conhecer melhor os drones da Kavita.";
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
  const heroVideo = page.hero_video_path ? `${API_BASE}${page.hero_video_path}` : null;
  const heroImg = page.hero_image_fallback_path
    ? `${API_BASE}${page.hero_image_fallback_path}`
    : null;

  const reps = (representatives || []).slice(0, 4);

  return (
    <section className="relative overflow-hidden">
      {/* overlay + brilho */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
      <div className="absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5 pt-10 pb-10 sm:pt-16 sm:pb-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="text-slate-100">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Kavita Drones
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              {page.hero_title}
            </h1>

            {page.hero_subtitle ? (
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                {page.hero_subtitle}
              </p>
            ) : null}

            <div className="mt-7">
              <p className="text-sm font-semibold text-slate-200">
                {page.cta_title || "Fale com um representante"}
              </p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {reps.map((rep) => (
                  <a
                    key={rep.id}
                    href={buildWaLink(rep, page.cta_message_template)}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white truncate">{rep.name}</div>
                      <span className="text-[11px] text-emerald-300/90 group-hover:text-emerald-200">
                        WhatsApp
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-300 truncate">
                      {rep.address_city || "Cidade"}{" "}
                      {rep.address_uf ? `- ${rep.address_uf}` : ""}
                    </div>
                  </a>
                ))}
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <a
                  href={
                    representatives?.[0]
                      ? buildWaLink(representatives[0], page.cta_message_template)
                      : "#"
                  }
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                >
                  {page.cta_button_label || "Falar no WhatsApp"}
                </a>

                <a
                  href="#representantes"
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  Ver todos os representantes
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_20px_60px_rgba(0,0,0,0.6)]">
            {heroVideo ? (
              <video
                className="w-full rounded-2xl aspect-video object-cover bg-black/30"
                src={heroVideo}
                controls
                playsInline
                poster={heroImg || undefined}
              />
            ) : heroImg ? (
              <img
                className="w-full rounded-2xl aspect-video object-cover bg-black/30"
                src={heroImg}
                alt="Kavita Drones"
              />
            ) : (
              <div className="aspect-video rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-slate-300 text-sm px-4 text-center">
                Configure o vídeo ou imagem do Hero no Admin.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
