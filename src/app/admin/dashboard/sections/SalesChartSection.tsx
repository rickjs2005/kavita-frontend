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

type Props = {
  chartData: ChartPoint[];
  logs: AdminLog[];
  logsLoading: boolean;
  logsError: string | null;
  canViewLogs: boolean;
};

export function SalesChartSection({
  chartData,
  logs,
  logsLoading,
  logsError,
  canViewLogs,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Sales chart */}
      <div className="col-span-1 flex max-h-[340px] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60 lg:col-span-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
              Vendas · 7 últimos dias
            </p>
            <h2 className="text-sm font-semibold text-slate-50">
              Faturamento diário
            </h2>
          </div>
          <Link
            href="/admin/relatorios/vendas"
            className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
          >
            Ver relatório completo →
          </Link>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto">
          <div className="h-[260px] w-full">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                Nenhum dado de vendas recente.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={24}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1f2933"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#cbd5f5" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value: number) => formatMoney(value)}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <RechartsTooltip content={<SalesTooltip />} />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Audit logs */}
      <div className="col-span-1 flex max-h-[340px] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
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

          {!canViewLogs && (
            <p className="text-xs text-slate-400">
              Seu papel atual não possui acesso aos logs de auditoria.
            </p>
          )}

          {canViewLogs && !logsLoading && !logsError && logs.length === 0 && (
            <p className="text-xs text-slate-400">
              Nenhuma atividade registrada recentemente.
            </p>
          )}

          {canViewLogs &&
            !logsLoading &&
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
    </section>
  );
}
