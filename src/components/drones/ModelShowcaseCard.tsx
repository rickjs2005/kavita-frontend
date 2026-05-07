"use client";

// Card horizontal premium dos modelos DJI Agras (T25P / T70P / T100).
// Inspiração: imagem de referência — texto à esquerda, drone à direita,
// background dark com gradient accent por modelo, link "Ver modelo".
//
// Layout:
//   Mobile: card vertical (texto em cima, drone embaixo) — basis 84vw
//   Desktop (lg): card horizontal (texto + drone lado-a-lado) full-width

import Image from "next/image";
import { ArrowRight } from "lucide-react";
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
  description,
  isFirst = false,
  onOpen,
}: Props) {
  const { url, type } = resolveCardMedia(model);
  const accent = getAccent(model.key);

  return (
    <article
      className={[
        "group relative shrink-0 basis-[84vw] snap-start sm:basis-[440px] lg:basis-auto",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onOpen(model.key)}
        className={[
          "relative block w-full overflow-hidden rounded-[1.75rem] border bg-[rgba(8,12,22,0.65)] text-left backdrop-blur-md transition",
          "hover:-translate-y-1 hover:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
          accent.ring,
        ].join(" ")}
        aria-label={`Ver modelo ${model.label}`}
      >
        {/* Halo accent */}
        <div
          aria-hidden
          className={[
            "pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full blur-3xl opacity-50 transition-opacity duration-500 group-hover:opacity-90",
            accent.halo,
          ].join(" ")}
        />

        {/* Layout interno: vertical em mobile, layout normal em desktop.
            Em desktop a card_media é uma imagem grande embaixo do texto;
            o drone domina visualmente, mas o texto fica em cima. */}
        <div className="relative grid gap-0">
          {/* Bloco texto (top) */}
          <div className="relative p-5 sm:p-6">
            {/* Badge label do modelo */}
            <p className="font-mono text-[11px] font-extrabold uppercase tracking-[0.22em] text-white">
              {model.label}
            </p>

            {/* Sub-tagline / tipo de uso */}
            <p
              className={[
                "mt-1 text-[10.5px] font-bold uppercase tracking-[0.18em]",
                accent.text,
              ].join(" ")}
            >
              {badge}
            </p>

            {/* Descrição comercial */}
            <p className="mt-3 text-[13px] leading-relaxed text-slate-300/90">
              {description}
            </p>

            {/* Link "Ver modelo →" — emerald accent */}
            <span
              className={[
                "mt-5 inline-flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-[0.16em] transition group-hover:translate-x-0.5",
                accent.text,
              ].join(" ")}
            >
              Ver modelo
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </div>

          {/* Bloco drone (bottom) — protagonista visual */}
          <div className="relative aspect-[16/10] overflow-hidden">
            {url && type === "video" ? (
              <video
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                src={url}
                muted
                playsInline
                loop
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
                sizes="(max-width: 640px) 84vw, (max-width: 1024px) 440px, 33vw"
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              // Fallback: gradient accent + ícone do drone
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
                    className={["h-14 w-14 opacity-80", accent.text].join(" ")}
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

            {/* Vinheta sutil pra integrar mídia com fundo */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
            />
          </div>
        </div>
      </button>
    </article>
  );
}
