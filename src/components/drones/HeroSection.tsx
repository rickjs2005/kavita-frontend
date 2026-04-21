"use client";

import type { DronePageSettings, DroneRepresentative } from "@/types/drones";
import { absUrl } from "@/utils/absUrl";

// Defaults de copy. Usados quando o admin ainda não preencheu o hero —
// evita a landing ficar vazia ou mostrar placeholder de dev em produção.
const DEFAULT_HERO_TITLE =
  "Drones agrícolas DJI Agras para produtividade no campo";
const DEFAULT_HERO_SUBTITLE =
  "Pulverização precisa, economia de insumos e mais agilidade na safra. Atendimento com representante autorizado Kavita para ajudar você a escolher o modelo certo para sua propriedade.";
const DEFAULT_CTA_TITLE = "Fale com um representante";
const DEFAULT_CTA_BUTTON = "Falar no WhatsApp";
const DEFAULT_CTA_MESSAGE =
  "Olá! Quero conhecer melhor os drones DJI Agras da Kavita.";

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
  const ctaTitle = (page.cta_title || "").trim() || DEFAULT_CTA_TITLE;
  const ctaButton =
    (page.cta_button_label || "").trim() || DEFAULT_CTA_BUTTON;

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
              {title}
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              {subtitle}
            </p>

            <div className="mt-7">
              <p className="text-sm font-semibold text-slate-200">
                {ctaTitle}
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
                      <div className="font-semibold text-white truncate">
                        {rep.name}
                      </div>
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
                      ? buildWaLink(
                          representatives[0],
                          page.cta_message_template,
                        )
                      : "#representantes"
                  }
                  className="inline-flex w-full sm:w-auto items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                >
                  {ctaButton}
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
