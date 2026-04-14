"use client";

// src/components/mercado-do-cafe/CityChips.tsx
//
// Filtro regional por cidade via chips grandes e clicáveis. Manhuaçu
// sempre aparece primeiro (cidade-bandeira). Usado na listagem de
// corretoras e nos blocos regionais da landing.
//
// Design: glass panel com chips em glass, accent amber na cidade ativa,
// mobile-friendly (scroll horizontal se não couber).

import Link from "next/link";
import { CIDADES_DESTAQUE, normalizeCityName } from "@/lib/regioes";

type Props = {
  /** Cidade ativa no momento (pelo slug). "all" ou undefined = todas. */
  active?: string;
  /**
   * Handler opcional — se fornecido, os chips viram botões (uso
   * interativo dentro de client components). Se não, viram links
   * para /mercado-do-cafe/corretoras?city=XXX (uso navegacional).
   */
  onSelect?: (slug: string | null) => void;
  /** Exibe contador de corretoras por cidade (opcional). */
  counts?: Record<string, number>;
  /** Variante visual: dark (default, para páginas dark) ou light (painel). */
  tone?: "dark" | "light";
};

export function CityChips({
  active,
  onSelect,
  counts,
  tone = "dark",
}: Props) {
  const isDark = tone === "dark";

  const baseChip = isDark
    ? "border-white/10 bg-white/[0.04] text-stone-200 hover:bg-white/[0.08] hover:text-amber-200 hover:border-amber-400/30"
    : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-amber-400/40 hover:text-amber-800";

  const activeChip = isDark
    ? "border-amber-400/50 bg-amber-400/10 text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
    : "border-amber-400 bg-amber-50 text-amber-900 shadow-sm shadow-amber-200/40";

  function isActive(slug: string | null): boolean {
    if (!active || active === "all") return slug === null;
    return normalizeCityName(active) === slug;
  }

  function renderChip(slug: string | null, label: string, count?: number) {
    const selected = isActive(slug);
    const cls = [
      "group inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all",
      selected ? activeChip : baseChip,
    ].join(" ");

    const content = (
      <>
        <span>{label}</span>
        {typeof count === "number" && count > 0 && (
          <span
            className={[
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
              selected
                ? isDark
                  ? "bg-amber-400/20 text-amber-100"
                  : "bg-amber-200 text-amber-900"
                : isDark
                  ? "bg-white/10 text-stone-300"
                  : "bg-stone-100 text-stone-600",
            ].join(" ")}
          >
            {count}
          </span>
        )}
      </>
    );

    if (onSelect) {
      return (
        <button
          key={slug ?? "all"}
          type="button"
          onClick={() => onSelect(slug)}
          className={cls}
          aria-pressed={selected}
        >
          {content}
        </button>
      );
    }

    const href =
      slug === null
        ? "/mercado-do-cafe/corretoras"
        : `/mercado-do-cafe/corretoras?city=${encodeURIComponent(slug)}`;

    return (
      <Link key={slug ?? "all"} href={href} className={cls} aria-current={selected ? "true" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {renderChip(null, "Todas", undefined)}
        {CIDADES_DESTAQUE.map((c) =>
          renderChip(c.slug, c.nome, counts?.[c.slug]),
        )}
      </div>
    </div>
  );
}
