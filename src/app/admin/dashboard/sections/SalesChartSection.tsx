"use client";

import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import type { AdminLog } from "../dashboardTypes";
import { formatMoney, formatLogDate, getInitials, LoadingSpinner, SalesTooltip } from "../dashboardUtils";

type ChartPoint = { date: string; total: number };

const RANGE_OPTIONS = [
  { label: "7d", value: 7 },
  { label: "15d", value: 15 },
  { label: "30d", value: 30 },
] as const;

type Props = {
  chartData: ChartPoint[];
  chartLoading?: boolean;
  salesRange?: number;
  onRangeChange?: (range: number) => void;
  logs: AdminLog[];
  logsLoading: boolean;
  logsError: string | null;
  canViewLogs: boolean;
};

export function SalesChartSection({
  chartData,
  chartLoading = false,
  salesRange = 7,
  onRangeChange,
  logs,
  logsLoading,
  logsError,
  canViewLogs,
}: Props) {
  const showLogs = canViewLogs;

  return (
    <section className={`grid grid-cols-1 gap-4 ${showLogs ? "lg:grid-cols-3" : ""}`}>
      {/* Sales chart — em mobile landscape (alturas de ~375px)
          o max-h de 340px cortava o grafico. Removemos o cap
          e deixamos o conteudo definir a altura, mantendo max-h
          apenas em lg+ onde divide espaco com o painel de logs. */}
      <div
        className={`col-span-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60 ${
          showLogs ? "lg:col-span-2 lg:max-h-[340px]" : ""
        }`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
              Vendas · {salesRange} últimos dias
            </p>
            <h2 className="text-sm font-semibold text-slate-50">
              Faturamento diário
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onRangeChange && (
              <div className="flex items-center gap-0.5 rounded-lg border border-slate-700/60 bg-slate-900/80 p-0.5">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onRangeChange(opt.value)}
                    disabled={chartLoading}
                    className={[
                      "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                      salesRange === opt.value
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                        : "text-slate-400 hover:text-slate-200",
                      chartLoading ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
            <Link
              href="/admin/relatorios/vendas"
              className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
            >
              Ver relatório &rarr;
            </Link>
          </div>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto">
          <div className="h-[220px] w-full sm:h-[260px]">
            {chartLoading ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Carregando gráfico...</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Nenhum dado de vendas recente.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={salesRange > 15 ? 12 : 24}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-chart-grid)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "var(--color-chart-tick-light)" }}
                    interval={salesRange > 15 ? Math.floor(salesRange / 8) : 0}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => formatMoney(value)}
                    tick={{ fontSize: 10, fill: "var(--color-chart-tick)" }}
                  />
                  <RechartsTooltip content={<SalesTooltip />} />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="var(--color-chart-bar-success)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Audit logs — only rendered for roles with access */}
      {showLogs && (
        <div className="col-span-1 flex max-h-[360px] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60 lg:max-h-[340px]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300">
                Atividade recente
              </p>
              <h2 className="text-sm font-semibold text-slate-50">
                Logs de admins
              </h2>
            </div>
            <span className="text-[10px] text-slate-500">Últimas 20 ações</span>
          </div>

          <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
            {logsLoading && (
              <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Carregando atividade recente...</span>
              </div>
            )}

            {logsError && !logsLoading && (
              <p className="text-xs text-rose-300">{logsError}</p>
            )}

            {!logsLoading && !logsError && logs.length === 0 && (
              <p className="text-xs text-slate-400">
                Nenhuma atividade registrada recentemente.
              </p>
            )}

            {!logsLoading &&
              !logsError &&
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-2 rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2.5"
                >
                  <div className="mt-[2px] flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-emerald-300">
                    {getInitials(log.admin_nome || "ADM")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-100">
                      {log.admin_nome || "Administrador"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-300">
                      {log.acao}
                      {log.detalhes && (
                        <span className="text-slate-400"> — {log.detalhes}</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {formatLogDate(log.criado_em)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </section>
  );
}
