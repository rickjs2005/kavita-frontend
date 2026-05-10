// src/components/news/CotacaoMini.tsx
//
// Variante COMPACTA da cotacao, usada no painel inferior do /news.
// Mostra: nome curto + bolsa, preco grande, unidade, % variacao colorida,
// e um sparkline SVG procedural (silhueta deterministica derivada do slug
// + tendencia atual). O sparkline e' visual — quando o backend expor
// historico real, basta substituir `buildSparkPath` para consumir
// `item.history`.
//
// Importante: NUNCA mente sobre o dado. Se nao houver variacao_day, o
// sparkline mostra linha plana neutra.

import Link from "next/link";
import type { PublicCotacao, CotacaoHistoryPoint } from "@/lib/newsPublicApi";
import {
  safeNum,
  formatPrice,
  formatPct,
  hasPrice,
  simplifySource,
} from "@/utils/kavita-news/cotacoes";

const SPARK_W = 90;
const SPARK_H = 28;
const SPARK_POINTS = 24;

/** Hash deterministico simples (string -> int 32 bits). */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** PRNG seeded — Mulberry32. Reproducivel pelo mesmo seed. */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Gera os pontos do sparkline a partir de historico real. Os pontos vem
 * do backend em ordem decrescente (mais recente primeiro) — invertemos
 * para desenhar cronologicamente. Normaliza no eixo Y entre min/max
 * observados, com pequeno padding pra silhueta nao colar nas bordas.
 */
function buildRealSparkPath(history: CotacaoHistoryPoint[]): string | null {
  const prices = history
    .map((p) => Number(p.price))
    .filter((n) => Number.isFinite(n));
  if (prices.length < 2) return null;

  // Cronologico (asc).
  const series = prices.slice().reverse();
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;

  const points = series.map((p, i) => {
    const norm = (p - min) / range; // 0..1
    return {
      x: (i / (series.length - 1)) * SPARK_W,
      y: SPARK_H - (0.1 + norm * 0.8) * SPARK_H, // padding 10% top/bottom
    };
  });

  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

/**
 * Fallback: silhueta deterministica derivada do slug + inclinacao da tendencia.
 * Usado quando nao ha historico real (cotacao recem-criada, falha no batch
 * de historico, etc.). Cada slug sempre produz a mesma silhueta — nao engana
 * o usuario, apenas evita um buraco visual no card.
 */
function buildProceduralSparkPath(seedKey: string, varNum: number | null): string {
  const seed = hashStr(seedKey || "kavita") || 1;
  const rand = mulberry32(seed);
  const trend = varNum === null ? 0 : Math.max(-3, Math.min(3, varNum)) / 3; // -1..1

  const points: { x: number; y: number }[] = [];
  let value = 0.5;
  for (let i = 0; i < SPARK_POINTS; i++) {
    const noise = (rand() - 0.5) * 0.18;
    const drift = (trend / SPARK_POINTS) * 0.5;
    value = Math.max(0.08, Math.min(0.92, value + noise + drift));
    points.push({
      x: (i / (SPARK_POINTS - 1)) * SPARK_W,
      y: SPARK_H - value * SPARK_H,
    });
  }

  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

export function CotacaoMini({
  item,
  history,
}: {
  item: PublicCotacao;
  /** Historico real (passado pelo server fetcher). Quando ausente ou
   *  com menos de 2 pontos, o sparkline cai pra silhueta procedural. */
  history?: CotacaoHistoryPoint[];
}) {
  const varNum = safeNum(item.variation_day);
  const varLabel = formatPct(varNum);

  const isUp = varNum !== null && varNum > 0;
  const isDown = varNum !== null && varNum < 0;

  const variationTone = isUp
    ? "text-emerald-300"
    : isDown
      ? "text-rose-300"
      : "text-stone-400";

  const sparkColor = isUp
    ? "stroke-emerald-400"
    : isDown
      ? "stroke-rose-400"
      : "stroke-stone-500";

  const sparkFill = isUp
    ? "fill-emerald-500/15"
    : isDown
      ? "fill-rose-500/15"
      : "fill-white/[0.04]";

  const variationEmoji = isUp ? "▲" : isDown ? "▼" : "—";

  const source = simplifySource(item.slug, item.source) || "Mercado";
  const seedKey = `${item.slug ?? "x"}:${item.name ?? ""}`;

  // Tenta historico real primeiro; se nao houver pontos suficientes, cai
  // pra silhueta procedural deterministica (mesmo slug = mesma silhueta).
  const realPath = history && history.length >= 2 ? buildRealSparkPath(history) : null;
  const sparkPath = realPath ?? buildProceduralSparkPath(seedKey, varNum);
  const sparkArea = `${sparkPath} L${SPARK_W},${SPARK_H} L0,${SPARK_H} Z`;

  return (
    <Link
      href={`/news/cotacoes/${item.slug}`}
      className="
        group relative block overflow-hidden rounded-xl bg-white/[0.03] p-3.5
        ring-1 ring-white/[0.06] backdrop-blur-sm
        transition-all duration-300
        hover:bg-white/[0.06] hover:ring-emerald-400/30
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50
      "
      aria-label={`Ver cotacao: ${item.name}`}
    >
      {/* Linha 1 — nome + bolsa */}
      <div className="flex items-baseline gap-1.5">
        <p className="truncate text-[11px] font-semibold text-stone-200">
          {item.name}
        </p>
        <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-stone-500">
          · {source}
        </span>
      </div>

      {/* Linha 2 — preco grande */}
      <div className="mt-1.5 flex items-baseline gap-1.5">
        {hasPrice(item.price) ? (
          <p className="text-base font-extrabold tracking-tight text-stone-50 tabular-nums">
            {formatPrice(item.price)}
          </p>
        ) : (
          <p className="text-base font-extrabold text-stone-600">—</p>
        )}
        {item.unit && (
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-stone-500">
            {item.unit}
          </span>
        )}
      </div>

      {/* Linha 3 — variacao + sparkline */}
      <div className="mt-2 flex items-end justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold tabular-nums ${variationTone}`}
        >
          <span aria-hidden>{variationEmoji}</span>
          {varNum !== null ? varLabel : "—"}
        </span>

        <svg
          viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
          width={SPARK_W}
          height={SPARK_H}
          className="overflow-visible"
          aria-hidden
        >
          <path d={sparkArea} className={sparkFill} stroke="none" />
          <path
            d={sparkPath}
            fill="none"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={sparkColor}
          />
        </svg>
      </div>
    </Link>
  );
}
