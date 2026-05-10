// src/components/news/ClimaWidget.tsx
//
// Widget compacto de clima usado no painel inferior do /news.
//
// Layout adaptativo:
//   - Quando o backend retorna temperature_c (Open-Meteo current weather),
//     o card mostra a temperatura como heroi visual + condition + pillulas
//     de umidade e vento + chuva 24h.
//   - Quando temperature_c esta ausente (cidade ainda nao sincronizada
//     apos a migration de current weather), o card cai pro layout antigo
//     baseado so em chuva.
//
// Nunca inventa dado. Cada metrica desaparece se o backend nao mandar.

import Link from "next/link";
import type { PublicClima } from "@/lib/newsPublicApi";

function formatMm(v: PublicClima["mm_24h"]): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

function formatTemp(v: PublicClima["temperature_c"]): string | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n).toString();
}

function formatWind(v: PublicClima["wind_kmh"]): string | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n).toString();
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

/** Fallback para quando o backend ainda nao mandou `condition` (current ausente). */
function describeRainFallback(mm24h: PublicClima["mm_24h"]): { label: string; icon: string } {
  const n = Number(mm24h);
  if (!Number.isFinite(n) || n <= 0)
    return { label: "Sem chuva nas últimas 24h", icon: "☀️" };
  if (n < 2.5) return { label: "Chuva fraca", icon: "🌦️" };
  if (n < 10) return { label: "Chuva moderada", icon: "🌧️" };
  if (n < 25) return { label: "Chuva forte", icon: "⛈️" };
  return { label: "Chuva muito forte", icon: "🌩️" };
}

/** Mapeia condition (texto vindo do backend) para um emoji decorativo.
 *  O emoji e' apenas estetico — o texto e' a fonte de verdade. */
function iconForCondition(cond: string | null | undefined): string {
  if (!cond) return "🌡️";
  const c = cond.toLowerCase();
  if (c.includes("trovoada")) return "⛈️";
  if (c.includes("granizo")) return "🌨️";
  if (c.includes("neve")) return "🌨️";
  if (c.includes("chuva forte") || c.includes("pancadas")) return "🌧️";
  if (c.includes("chuva")) return "🌦️";
  if (c.includes("chuvisco")) return "🌦️";
  if (c.includes("nublado") || c.includes("encoberto")) return "☁️";
  if (c.includes("parcial")) return "⛅";
  if (c.includes("nevoa") || c.includes("névoa")) return "🌫️";
  if (c.includes("limpo") || c.includes("claro")) return "☀️";
  return "🌡️";
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

  const tempStr = formatTemp(primary.temperature_c);
  const windStr = formatWind(primary.wind_kmh);
  const updated = formatDateSafe(primary.last_update_at);

  // Modo "rico" quando temos temperatura — caso contrario, fallback chuva.
  const hasRichData = tempStr !== null || primary.condition;
  const conditionLabel =
    primary.condition || describeRainFallback(primary.mm_24h).label;
  const icon = primary.condition
    ? iconForCondition(primary.condition)
    : describeRainFallback(primary.mm_24h).icon;

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

      {/* Linha principal — heroi: temperatura quando disponivel; senao chuva */}
      <div className="mt-4 flex items-start gap-4">
        <span
          aria-hidden
          className="text-4xl leading-none drop-shadow-[0_2px_8px_rgba(56,189,248,0.35)]"
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-50">
            {primary.city_name}
            <span className="ml-1.5 font-medium text-stone-500">
              · {primary.uf}
            </span>
          </p>
          <p className="text-xs text-stone-400">{conditionLabel}</p>
        </div>

        {tempStr !== null && (
          <div className="shrink-0 text-right">
            <p className="text-3xl font-extrabold leading-none tracking-tight text-stone-50 tabular-nums">
              {tempStr}
              <span className="text-base font-semibold text-stone-400">°C</span>
            </p>
          </div>
        )}
      </div>

      {/* Metricas — adapta com base nos campos disponiveis */}
      {hasRichData ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric
            label="Umidade"
            value={primary.humidity_pct ?? null}
            unit="%"
            available={primary.humidity_pct !== null && primary.humidity_pct !== undefined}
          />
          <Metric
            label="Vento"
            value={windStr}
            unit="km/h"
            available={windStr !== null}
          />
          <Metric
            label="Chuva 24h"
            value={formatMm(primary.mm_24h)}
            unit="mm"
            available
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric label="Chuva 24h" value={formatMm(primary.mm_24h)} unit="mm" available />
          <Metric label="Acumulado 7d" value={formatMm(primary.mm_7d)} unit="mm" available />
        </div>
      )}

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
              {formatTemp(c.temperature_c) !== null ? (
                <span className="tabular-nums text-stone-300">
                  {formatTemp(c.temperature_c)}°
                </span>
              ) : (
                <span className="tabular-nums text-stone-300">
                  {formatMm(c.mm_24h)}mm
                </span>
              )}
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

function Metric({
  label,
  value,
  unit,
  available,
}: {
  label: string;
  value: string | number | null | undefined;
  unit: string;
  available: boolean;
}) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/[0.06]">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-stone-50 tabular-nums">
        {available && value !== null && value !== undefined && value !== "" ? value : "—"}
        <span className="ml-0.5 text-[10px] font-medium text-stone-400">
          {unit}
        </span>
      </p>
    </div>
  );
}
