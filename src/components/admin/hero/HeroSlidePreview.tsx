"use client";

import { useState } from "react";

type SlideData = {
  title: string;
  subtitle: string;
  badge_text: string;
  slide_type: string;
  button_label: string;
  button_secondary_label: string;
  videoSrc: string;
  imageSrc: string;
};

type Props = {
  slide: SlideData;
};

const typeAccent: Record<string, string> = {
  promotional: "border-amber-400/40 text-amber-300",
  institutional: "border-primary/40 text-primary",
  informational: "border-sky-400/40 text-sky-300",
};

function PreviewContent({ slide, mobile }: { slide: SlideData; mobile: boolean }) {
  const title = slide.title.trim() || "Seu título aqui";
  const subtitle = slide.subtitle.trim();

  return (
    <div className={mobile ? "max-w-full" : "max-w-[65%]"}>
      {/* Badge */}
      {slide.badge_text ? (
        <div className={`mb-2 ${mobile ? "mb-1.5" : "mb-2"} inline-flex items-center gap-1.5 rounded-md border bg-black/25 px-2 py-0.5 backdrop-blur-md font-bold tracking-widest uppercase ${mobile ? "text-[7px]" : "text-[9px]"} ${typeAccent[slide.slide_type] || "border-primary/40 text-primary"}`}>
          <span className="h-1 w-1 rounded-full bg-current opacity-70" />
          {slide.badge_text}
        </div>
      ) : null}

      {/* Title */}
      <h3 className={`font-black leading-[0.92] tracking-tight text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] ${mobile ? "text-[1rem]" : "text-[1.35rem]"}`}>
        {title}
      </h3>

      {/* Divider */}
      <div className={`rounded-full bg-primary ${mobile ? "mt-1.5 h-[2px] w-6" : "mt-2 h-[2px] w-10"}`} />

      {/* Subtitle */}
      {subtitle ? (
        <p className={`leading-snug text-white/80 ${mobile ? "mt-1 text-[8px]" : "mt-1.5 text-[10px]"}`}>
          {subtitle}
        </p>
      ) : null}

      {/* CTAs */}
      <div className={`flex gap-1.5 ${mobile ? "mt-2 flex-col" : "mt-3 flex-row items-center"}`}>
        <span className={`inline-flex items-center justify-center gap-1 rounded-lg bg-primary font-bold text-white shadow-sm ${mobile ? "px-2.5 py-1 text-[8px]" : "px-3 py-1.5 text-[9px]"}`}>
          {slide.button_label || "Saiba Mais"}
          <svg className={mobile ? "h-2 w-2" : "h-2.5 w-2.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </span>
        {slide.button_secondary_label ? (
          <span className={`inline-flex items-center justify-center font-semibold text-white/70 ${mobile ? "text-[7px] underline decoration-white/25 underline-offset-2" : "text-[8px] rounded-lg border border-white/20 bg-white/[0.06] px-3 py-1.5"}`}>
            {slide.button_secondary_label}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function HeroSlidePreview({ slide }: Props) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const isMobile = mode === "mobile";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
      {/* Header with toggle */}
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-sm">Preview</p>
        <div className="flex items-center rounded-lg border border-white/10 bg-black/20 p-0.5">
          <button
            type="button"
            onClick={() => setMode("desktop")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${mode === "desktop" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
            aria-label="Preview desktop"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
            </svg>
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setMode("mobile")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${mode === "mobile" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
            aria-label="Preview mobile"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
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
              ? "w-[200px] rounded-[1.25rem] aspect-[9/16]"
              : "w-full rounded-2xl aspect-[16/9]"
          }`}
        >
          {/* Media */}
          {slide.videoSrc ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={slide.videoSrc} autoPlay loop muted playsInline
            />
          ) : slide.imageSrc ? (
            <img
              className="absolute inset-0 h-full w-full object-cover"
              src={slide.imageSrc} alt=""
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-slate-900 text-white/30">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <p className="text-[10px]">Sem mídia</p>
              </div>
            </div>
          )}

          {/* Overlay — matches public hero */}
          <div className={`absolute inset-0 ${
            isMobile
              ? "bg-gradient-to-t from-black/70 via-black/25 via-45% to-black/15"
              : "bg-gradient-to-t from-black/80 via-black/30 via-55% to-black/20"
          }`} />
          {!isMobile ? (
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent via-50% to-transparent" />
          ) : null}

          {/* Content — positioned like the public hero */}
          <div className={`relative z-10 flex h-full flex-col ${
            isMobile ? "justify-end p-3" : "justify-center p-5"
          }`}>
            <PreviewContent slide={slide} mobile={isMobile} />
          </div>

          {/* Mobile device frame chrome */}
          {isMobile ? (
            <>
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-white/15" />
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-white/10" />
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
