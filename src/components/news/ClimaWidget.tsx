// src/components/news/ClimaWidget.tsx
//
// Widget compacto de clima usado no painel inferior do /news.
// Mostra a primeira cidade da rede com um destaque visual (chuva 24h
// como heroi do widget) + 7 dias + fonte. Quando o backend expor
// temperatura/vento/umidade no endpoint publico, basta preencher os
// blocos `extra` abaixo — sem inventar dado.

import Link from "next/link";
import type { PublicClima } from "@/lib/newsPublicApi";

function formatMm(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

function formatDateSafe(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function describeRain(mm24h: any): { label: string; icon: string } {
  const n = Number(mm24h);
  if (!Number.isFinite(n) || n <= 0)
    return { label: "Sem chuva nas últimas 24h", icon: "☀️" };
  if (n < 2.5) return { label: "Chuva fraca", icon: "🌦️" };
  if (n < 10) return { label: "Chuva moderada", icon: "🌧️" };
  if (n < 25) return { label: "Chuva forte", icon: "⛈️" };
  return { label: "Chuva muito forte", icon: "🌩️" };
}

export function ClimaWidget({
  items,
}: {
  /** Lista de cidades. O widget destaca a primeira; as demais ficam em rodape. */
  items: PublicClima[];
}) {
  const primary = items?.[0];
  const others = items?.slice(1, 4) ?? [];

  if (!primary) {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06] backdrop-blur-sm">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
          Clima agora
        </p>
        <p className="mt-3 text-sm text-stone-400">
          Rede de monitoramento sera ativada em breve.
        </p>
      </div>
    );
  }

  const rain = describeRain(primary.mm_24h);
  const updated = formatDateSafe(primary.last_update_at);

  return (
    <Link
      href={`/news/clima/${primary.slug}`}
      className="
        group relative block h-full overflow-hidden rounded-2xl bg-white/[0.03] p-5
        ring-1 ring-white/[0.06] backdrop-blur-sm
        transition-all duration-300
        hover:bg-white/[0.06] hover:ring-sky-400/30
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50
      "
    >
      {/* Hairline sky no topo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/40 to-transparent"
      />

      {/* Header — titulo + ver mapa */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
          Clima agora
        </p>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300 transition-colors group-hover:text-sky-200">
          Ver mapa <span aria-hidden>→</span>
        </span>
      </div>

      {/* Linha principal — icone + descricao + cidade */}
      <div className="mt-4 flex items-start gap-4">
        <span
          aria-hidden
          className="text-4xl leading-none drop-shadow-[0_2px_8px_rgba(56,189,248,0.35)]"
        >
          {rain.icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-stone-50">
            {primary.city_name}
            <span className="ml-1.5 font-medium text-stone-500">
              · {primary.uf}
            </span>
          </p>
          <p className="text-xs text-stone-400">{rain.label}</p>
        </div>
      </div>

      {/* Metricas — chuva 24h e 7d (dado real) */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.06]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Chuva 24h
          </p>
          <p className="mt-0.5 text-sm font-bold text-stone-50 tabular-nums">
            {formatMm(primary.mm_24h)}
            <span className="ml-0.5 text-[10px] font-medium text-stone-400">
              mm
            </span>
          </p>
        </div>
        <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.06]">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Acumulado 7d
          </p>
          <p className="mt-0.5 text-sm font-bold text-stone-50 tabular-nums">
            {formatMm(primary.mm_7d)}
            <span className="ml-0.5 text-[10px] font-medium text-stone-400">
              mm
            </span>
          </p>
        </div>
      </div>

      {/* Outras cidades em rodape (chip) */}
      {others.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/[0.06] pt-3">
          {others.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 rounded-full bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-stone-400 ring-1 ring-white/[0.06]"
            >
              {c.city_name}/{c.uf}
              <span className="text-stone-600">·</span>
              <span className="tabular-nums text-stone-300">
                {formatMm(c.mm_24h)}mm
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Footer — fonte e timestamp */}
      <div className="mt-3 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        <span className="truncate">{primary.source || "Rede Kavita"}</span>
        <span>{updated || "—"}</span>
      </div>
    </Link>
  );
}
