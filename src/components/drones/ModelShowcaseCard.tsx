"use client";

// Card cinematográfico dos modelos DJI Agras na landing /drones.
// Mesma linguagem visual da página /drones/[id]:
//   - Mídia full-bleed protagonista (4:3) com transições suaves
//   - Halo radial accent atrás do card pulsa no hover
//   - Identidade por modelo via accent (cyan/emerald/amber)
//   - Gradiente premium para legibilidade do título
//   - 3 specs em chip horizontal compacto, não em grid pesado
//   - 2 CTAs claros (WhatsApp primário + ver detalhes)

import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";
import { absUrl } from "@/utils/absUrl";
import { getAccent } from "./detail/accent";

type MediaTypeLower = "image" | "video";

export type ModelShowcaseModel = {
  key: string;
  label: string;
  is_active?: number;
  sort_order?: number;
  card_media_url?: string;
  card_media_path?: string;
  card_media_type?: string;
  hero_media_path?: string;
  hero_media_type?: string;
  _raw?: unknown;
};

export type ModelShowcaseSpec = { label: string; value: string };

type Props = {
  model: ModelShowcaseModel;
  badge: string;
  tagline: string;
  description: string;
  specs: ModelShowcaseSpec[];
  isFirst?: boolean;
  onOpen: (key: string) => void;
  onTalkToRep: (key: string) => void;
};

function detectMediaTypeByUrl(url: string): MediaTypeLower | "" {
  const u = String(url || "");
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u)) return "video";
  if (/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(u)) return "image";
  return "";
}

function normalizeMediaType(raw: unknown, url: string): MediaTypeLower | "" {
  const s = String(raw || "").toLowerCase();
  if (s.includes("video")) return "video";
  if (s.includes("image")) return "image";
  return detectMediaTypeByUrl(url);
}

function resolveCardMedia(model: ModelShowcaseModel) {
  const raw = (model._raw as Record<string, unknown> | undefined) || {};
  const pathCandidate =
    model.card_media_url ||
    model.card_media_path ||
    model.hero_media_path ||
    (raw.card_media_url as string) ||
    (raw.card_media_path as string) ||
    (raw.hero_media_path as string) ||
    (raw.media_url as string) ||
    (raw.image_url as string) ||
    (raw.cover_url as string) ||
    "";
  const url = absUrl(String(pathCandidate));
  const type = normalizeMediaType(
    model.card_media_type ??
      model.hero_media_type ??
      (raw.card_media_type as string) ??
      (raw.hero_media_type as string) ??
      (raw.media_type as string),
    url,
  );
  return { url, type };
}

export default function ModelShowcaseCard({
  model,
  badge,
  tagline,
  description,
  specs,
  isFirst = false,
  onOpen,
  onTalkToRep,
}: Props) {
  const { url, type } = resolveCardMedia(model);
  const accent = getAccent(model.key);

  return (
    <article
      className={[
        "group relative w-[84vw] shrink-0 snap-start sm:w-[420px] md:w-[460px] lg:w-full",
      ].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden rounded-[2rem] border bg-[rgba(8,12,22,0.65)] backdrop-blur-md transition",
          "hover:-translate-y-1 hover:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]",
          accent.ring,
        ].join(" ")}
      >
        {/* Halo accent — pulsa no hover */}
        <div
          aria-hidden
          className={[
            "pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full blur-3xl opacity-40 transition-opacity duration-500 group-hover:opacity-90",
            accent.halo,
          ].join(" ")}
        />

        {/* Mídia */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {url && type === "video" ? (
            <video
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              src={url}
              muted
              playsInline
              loop
              // preload only for the autoplay one — economiza dados
              // dos outros 2 cards que ficam estáticos por padrão.
              preload={isFirst ? "metadata" : "none"}
              autoPlay={isFirst}
            />
          ) : url && type === "image" ? (
            <Image
              src={url}
              alt={`${model.label} — drone agrícola DJI Agras`}
              fill
              priority={isFirst}
              quality={85}
              sizes="(max-width: 640px) 84vw, (max-width: 1024px) 460px, 33vw"
              className="object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            // Fallback institucional
            <div
              className={[
                "h-full w-full bg-gradient-to-br",
                accent.glow,
              ].join(" ")}
              aria-label={`${model.label} — imagem em breve`}
            >
              <div className="flex h-full w-full items-center justify-center">
                <svg
                  viewBox="0 0 64 64"
                  className={["h-16 w-16 opacity-80", accent.text].join(" ")}
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
              </div>
            </div>
          )}

          {/* Gradiente para legibilidade do título */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
          />

          {/* Badge accent topo */}
          <div className="absolute left-5 top-5">
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md",
                accent.badgeBorder,
                accent.badgeBg,
                accent.badgeText,
              ].join(" ")}
            >
              <span
                className={["h-1.5 w-1.5 rounded-full", accent.dot].join(" ")}
              />
              {badge}
            </span>
          </div>

          {/* Título sobreposto */}
          <div className="absolute inset-x-5 bottom-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
              DJI Agras
            </p>
            <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-[1.7rem]">
              {model.label}
            </h3>
            <p
              className={[
                "mt-1 text-sm font-semibold",
                accent.textSoft,
              ].join(" ")}
            >
              {tagline}
            </p>
          </div>
        </div>

        {/* Corpo */}
        <div className="grid gap-4 p-5 sm:p-6">
          <p className="text-[13px] leading-relaxed text-slate-300">
            {description}
          </p>

          {/* Specs como chip horizontal — menos peso que grid 3-col */}
          {specs.length > 0 && (
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/8 bg-black/20 p-3">
              {specs.slice(0, 3).map((s, i) => (
                <div key={`${s.label}-${i}`} className="text-center">
                  <div
                    className={[
                      "text-sm font-extrabold leading-tight tabular-nums sm:text-base",
                      accent.text,
                    ].join(" ")}
                    title={s.value}
                  >
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onTalkToRep(model.key)}
              className={[
                "inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-sm font-extrabold text-white transition active:scale-[0.99]",
                "bg-gradient-to-r hover:brightness-[1.08]",
                accent.primaryGradient,
                accent.primaryShadow,
              ].join(" ")}
              aria-label={`Falar com representante sobre ${model.label}`}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Falar agora
            </button>
            <button
              type="button"
              onClick={() => onOpen(model.key)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-3 text-sm font-extrabold text-slate-100 transition hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.99]"
            >
              Ver detalhes
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
