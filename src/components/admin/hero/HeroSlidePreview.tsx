"use client";

// src/components/admin/hero/HeroSlidePreview.tsx
//
// Preview compacto do slide do hero exibido lado a lado no SlideForm.
// Refletir aqui os elementos visíveis no público (HeroCarousel) ajuda
// o admin a visualizar antes de salvar — sem precisar abrir a home.
//
// Sprint 5 (CMS): preview agora refletir badge_icon, features (compacto)
// e contagem de quick_links. A pill da badge usa o mesmo verde do
// público (emerald) em vez de variar por slide_type — slide_type fica
// só como hint contextual no preview, não no público.

import { useState } from "react";
import { getHeroIcon } from "@/lib/heroIcons";
import type { HeroFeature, HeroQuickLink } from "@/types/heroSlide";

type SlideData = {
  title: string;
  subtitle: string;
  badge_text: string;
  badge_icon: string | null;
  slide_type: string;
  button_label: string;
  button_secondary_label: string;
  videoSrc: string;
  imageSrc: string;
  features: HeroFeature[];
  quick_links: HeroQuickLink[];
};

type Props = {
  slide: SlideData;
};

/** Última palavra do título destaca em verde — espelha
 * splitTitleHighlight() do HeroCarousel público. */
function splitTitle(title: string) {
  const trimmed = title.trim();
  if (!trimmed) return { head: "", highlight: "" };
  const lastSpace = trimmed.lastIndexOf(" ");
  if (lastSpace === -1) return { head: "", highlight: trimmed };
  return {
    head: trimmed.slice(0, lastSpace),
    highlight: trimmed.slice(lastSpace + 1),
  };
}

function PreviewContent({
  slide,
  mobile,
}: {
  slide: SlideData;
  mobile: boolean;
}) {
  const titleText = slide.title.trim() || "Seu título aqui";
  const subtitle = slide.subtitle.trim();
  const { head, highlight } = splitTitle(titleText);

  const featuresPreview = slide.features.slice(0, mobile ? 3 : 4);

  return (
    <div className={mobile ? "max-w-full" : "max-w-[60%]"}>
      {/* Pill — emerald (igual ao público), com ícone do badge_icon */}
      {slide.badge_text ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/40 backdrop-blur-sm font-bold uppercase tracking-[0.16em] text-emerald-300 ${
            mobile ? "px-1.5 py-0.5 text-[7px]" : "px-2 py-0.5 text-[9px]"
          }`}
        >
          {getHeroIcon(slide.badge_icon)({ size: mobile ? 8 : 10 })}
          {slide.badge_text}
        </span>
      ) : null}

      {/* Title — última palavra em verde */}
      <h3
        className={`mt-1 font-black leading-[0.95] tracking-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] ${
          mobile ? "text-[1rem]" : "text-[1.5rem]"
        }`}
      >
        {head ? (
          <>
            {head}{" "}
            <span className="text-emerald-400">{highlight}</span>
          </>
        ) : (
          highlight
        )}
      </h3>

      {/* Subtitle */}
      {subtitle ? (
        <p
          className={`leading-snug text-white/75 ${
            mobile ? "mt-1 text-[8px]" : "mt-1.5 text-[10px]"
          }`}
        >
          {subtitle}
        </p>
      ) : null}

      {/* CTAs */}
      <div
        className={`flex gap-1.5 ${
          mobile ? "mt-1.5 flex-col" : "mt-2 flex-row items-center"
        }`}
      >
        <span
          className={`inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-500 font-bold text-white shadow-sm ${
            mobile ? "px-2 py-1 text-[8px]" : "px-2.5 py-1.5 text-[9px]"
          }`}
        >
          {slide.button_label || "Saiba Mais"}
          <svg
            className={mobile ? "h-2 w-2" : "h-2.5 w-2.5"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </span>
        {slide.button_secondary_label ? (
          <span
            className={`inline-flex items-center justify-center font-semibold text-white/70 ${
              mobile
                ? "text-[7px] underline decoration-white/25 underline-offset-2"
                : "rounded-lg border border-white/20 bg-white/[0.06] px-2.5 py-1 text-[8px]"
            }`}
          >
            {slide.button_secondary_label}
          </span>
        ) : null}
      </div>

      {/* Mini-features — preview compacto */}
      {featuresPreview.length > 0 ? (
        <ul
          className={`grid gap-1 ${
            mobile ? "mt-1.5 grid-cols-3" : "mt-2 grid-cols-4"
          }`}
        >
          {featuresPreview.map((feat, i) => (
            <li
              key={`${feat.title}-${i}`}
              className="flex items-center gap-1"
            >
              <span
                className={`inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 ${
                  mobile ? "h-3 w-3" : "h-4 w-4"
                }`}
              >
                {getHeroIcon(feat.icon)({ size: mobile ? 6 : 8 })}
              </span>
              <p
                className={`truncate font-semibold text-white/85 ${
                  mobile ? "text-[6px]" : "text-[7px]"
                }`}
                title={feat.title}
              >
                {feat.title}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Faixa estreita no rodapé do preview indicando que há quick_links
 * cadastrados (e quantos). O layout completo dos cards seria pequeno
 * demais para ser útil — preferimos uma linha sintética.
 */
function QuickLinksHint({
  count,
  mobile,
}: {
  count: number;
  mobile: boolean;
}) {
  if (count === 0) return null;
  return (
    <div
      className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 border-t border-white/10 bg-black/40 backdrop-blur-sm ${
        mobile ? "py-1" : "py-1.5"
      }`}
    >
      <span
        className={`font-bold uppercase tracking-[0.18em] text-emerald-300 ${
          mobile ? "text-[6px]" : "text-[8px]"
        }`}
      >
        + {count} quick {count === 1 ? "link" : "links"}
      </span>
    </div>
  );
}

export default function HeroSlidePreview({ slide }: Props) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const isMobile = mode === "mobile";
  const quickLinksCount = slide.quick_links.length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
      {/* Header with toggle */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Preview</p>
        <div className="flex items-center rounded-lg border border-white/10 bg-black/20 p-0.5">
          <button
            type="button"
            onClick={() => setMode("desktop")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              mode === "desktop"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
            aria-label="Preview desktop"
            aria-pressed={mode === "desktop"}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z"
              />
            </svg>
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setMode("mobile")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
              mode === "mobile"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
            aria-label="Preview mobile"
            aria-pressed={mode === "mobile"}
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
              />
            </svg>
            Mobile
          </button>
        </div>
      </div>

      {/* Preview frame */}
      <div className="flex justify-center">
        <div
          className={`relative overflow-hidden border border-white/10 bg-black/50 transition-all duration-300 ${
            isMobile
              ? "aspect-[9/16] w-[200px] rounded-[1.25rem]"
              : "aspect-[16/9] w-full rounded-2xl"
          }`}
        >
          {/* Media */}
          {slide.videoSrc ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={slide.videoSrc}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : slide.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src={slide.imageSrc}
              alt=""
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-slate-900 text-white/30">
              <div className="text-center">
                <svg
                  className="mx-auto mb-1 h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                  />
                </svg>
                <p className="text-[10px]">Sem mídia</p>
              </div>
            </div>
          )}

          {/* Overlay — espelha o público:
              mobile: gradient vertical do rodapé
              desktop: gradient horizontal escurecendo a esquerda */}
          <div
            className={`absolute inset-0 ${
              isMobile
                ? "bg-gradient-to-t from-black/85 via-black/55 to-black/30"
                : "bg-gradient-to-r from-[#06343a] via-[#06343a]/85 via-40% to-transparent"
            }`}
          />

          {/* Content */}
          <div
            className={`relative z-10 flex h-full flex-col ${
              isMobile ? "justify-end p-3" : "justify-center p-5"
            } ${quickLinksCount > 0 ? (isMobile ? "pb-5" : "pb-7") : ""}`}
          >
            <PreviewContent slide={slide} mobile={isMobile} />
          </div>

          {/* Quick links hint — só renderiza quando há itens */}
          <QuickLinksHint count={quickLinksCount} mobile={isMobile} />

          {/* Mobile device frame chrome */}
          {isMobile ? (
            <>
              <div className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/15" />
              <div className="absolute bottom-1.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-white/10" />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
