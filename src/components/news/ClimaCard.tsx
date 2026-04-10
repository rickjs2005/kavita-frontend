// src/components/news/ClimaCard.tsx
//
// Clima card em dark glass — accent secundário sky-400 (água/frio)
// para diferenciar do emerald do News e do amber do Mercado do Café.

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
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toFixed(1);
}

export function ClimaCard({ item }: { item: PublicClima }) {
  const updated = formatDateSafe(item.last_update_at);

  return (
    <Link
      href={`/news/clima/${item.slug}`}
      aria-label={`Ver detalhes do clima em ${item.city_name}-${item.uf}`}
      className="
        group relative block overflow-hidden rounded-2xl bg-white/[0.04] p-5
        ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm
        transition-all duration-300
        hover:-translate-y-0.5 hover:bg-white/[0.06] hover:ring-sky-400/30
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50
      "
    >
      {/* Top highlight sky */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/40 to-transparent"
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
            Monitoramento de chuva
          </p>
          <p className="mt-1.5 truncate text-base font-semibold tracking-tight text-stone-50">
            {item.city_name}
            <span className="ml-2 text-stone-500" aria-hidden>
              ·
            </span>
            <span className="ml-2 text-stone-400">{item.uf}</span>
          </p>

          <div className="mt-3 inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-300 ring-1 ring-white/10">
              <span
                className="h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.7)]"
                aria-hidden
              />
              Ao vivo
            </span>
            {item.source && (
              <span className="inline-flex items-center rounded-full bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-stone-400 ring-1 ring-white/[0.06]">
                {item.source}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="rounded-xl bg-white/[0.05] px-3 py-2 ring-1 ring-white/10">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              24h
            </p>
            <p className="mt-0.5 text-base font-bold tracking-tight text-stone-50">
              {formatMm(item.mm_24h)}
              <span className="ml-1 text-[11px] font-medium text-stone-400">
                mm
              </span>
            </p>
          </div>

          <div className="mt-2 rounded-xl bg-white/[0.05] px-3 py-2 ring-1 ring-white/10">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              7d
            </p>
            <p className="mt-0.5 text-base font-bold tracking-tight text-stone-50">
              {formatMm(item.mm_7d)}
              <span className="ml-1 text-[11px] font-medium text-stone-400">
                mm
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3 text-[10px] font-semibold uppercase tracking-[0.14em]">
        <span className="truncate text-stone-500">
          {updated ? `Atualizado ${updated}` : "Indisponível"}
        </span>

        <span className="inline-flex shrink-0 items-center gap-1 text-sky-300 transition-colors group-hover:text-sky-200">
          Detalhes
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
