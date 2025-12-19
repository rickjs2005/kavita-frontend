// src/components/news/ClimaCard.tsx
import Link from "next/link";
import type { PublicClima } from "@/lib/newsPublicApi";

function formatDateSafe(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function formatMm(v: any) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(2);
}

export function ClimaCard({ item }: { item: PublicClima }) {
  const updated = formatDateSafe(item.last_update_at);

  return (
    <Link
      href={`/news/clima/${item.slug}`}
      aria-label={`Ver detalhes do clima em ${item.city_name}-${item.uf}`}
      className="
        group block rounded-2xl border border-zinc-200 bg-white p-4 md:p-5
        shadow-sm transition-all
        hover:-translate-y-[1px] hover:shadow-md hover:border-zinc-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-zinc-900">
            {item.city_name} <span className="text-zinc-400" aria-hidden>•</span> {item.uf}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Monitoramento de chuva (24h e 7 dias).
          </p>

          <div className="mt-3 inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
              Atualização contínua
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
              {item.source ? `Fonte: ${item.source}` : "Fonte: -"}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">24h</p>
            <p className="text-sm font-semibold text-zinc-900">
              {formatMm(item.mm_24h)} <span className="font-medium text-zinc-600">mm</span>
            </p>
          </div>

          <div className="mt-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">7d</p>
            <p className="text-sm font-semibold text-zinc-900">
              {formatMm(item.mm_7d)} <span className="font-medium text-zinc-600">mm</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-500">
        <span className="truncate">{updated ? `Atualizado: ${updated}` : "Atualização: indisponível"}</span>

        <span className="inline-flex items-center gap-2 font-medium text-emerald-700">
          Ver detalhes
          <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
