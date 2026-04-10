// src/components/news/CotacaoCard.tsx
//
// Cotação card em dark glass — accent emerald-400 (signature do News).
// Variação ganha tom específico: emerald para alta, rose para baixa,
// sempre em superfícies translúcidas adaptadas ao stone-950.

import Link from "next/link";
import type { PublicCotacao } from "@/lib/newsPublicApi";
import {
  safeNum,
  formatPrice,
  formatPct,
  formatDatePtBR,
  getMarketEmoji,
  hasPrice,
  describeTrend,
  convertToLocalUnit,
  simplifySource,
} from "@/utils/kavita-news/cotacoes";

export function CotacaoCard({ item }: { item: PublicCotacao }) {
  const varNum = safeNum(item.variation_day);
  const varLabel = formatPct(varNum);
  const trend = describeTrend(varNum);

  const isUp = varNum !== null && varNum > 0;
  const isDown = varNum !== null && varNum < 0;

  const variationTone = isUp
    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
    : isDown
      ? "bg-rose-500/15 text-rose-300 ring-rose-400/30"
      : "bg-white/[0.05] text-stone-400 ring-white/10";

  const variationEmoji = isUp ? "▲" : isDown ? "▼" : "";

  const emoji = getMarketEmoji(item);
  const updated = formatDatePtBR(item.last_update_at);
  const source = simplifySource(item.slug, item.source);

  const priceNum = safeNum(item.price);
  const localUnit =
    priceNum !== null && item.slug
      ? convertToLocalUnit(priceNum, item.slug)
      : null;

  return (
    <Link
      href={`/news/cotacoes/${item.slug}`}
      className="
        group relative block overflow-hidden rounded-2xl bg-white/[0.04] p-6
        ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm
        transition-all duration-300
        hover:-translate-y-0.5 hover:bg-white/[0.06] hover:ring-emerald-400/30
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50
      "
      aria-label={`Ver detalhes da cotação: ${item.name}`}
    >
      {/* Top highlight emerald */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
      />

      {/* Row 1: Nome + variação */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            {source || "Mercado"}
          </p>
          <p className="mt-1.5 truncate text-base font-semibold tracking-tight text-stone-50">
            <span className="mr-1.5" aria-hidden>
              {emoji}
            </span>
            {item.name}
          </p>
        </div>

        {varNum !== null && (
          <span
            className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${variationTone}`}
          >
            {variationEmoji && <span aria-hidden>{variationEmoji}</span>}
            {varLabel}
          </span>
        )}
      </div>

      {/* Row 2: Preço — herói do card */}
      <div className="relative mt-5">
        {hasPrice(item.price) ? (
          <>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold tracking-tight text-stone-50">
                {formatPrice(item.price)}
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-stone-500">
                {item.unit ?? ""}
              </p>
            </div>

            {localUnit && (
              <p className="mt-1.5 text-sm font-semibold text-emerald-300/90">
                ≈ R$ {formatPrice(localUnit.value)}
                <span className="ml-1 font-normal text-stone-500">
                  /{localUnit.label}
                </span>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm font-medium text-stone-500">
            Preço ainda não disponível
          </p>
        )}
      </div>

      {/* Row 3: Tendência + timestamp */}
      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-[10px] font-semibold uppercase tracking-[0.14em]">
        <span className="truncate text-stone-400">{trend}</span>
        <span className="shrink-0 text-stone-500">
          {updated && updated !== "—" ? updated : "—"}
        </span>
      </div>
    </Link>
  );
}
