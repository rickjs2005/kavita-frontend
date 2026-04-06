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
} from "@/utils/kavita-news/cotacoes";

export function CotacaoCard({ item }: { item: PublicCotacao }) {
  const varNum = safeNum(item.variation_day);
  const varLabel = formatPct(varNum);

  const isUp = varNum !== null && varNum > 0;
  const isDown = varNum !== null && varNum < 0;
  const isFlat = varNum !== null && varNum === 0;

  const variationTone = isUp
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : isDown
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-zinc-200 bg-zinc-50 text-zinc-700";

  const variationEmoji = isUp ? "📈" : isDown ? "📉" : "";

  const emoji = getMarketEmoji(item);
  const updated = formatDatePtBR(item.last_update_at);

  return (
    <Link
      href={`/news/cotacoes/${item.slug}`}
      className="
        group block rounded-2xl border border-zinc-200 bg-white p-4 md:p-5
        shadow-sm transition-all
        hover:-translate-y-[1px] hover:shadow-md hover:border-zinc-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
      "
      aria-label={`Ver detalhes da cotação: ${item.name}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-zinc-900">
            {emoji} {item.name}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {item.group_key ? item.group_key : "Mercado"} •{" "}
            {item.type ?? "Tipo -"}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${variationTone}`}
            >
              <span className="sr-only">Variação do dia</span>
              {variationEmoji ? (
                <span aria-hidden>{variationEmoji}</span>
              ) : null}
              Dia: {varLabel}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">
              <span aria-hidden>🌍</span>
              {item.source ? `Fonte: ${item.source}` : "Fonte: -"}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">
            Preço
          </p>
          {hasPrice(item.price) ? (
            <>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-900">
                {formatPrice(item.price)}
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-600">
                {item.unit ?? ""}
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-sm font-medium text-zinc-400">
              Aguardando
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
        <span className="truncate">
          {updated && updated !== "—" ? (
            <>
              <span aria-hidden>⏱</span> Atualizado: {updated}
            </>
          ) : (
            "Atualização: indisponível"
          )}
        </span>

        <span className="inline-flex items-center gap-2 font-medium text-emerald-700">
          Ver detalhes
          <span
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </span>
      </div>

      {isFlat ? (
        <p className="mt-3 text-xs text-zinc-500">
          Sem variação relevante no dia.
        </p>
      ) : null}
    </Link>
  );
}
