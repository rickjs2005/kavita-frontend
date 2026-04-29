"use client";

// src/app/admin/mercado-do-cafe/metricas/MetricsClient.tsx
//
// Dashboard de métricas do Mercado do Café.
//
// Padrão "Stripe-like":
//   - Range selector 7d/30d/90d
//   - KPIs com delta vs período anterior (cor por sinal)
//   - Série temporal (linha) de leads/dia
//   - Top cidades (barra horizontal)
//   - Distribuição de planos (cards)
//   - SLA (cards com p50/p90/avg humanizados)

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import { formatNumber } from "@/utils/formatters";

type Range = "7d" | "30d" | "90d";

type Metrics = {
  range: Range;
  days: number;
  window: { from: string; to: string };
  totals: {
    leads: number;
    leads_responded: number;
    leads_under_1h: number;
    leads_under_24h: number;
    reviews_approved: number;
    reviews_pending: number;
    reviews_rejected: number;
    delta: {
      leads: number | null;
      leads_responded: number | null;
      leads_under_1h: number | null;
      reviews_approved: number | null;
    };
  };
  rates: {
    response_rate: number | null;
    under_1h_rate: number | null;
    under_24h_rate: number | null;
  };
  sla: {
    count: number;
    avg_seconds: number | null;
    p50_seconds: number | null;
    p90_seconds: number | null;
  };
  leadsByDay: Array<{ day: string; total: number }>;
  leadsByCity: Array<{ cidade: string; total: number }>;
  plans: Array<{ slug: string; nome: string; total: number }>;
};

function humanizeSeconds(s: number | null): string {
  if (s === null || s === undefined) return "—";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)}h`;
  return `${(s / 86400).toFixed(1)}d`;
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null || value === undefined) {
    return <span className="text-[11px] text-slate-400">—</span>;
  }
  if (value === 0) {
    return <span className="text-[11px] text-slate-400">0%</span>;
  }
  const up = value > 0;
  const color = up
    ? "text-emerald-400"
    : "text-rose-400";
  return (
    <span className={`text-[11px] font-semibold ${color}`}>
      {up ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

function Kpi({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {label}
        </p>
        {delta !== undefined && <DeltaBadge value={delta ?? null} />}
      </div>
      <p className="mt-2 text-2xl font-semibold text-slate-50 tabular-nums">
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

export default function MetricsClient() {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<Metrics>(
        `/api/admin/mercado-do-cafe/metrics?range=${range}`,
      );
      setData(res);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        window.location.href = "/admin/login";
        return;
      }
      setError("Erro ao carregar métricas.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  const maxCity = data?.leadsByCity.reduce((m, c) => Math.max(m, c.total), 0) ?? 0;

  return (
    <div className="relative min-h-screen w-full">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div>
            <Link
              href="/admin/mercado-do-cafe"
              className="text-[11px] font-semibold text-slate-400 hover:text-amber-300"
            >
              ← Mercado do Café
            </Link>
            <h1 className="mt-1 text-base font-semibold text-slate-50 sm:text-lg">
              Métricas do Mercado do Café
            </h1>
            <p className="text-[11px] text-slate-400">
              Últimos {data?.days ?? "…"} dias · deltas vs período anterior equivalente.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
            {(["7d", "30d", "90d"] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1 text-[11px] font-semibold transition-colors ${
                  range === r
                    ? "bg-amber-500/15 text-amber-200"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-3 pb-10 pt-4 sm:px-4">
        {loading && !data && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-400">
            Carregando…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* KPIs primários */}
            <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi
                label="Leads"
                value={formatNumber(data.totals.leads)}
                delta={data.totals.delta.leads}
              />
              <Kpi
                label="Respondidos"
                value={formatNumber(data.totals.leads_responded)}
                sub={
                  data.rates.response_rate !== null
                    ? `${data.rates.response_rate}% do total`
                    : undefined
                }
                delta={data.totals.delta.leads_responded}
              />
              <Kpi
                label="Resp. < 1h"
                value={
                  data.rates.under_1h_rate !== null
                    ? `${data.rates.under_1h_rate}%`
                    : "—"
                }
                sub={`${data.totals.leads_under_1h} leads`}
                delta={data.totals.delta.leads_under_1h}
              />
              <Kpi
                label="Reviews aprovadas"
                value={formatNumber(data.totals.reviews_approved)}
                sub={
                  data.totals.reviews_pending > 0
                    ? `+${data.totals.reviews_pending} pendentes`
                    : undefined
                }
                delta={data.totals.delta.reviews_approved}
              />
            </section>

            {/* SLA */}
            <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi
                label="SLA — Amostra"
                value={formatNumber(data.sla.count)}
                sub="leads com resposta registrada"
              />
              <Kpi
                label="SLA — Médio"
                value={humanizeSeconds(data.sla.avg_seconds)}
              />
              <Kpi
                label="SLA — p50"
                value={humanizeSeconds(data.sla.p50_seconds)}
                sub="mediana do tempo de resposta"
              />
              <Kpi
                label="SLA — p90"
                value={humanizeSeconds(data.sla.p90_seconds)}
                sub="90% respondem em até isto"
              />
            </section>

            {/* Série temporal */}
            <section className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <h2 className="text-sm font-semibold text-slate-100">
                Leads por dia
              </h2>
              <div className="mt-3 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.leadsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "var(--color-chart-tick)", fontSize: 11 }}
                      tickFormatter={(v) => String(v).slice(5)}
                    />
                    <YAxis
                      tick={{ fill: "var(--color-chart-tick)", fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-dark-600)",
                        border: "1px solid var(--color-chart-grid)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "var(--color-chart-tooltip-text)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="var(--color-chart-line-amber)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Top cidades + Planos */}
            <section className="mt-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h2 className="text-sm font-semibold text-slate-100">
                  Top cidades (leads)
                </h2>
                {data.leadsByCity.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-500">
                    Sem dados no período.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {data.leadsByCity.map((c) => {
                      const pct = maxCity > 0 ? (c.total / maxCity) * 100 : 0;
                      return (
                        <li key={c.cidade}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-300">{c.cidade}</span>
                            <span className="font-semibold tabular-nums text-slate-100">
                              {c.total}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full bg-amber-500/70"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <h2 className="text-sm font-semibold text-slate-100">
                  Corretoras por plano (ativo agora)
                </h2>
                {data.plans.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-500">
                    Sem planos cadastrados.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {data.plans.map((p) => (
                      <li
                        key={p.slug}
                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-200">
                            {p.nome}
                          </p>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">
                            {p.slug}
                          </p>
                        </div>
                        <span className="text-lg font-semibold tabular-nums text-slate-50">
                          {p.total}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
