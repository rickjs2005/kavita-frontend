"use client";

// Top bar local da página /drones/[id].
// Renderiza acima do hero: voltar + identidade do modelo + CTA accent.
// Em vez de mexer no Header global, esse mini-header dá a sensação
// de "página de produto premium" só dentro da rota de drones.
//
// Comportamento on-scroll: ganha mais blur e borda ao rolar.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import type { Accent } from "./accent";

type Props = {
  modelLabel: string;
  accent: Accent;
  onTalkToRep: () => void;
};

export default function ModelTopBar({ modelLabel, accent, onTalkToRep }: Props) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={[
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-black/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)]"
          : "bg-black/30 backdrop-blur-md border-b border-white/[0.04]",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3">
        {/* Voltar */}
        <button
          onClick={() => router.push("/drones")}
          className="group inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-extrabold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] sm:text-sm"
          aria-label="Voltar para todos os drones"
        >
          <ArrowLeft
            className="h-4 w-4 transition group-hover:-translate-x-0.5"
            aria-hidden
          />
          <span className="hidden sm:inline">Todos os drones</span>
          <span className="sm:hidden">Voltar</span>
        </button>

        {/* Identidade do modelo */}
        <div className="hidden min-w-0 flex-1 items-center justify-center text-center sm:flex">
          <div className="min-w-0">
            <div
              className={[
                "text-[9.5px] font-bold uppercase tracking-[0.28em]",
                accent.text,
              ].join(" ")}
            >
              DJI Agras · Kavita
            </div>
            <div className="truncate text-sm font-extrabold tracking-tight text-white">
              {modelLabel}
            </div>
          </div>
        </div>

        {/* CTA accent */}
        <button
          onClick={onTalkToRep}
          className={[
            "group inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-xs font-extrabold transition sm:px-4 sm:text-sm",
            accent.badgeBorder,
            accent.badgeBg,
            accent.badgeText,
            "hover:brightness-[1.12] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/30",
          ].join(" ")}
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Falar com representante</span>
          <span className="sm:hidden">Falar agora</span>
        </button>
      </div>
    </div>
  );
}
