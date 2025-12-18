// src/components/news/CotacaoCard.tsx
import Link from "next/link";
import type { PublicCotacao } from "@/lib/newsPublicApi";

export function CotacaoCard({ item }: { item: PublicCotacao }) {
  const varNum = item.variation_day !== null && item.variation_day !== undefined
    ? Number(item.variation_day)
    : null;

  const varLabel =
    varNum === null || Number.isNaN(varNum)
      ? "-"
      : `${varNum > 0 ? "+" : ""}${varNum.toFixed(2)}%`;

  return (
    <Link
      href={`/news/cotacoes/${item.slug}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-zinc-900">{item.name}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {item.group_key ? item.group_key : "sem grupo"} • {item.type ?? "tipo -"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-zinc-700">
            <span className="font-semibold">
              {item.price ?? "-"} {item.unit ?? ""}
            </span>
          </p>
          <p className="text-xs text-zinc-600 mt-1">Dia: {varLabel}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <span>{item.source ? `Fonte: ${item.source}` : "Fonte: -"}</span>
        <span>{item.last_update_at ? `Atualizado: ${item.last_update_at}` : ""}</span>
      </div>
    </Link>
  );
}
