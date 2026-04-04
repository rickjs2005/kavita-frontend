"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";

const VendasBarChart = dynamic(() => import("./VendasBarChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-xs text-slate-400">
      Carregando gráfico…
    </div>
  ),
});
import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";
import { KpiCard } from "@/components/admin/KpiCard";
import {
  formatCurrency,
  formatShortDate,
  formatFullDate,
  formatFullDateShortYear,
} from "@/utils/formatters";

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
    const fetchSales = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get<VendasAPIResponse>(
          "/api/admin/relatorios/vendas",
        );

        const mapped: DailySale[] =
          response.rows?.map((row) => ({
            date: row.dia,
            total: Number(row.total || 0),
          })) ?? [];

        setSales(mapped);
      } catch (err: any) {
        console.error(err);

        let msg = "Não foi possível carregar o relatório de vendas.";

        if (err?.status === 401 || err?.status === 403) {
          msg =
            "Sessão expirada ou sem permissão. Faça login novamente no admin.";
        }

        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const totalFaturado = useMemo(
    () => sales.reduce((sum, sale) => sum + (sale.total || 0), 0),
    [sales],
  );

  const chartData = useMemo(
    () =>
      sales.map((sale) => ({
        label: formatShortDate(sale.date),
        total: sale.total,
      })),
    [sales],
  );

  return (
    <main className="w-full px-3 pb-6 pt-4 sm:px-6 lg:px-8">
      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Cabeçalho */}
        <header className="relative space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-teal-light sm:text-3xl">
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
            <span className="text-teal-light">
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
                    <VendasBarChart data={chartData} />
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
                      value={formatCurrency(
                        totalFaturado / (sales.length || 1),
                      )}
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
                          <td className="px-4 py-3 text-right font-semibold text-teal-light">
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
    curr.total > prev.total ? curr : prev,
  );
  return `${formatShortDate(best.date)} · ${formatCurrency(best.total)}`;
}
