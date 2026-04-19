"use client";

// src/app/painel/corretora/analytics/AnalyticsClient.tsx
//
// Dashboard analítico do painel interno da corretora. Reaproveita o
// shape do admin (KPIs + SLA p50/p90 + gráfico linha) mas com dados
// tenant-scoped + comparativo regional anônimo.
//
// Filosofia visual: dark editorial + amber (coerente com PanelClient,
// diferente do tom slate do admin). Nada de dashboard poluído —
// primeira fila de cards cobre o essencial, segunda detalha SLA,
// terceira serve funil + série temporal. Sem widgets vazios: se a
// base não tem dados confiáveis, o card some ou mostra estado vazio
// honesto.

import { useCallback, useEffect, useState } from "react";
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
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";

type Range = "7d" | "30d" | "90d";

type Analytics = {
  range: Range;
  days: number;
  window: { from: string; to: string };
  totals: {
    leads: number;
    leads_responded: number;
    leads_under_1h: number;
    leads_under_24h: number;
    delta: {
      leads: number | null;
      leads_responded: number | null;
      leads_under_1h: number | null;
    };
  };
  rates: {
    response_rate: number | null;
    under_1h_rate: number | null;
    under_24h_rate: number | null;
    close_rate: number | null;
  };
  funnel: {
    new: number;
    contacted: number;
    closed: number;
    lost: number;
  };
  sla: {
    count: number;
    avg_seconds: number | null;
    p50_seconds: number | null;
    p90_seconds: number | null;
    delta: {
      avg_seconds: number | null;
      p50_seconds: number | null;
    };
  };
  leadsByDay: Array<{ day: string; total: number }>;
  regional: {
    city: string | null;
    region_avg_seconds: number | null;
    region_sample_size: number;
  };
};

function humanizeSeconds(s: number | null): string {
  if (s === null || s === undefined) return "—";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}min`;
  if (s < 86400) return `${(s / 3600).toFixed(1)}h`;
  return `${(s / 86400).toFixed(1)}d`;
}

function DeltaBadge({
  value,
  invertColor = false,
}: {
  value: number | null;
  invertColor?: boolean;
}) {
  if (value === null || value === undefined) {
    return (
      <span className="text-[10px] font-medium text-stone-500">—</span>
    );
  }
  if (value === 0) {
    return (
      <span className="text-[10px] font-medium text-stone-500">0%</span>
    );
  }
  // invertColor=true para métricas onde "menor é melhor" (tempo SLA).
  const up = value > 0;
  const good = invertColor ? !up : up;
  const color = good ? "text-emerald-300" : "text-rose-300";
  return (
    <span className={`text-[10px] font-semibold ${color}`}>
      {up ? "↑" : "↓"} {Math.abs(value)}%
    </span>
  );
}

function SlaDeltaBadge({ seconds }: { seconds: number | null }) {
  if (seconds === null || seconds === undefined) {
    return (
      <span className="text-[10px] font-medium text-stone-500">—</span>
    );
  }
  if (seconds === 0) {
    return (
      <span className="text-[10px] font-medium text-stone-500">estável</span>
    );
  }
  // Tempo: negativo = melhorou (respondeu mais rápido).
  const slower = seconds > 0;
  const color = slower ? "text-rose-300" : "text-emerald-300";
  return (
    <span className={`text-[10px] font-semibold ${color}`}>
      {slower ? "↑" : "↓"} {humanizeSeconds(Math.abs(seconds))}
    </span>
  );
}

function KpiCard({
  label,
  value,
  sub,
  delta,
  invertDeltaColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number | null;
  invertDeltaColor?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/[0.08] backdrop-blur-sm">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
      />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
          {label}
        </p>
        {delta !== undefined && (
          <DeltaBadge value={delta ?? null} invertColor={invertDeltaColor} />
        )}
      </div>
      <p className="relative mt-2 text-2xl font-semibold tabular-nums text-stone-50">
        {value}
      </p>
      {sub && (
        <p className="relative mt-1 text-[11px] text-stone-400">{sub}</p>
      )}
    </div>
  );
}

function FunnelBar({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "amber" | "emerald" | "rose" | "stone";
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const toneBar = {
    amber: "bg-amber-400/70",
    emerald: "bg-emerald-400/70",
    rose: "bg-rose-400/60",
    stone: "bg-stone-500/60",
  }[tone];
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-stone-300">{label}</span>
        <span className="font-semibold tabular-nums text-stone-100">
          {value}{" "}
          {total > 0 && (
            <span className="text-stone-500">({pct}%)</span>
          )}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <div className={`h-full ${toneBar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsClient() {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Analytics>(
        `/api/corretora/analytics?range=${range}`,
      );
      setData(res);
    } catch (err) {
      toast.error(
        formatApiError(err, "Erro ao carregar analytics.").message,
      );
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  // Comparativo regional: só mostra se o backend garantiu amostra
  // suficiente (regional.region_avg_seconds != null → >= MIN_SAMPLE).
  const hasRegional =
    data?.regional.region_avg_seconds != null &&
    data?.sla.avg_seconds != null;
  const regionalDelta = hasRegional
    ? (data!.sla.avg_seconds as number) -
      (data!.regional.region_avg_seconds as number)
    : null;

  return (
    <div className="space-y-6">
      {/* Hero editorial + range selector.
          Em mobile o range segmented control desce pra linha abaixo e
          ocupa toda a largura (3 segmentos iguais com tap target ≥44px);
          em sm+ fica ancorado à direita como antes. */}
      <header className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6 md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/90 sm:tracking-[0.2em]">
              Sala Reservada · Analytics
            </p>
            <h1 className="mt-2 text-[clamp(1.5rem,6vw,1.75rem)] font-semibold tracking-tight text-stone-50 sm:text-2xl md:text-3xl">
              Sua operação em números
            </h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-stone-300 sm:text-sm">
              Volume de leads, tempo de resposta e conversão da sua
              corretora nos últimos {data?.days ?? "…"} dias. Deltas comparam
              com o período anterior de mesma duração.
            </p>
          </div>

          <div className="flex w-full items-stretch gap-1 rounded-xl bg-white/[0.04] p-1 ring-1 ring-white/[0.08] sm:w-auto sm:items-center">
            {(["7d", "30d", "90d"] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`flex-1 rounded-lg px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors sm:flex-none sm:py-1.5 ${
                  range === r
                    ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30"
                    : "text-stone-400 hover:text-stone-100"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading && !data && (
        <div className="rounded-2xl bg-white/[0.03] p-10 text-center text-sm text-stone-400 ring-1 ring-white/[0.06]">
          Carregando analytics…
        </div>
      )}

      {data && (
        <>
          {/* KPIs primários: volume + resposta */}
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard
              label="Leads recebidos"
              value={data.totals.leads.toLocaleString("pt-BR")}
              delta={data.totals.delta.leads}
            />
            <KpiCard
              label="Respondidos"
              value={data.totals.leads_responded.toLocaleString("pt-BR")}
              sub={
                data.rates.response_rate !== null
                  ? `${data.rates.response_rate}% dos leads`
                  : undefined
              }
              delta={data.totals.delta.leads_responded}
            />
            <KpiCard
              label="Resp. < 1h"
              value={
                data.rates.under_1h_rate !== null
                  ? `${data.rates.under_1h_rate}%`
                  : "—"
              }
              sub={`${data.totals.leads_under_1h} leads em até 1h`}
              delta={data.totals.delta.leads_under_1h}
            />
            <KpiCard
              label="Taxa de fechamento"
              value={
                data.rates.close_rate !== null
                  ? `${data.rates.close_rate}%`
                  : "—"
              }
              sub={`${data.funnel.closed} fechados`}
            />
          </section>

          {/* SLA: 3 cards (avg, p50, p90) */}
          <section className="relative overflow-hidden rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06] sm:p-6">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-stone-100">
                Tempo de resposta
              </h2>
              <p className="text-[10px] text-stone-500">
                base:{" "}
                <span className="text-stone-300">
                  {data.sla.count}{" "}
                  {data.sla.count === 1
                    ? "lead respondido"
                    : "leads respondidos"}
                </span>
              </p>
            </div>

            {data.sla.count === 0 ? (
              <p className="py-4 text-center text-xs text-stone-500">
                Nenhum lead respondido no período. Quando você mover o status
                para &quot;Contato&quot;, o SLA aparece aqui.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.05]">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                        Médio
                      </p>
                      <SlaDeltaBadge seconds={data.sla.delta.avg_seconds} />
                    </div>
                    <p className="mt-1 text-xl font-semibold text-stone-50">
                      {humanizeSeconds(data.sla.avg_seconds)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.05]">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                        Mediana (p50)
                      </p>
                      <SlaDeltaBadge seconds={data.sla.delta.p50_seconds} />
                    </div>
                    <p className="mt-1 text-xl font-semibold text-stone-50">
                      {humanizeSeconds(data.sla.p50_seconds)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.05]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                      p90
                    </p>
                    <p className="mt-1 text-xl font-semibold text-stone-50">
                      {humanizeSeconds(data.sla.p90_seconds)}
                    </p>
                    <p className="mt-1 text-[10px] text-stone-500">
                      90% responde em até este tempo
                    </p>
                  </div>
                </div>

                {/* Comparativo regional: só aparece com amostra
                    estatisticamente útil (MIN_SAMPLE do backend).
                    Em mobile o badge desce pra linha abaixo do texto; em
                    sm+ fica à direita. */}
                {hasRegional && (
                  <div className="mt-4 flex flex-col gap-2.5 rounded-xl bg-amber-400/[0.06] p-3 ring-1 ring-amber-400/15 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/90">
                        Sua cidade · {data.regional.city}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-stone-200">
                        Média da região:{" "}
                        <strong className="text-stone-50">
                          {humanizeSeconds(data.regional.region_avg_seconds)}
                        </strong>{" "}
                        <span className="text-stone-500">
                          ({data.regional.region_sample_size} leads respondidos
                          por outras corretoras)
                        </span>
                      </p>
                    </div>
                    <span
                      className={`self-start whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold sm:self-auto ${
                        regionalDelta !== null && regionalDelta < 0
                          ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30"
                          : "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30"
                      }`}
                    >
                      {regionalDelta !== null && regionalDelta < 0
                        ? `⚡ Você é ${humanizeSeconds(Math.abs(regionalDelta))} mais rápido`
                        : `⏱ Você está ${humanizeSeconds(Math.abs(regionalDelta ?? 0))} mais lento`}
                    </span>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Série temporal */}
          <section className="relative overflow-hidden rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06] sm:p-6">
            <h2 className="mb-3 text-sm font-semibold text-stone-100">
              Leads por dia
            </h2>
            {data.leadsByDay.length === 0 ? (
              <p className="py-8 text-center text-xs text-stone-500">
                Sem leads no período selecionado.
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.leadsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "#a8a29e", fontSize: 11 }}
                      tickFormatter={(v) => String(v).slice(5)}
                    />
                    <YAxis
                      tick={{ fill: "#a8a29e", fontSize: 11 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1c1917",
                        border: "1px solid #44403c",
                        borderRadius: 8,
                        fontSize: 12,
                        color: "#f5f5f4",
                      }}
                      labelStyle={{ color: "#d6d3d1" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* Funil por status */}
          <section className="relative overflow-hidden rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.06] sm:p-6">
            <h2 className="mb-3 text-sm font-semibold text-stone-100">
              Funil por status
            </h2>
            {data.totals.leads === 0 ? (
              <p className="py-4 text-center text-xs text-stone-500">
                Sem leads no período.
              </p>
            ) : (
              <div className="space-y-3">
                <FunnelBar
                  label="Novos (aguardando)"
                  value={data.funnel.new}
                  total={data.totals.leads}
                  tone="amber"
                />
                <FunnelBar
                  label="Em contato"
                  value={data.funnel.contacted}
                  total={data.totals.leads}
                  tone="amber"
                />
                <FunnelBar
                  label="Fechados"
                  value={data.funnel.closed}
                  total={data.totals.leads}
                  tone="emerald"
                />
                <FunnelBar
                  label="Perdidos"
                  value={data.funnel.lost}
                  total={data.totals.leads}
                  tone="rose"
                />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
