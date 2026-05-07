"use client";

// Top bar local da landing /drones — versão sutil e premium.
// Substitui o sticky bar antigo (que tinha "Modelo:" + chips pesados).
// Aparece transparente sobre o hero, ganha blur/border ao rolar.

import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getAccent } from "@/components/drones/detail/accent";

type Model = { key: string; label: string; is_active?: number };

type Props = {
  models: Model[];
  selectedModel: string;
  onSelect: (key: string) => void;
};

export default function PublicTopBar({
  models,
  selectedModel,
  onSelect,
}: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const active = models.filter((m) => String(m.is_active ?? 1) === "1");

  return (
    <div
      className={[
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-black/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)]"
          : "bg-black/20 backdrop-blur-md border-b border-white/[0.04]",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-2.5">
        <button
          type="button"
          onClick={() =>
            window.scrollTo({ top: 0, behavior: "smooth" })
          }
          className="inline-flex items-center gap-2 text-xs font-extrabold tracking-tight text-white"
        >
          <span className="font-mono uppercase tracking-[0.22em] text-emerald-300">
            Kavita
          </span>
          <span className="text-slate-300">Drones</span>
        </button>

        <span className="hidden h-3.5 w-px bg-white/10 sm:inline" />

        {/* Mobile: select compacto */}
        <select
          className="ml-auto h-8 w-full max-w-[200px] rounded-lg border border-white/10 bg-white/[0.04] px-2 text-[12px] text-white outline-none sm:hidden"
          value={selectedModel}
          onChange={(e) => onSelect(e.target.value)}
        >
          {active.map((m) => (
            <option key={m.key} value={m.key} className="text-slate-900">
              {m.label}
            </option>
          ))}
        </select>

        {/* Desktop: chips compactos */}
        <div className="ml-auto hidden items-center gap-1 sm:flex">
          {active.map((m) => {
            const isActive = m.key === selectedModel;
            const accent = getAccent(m.key);
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onSelect(m.key)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold transition",
                  isActive
                    ? `border ${accent.badgeBorder} ${accent.badgeBg} ${accent.badgeText}`
                    : "border border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100",
                ].join(" ")}
                aria-pressed={isActive}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    isActive ? accent.dot : "bg-slate-600",
                  ].join(" ")}
                />
                {m.label.replace("DJI Agras ", "")}
              </button>
            );
          })}
        </div>

        <a
          href="#drones-representatives"
          className="ml-2 hidden items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-200 transition hover:bg-emerald-500/20 sm:inline-flex"
        >
          Lojas
          <ChevronRight className="h-3 w-3" aria-hidden />
        </a>
      </div>
    </div>
  );
}
