// src/components/news/CotacaoCard.tsx
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
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : isDown
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-zinc-200 bg-zinc-50 text-zinc-700";

  // Stronger tone for large moves (>3%)
  const strongTone =
    varNum !== null && Math.abs(varNum) > 3
      ? isUp
        ? "border-emerald-300 bg-emerald-100 text-emerald-800"
        : "border-rose-300 bg-rose-100 text-rose-800"
      : variationTone;

  const variationEmoji = isUp ? "📈" : isDown ? "📉" : "";

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
        group block rounded-2xl border border-zinc-200 bg-white p-5 md:p-6
        shadow-sm transition-all
        hover:-translate-y-[1px] hover:shadow-md hover:border-zinc-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
      "
      aria-label={`Ver detalhes da cotação: ${item.name}`}
    >
      {/* Row 1: Name + variation badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-zinc-900">
            {emoji} {item.name}
          </p>
          <p className="mt-0.5 text-xs text-zinc-400">
            Referência internacional • {source}
          </p>
        </div>

        {varNum !== null && (
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${strongTone}`}
          >
            {variationEmoji ? (
              <span aria-hidden>{variationEmoji}</span>
            ) : null}
            {varLabel}
          </span>
        )}
      </div>

      {/* Row 2: Price block — the most important visual element */}
      <div className="mt-4">
        {hasPrice(item.price) ? (
          <>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold tracking-tight text-zinc-900">
                {formatPrice(item.price)}
              </p>
              <p className="text-sm font-medium text-zinc-500">
                {item.unit ?? ""}
              </p>
            </div>

            {localUnit && (
              <p className="mt-1 text-sm font-semibold text-zinc-600">
                ≈ R$ {formatPrice(localUnit.value)}{" "}
                <span className="font-normal text-zinc-400">
                  /{localUnit.label}
                </span>
              </p>
            )}
          </>
        ) : (
          <p className="text-sm font-medium text-zinc-400">
            Preço ainda não disponível
          </p>
        )}
      </div>

      {/* Row 3: Trend phrase + timestamp */}
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-zinc-600">{trend}</span>

        <span className="text-zinc-400 truncate">
          {updated && updated !== "—" ? (
            <>Atualizado: {updated}</>
          ) : (
            "Indisponível"
          )}
        </span>
      </div>

      {/* Row 4: Subtle "see more" indicator */}
      <div className="mt-3 flex items-center justify-end">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          Ver detalhes
          <span
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
