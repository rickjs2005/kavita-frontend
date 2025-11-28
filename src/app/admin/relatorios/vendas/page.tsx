"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,CartesianGrid,} from "recharts";
import toast from "react-hot-toast";
import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";
import { KpiCard } from "@/components/admin/KpiCard";
import {formatCurrency,formatShortDate,formatFullDate,formatFullDateShortYear,} from "@/utils/formatters";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminToken");
}

interface DailySale {
  date: string;
  total: number;
}

interface VendasAPIResponse {
  rows: {
    dia: string;
    total: number;
  }[];
}

export default function RelatorioVendasPage() {
  const [sales, setSales] = useState<DailySale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }

    const fetchSales = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get<VendasAPIResponse>(
          `${API_BASE}/api/admin/relatorios/vendas`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const mapped: DailySale[] =
          response.data.rows?.map((row) => ({
            date: row.dia,
            total: Number(row.total || 0),
          })) ?? [];

        setSales(mapped);
      } catch (err: any) {
        console.error(err);
        setError("Não foi possível carregar o relatório de vendas.");
        toast.error("Erro ao carregar relatório de vendas.");
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const totalFaturado = useMemo(
    () => sales.reduce((sum, sale) => sum + (sale.total || 0), 0),
    [sales]
  );

  const chartData = useMemo(
    () =>
      sales.map((sale) => ({
        label: formatShortDate(sale.date),
        total: sale.total,
      })),
    [sales]
  );

  return (
    <main className="w-full px-3 pb-6 pt-4 sm:px-6 lg:px-8">
      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Cabeçalho */}
        <header className="relative space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#35c2c4] sm:text-3xl">
              Relatório de Vendas
            </h1>

            {/* Voltar só em telas médias pra cima */}
            <CustomButton
              label="← Voltar para relatórios"
              href="/admin/relatorios"
              variant="secondary"
              size="small"
              isLoading={false}
              className="hidden md:inline-flex shrink-0 justify-center"
            />
          </div>

          <p className="max-w-xl text-xs text-slate-300 sm:text-sm">
            Total de vendas por dia. Ideal para entender sazonalidade e
            desempenho do faturamento.
          </p>

          <p className="text-sm font-semibold text-slate-100 sm:text-base">
            Total faturado:{" "}
            <span className="text-[#35c2c4]">
              {formatCurrency(totalFaturado)}
            </span>
          </p>

          {/* Close só no mobile, funciona como "voltar" */}
          <div className="absolute right-0 top-0 translate-y-1 md:hidden">
            <CloseButton className="text-2xl text-slate-400 hover:text-slate-100" />
          </div>
        </header>

        {/* Card principal */}
        <div
          className="
            rounded-3xl border border-slate-800 bg-slate-950/70 
            p-4 shadow-[0_18px_45px_rgba(0,0,0,0.65)] backdrop-blur
            sm:p-6
          "
        >
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              Carregando relatório de vendas...
            </div>
          ) : error ? (
            <div className="flex h-40 items-center justify-center">
              <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-red-950/10 px-4 py-3 text-center text-sm text-red-400">
                {error}
              </div>
            </div>
          ) : sales.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-slate-400">
              <span>Nenhuma venda encontrada para o período selecionado.</span>
            </div>
          ) : (
            <>
              {/* Gráfico + KPIs */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Gráfico ocupa 2 colunas no desktop */}
                <div className="space-y-3 lg:col-span-2">
                  <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                    Faturamento diário
                  </h2>
                  <div className="h-64 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#1e293b"
                        />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: "#1f2937" }}
                        />
                        <YAxis
                          tick={{ fill: "#9ca3af", fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: "#1f2937" }}
                        />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label: string) =>
                            `Dia ${label}`
                          }
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "0.75rem",
                            color: "#020617",
                            fontSize: 12,
                            boxShadow:
                              "0 15px 35px rgba(15,23,42,0,0.22)",
                          }}
                        />
                        <Bar
                          dataKey="total"
                          radius={[10, 10, 0, 0]}
                          fill="#35c2c4"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* KPIs rápidos */}
                <div className="space-y-3 lg:col-span-1">
                  <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                    Visão rápida
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <KpiCard
                      label="Dias com vendas"
                      value={sales.length}
                      helper="Quantidade de dias com faturamento registrado."
                      icon={<span>📅</span>}
                      variant="default"
                    />
                    <KpiCard
                      label="Ticket médio (por dia)"
                      value={formatCurrency(totalFaturado / (sales.length || 1))}
                      helper="Faturamento médio diário."
                      icon={<span>💳</span>}
                      variant="success"
                    />
                    <KpiCard
                      label="Maior dia de vendas"
                      value={getBestDayLabel(sales)}
                      helper="Dia com maior faturamento."
                      icon={<span>📈</span>}
                      variant="warning"
                    />
                  </div>
                </div>
              </div>

              {/* Tabela de vendas por dia */}
              <div className="mt-8 space-y-3">
                <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                  Detalhamento por dia
                </h2>
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs text-slate-200 sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80">
                          <th className="px-4 py-3 font-semibold">Dia</th>
                          <th className="px-4 py-3 text-right font-semibold">
                            Total (R$)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((sale) => (
                          <tr
                            key={sale.date}
                            className="border-b border-slate-900/80 last:border-none"
                          >
                            <td className="px-4 py-2.5 align-middle">
                              <span className="block text-[11px] text-slate-400 sm:hidden">
                                {formatShortDate(sale.date)}
                              </span>
                              <span className="hidden sm:inline">
                                {formatFullDate(sale.date)}
                              </span>
                              <span className="inline sm:hidden">
                                {formatFullDateShortYear(sale.date)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right align-middle">
                              {formatCurrency(sale.total)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-slate-900/80">
                          <td className="px-4 py-3 font-semibold">Total</td>
                          <td className="px-4 py-3 text-right font-semibold text-[#35c2c4]">
                            {formatCurrency(totalFaturado)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

/* ---------- HELPERS ---------- */

function getBestDayLabel(sales: DailySale[]): string {
  if (!sales.length) return "-";
  const best = sales.reduce((prev, curr) =>
    curr.total > prev.total ? curr : prev
  );
  return `${formatShortDate(best.date)} · ${formatCurrency(best.total)}`;
}
