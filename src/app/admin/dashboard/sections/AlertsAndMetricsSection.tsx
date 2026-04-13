"use client";

import Link from "next/link";
import type { TopCliente, TopProduto, TopServico } from "../dashboardTypes";
import { formatMoney, LoadingSpinner } from "../dashboardUtils";

type Props = {
  topClientes: TopCliente[];
  topProdutos: TopProduto[];
  topServicos: TopServico[];
  topsLoading: boolean;
  topsError: string | null;
};

export function AlertsAndMetricsSection({
  topClientes,
  topProdutos,
  topServicos,
  topsLoading,
  topsError,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Top clients */}
      <div className="col-span-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Ranking
            </p>
            <h2 className="text-sm font-semibold text-slate-50">
              Top clientes
            </h2>
          </div>
          <Link
            href="/admin/relatorios/clientes"
            className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
          >
            Ver todos &rarr;
          </Link>
        </div>

        <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
          {topsLoading && (
            <div className="flex items-center justify-center py-5 text-xs text-slate-400">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Carregando ranking...</span>
            </div>
          )}

          {topsError && !topsLoading && topClientes.length === 0 && (
            <p className="text-xs text-rose-300">{topsError}</p>
          )}

          {!topsLoading && !topsError && topClientes.length === 0 && (
            <p className="text-xs text-slate-400">
              Ainda não há clientes ranqueados.
            </p>
          )}

          {topClientes.map((cli, index) => (
            <Link
              key={cli.id}
              href={`/admin/clientes/${cli.id}`}
              className="flex items-center gap-2 rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2 transition hover:border-emerald-500/40 hover:bg-slate-900"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-100">
                  {cli.nome}
                </p>
                <p className="text-[11px] text-slate-400">
                  {cli.total_pedidos} pedido(s) · {formatMoney(cli.total_gasto)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Top products */}
      <div className="col-span-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Ranking
            </p>
            <h2 className="text-sm font-semibold text-slate-50">
              Top produtos
            </h2>
          </div>
          <Link
            href="/admin/relatorios/produtos"
            className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
          >
            Ver todos &rarr;
          </Link>
        </div>

        <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
          {topsLoading && (
            <div className="flex items-center justify-center py-4 text-xs text-slate-400">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Carregando ranking...</span>
            </div>
          )}

          {!topsLoading && !topsError && topProdutos.length === 0 && (
            <p className="text-xs text-slate-400">
              Nenhum produto ranqueado ainda.
            </p>
          )}

          {topProdutos.map((prod, index) => (
            <div
              key={prod.id}
              className="rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2"
            >
              <p className="truncate text-xs font-medium text-slate-100">
                {index + 1}. {prod.nome}
              </p>
              <p className="text-[11px] text-slate-400">
                {prod.total_vendido} un. · {formatMoney(prod.receita_total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top services */}
      <div className="col-span-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Ranking
            </p>
            <h2 className="text-sm font-semibold text-slate-50">
              Top serviços
            </h2>
          </div>
          <Link
            href="/admin/relatorios/servicos"
            className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
          >
            Ver todos &rarr;
          </Link>
        </div>

        <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
          {topsLoading && (
            <div className="flex items-center justify-center py-4 text-xs text-slate-400">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Carregando ranking...</span>
            </div>
          )}

          {!topsLoading && !topsError && topServicos.length === 0 && (
            <p className="text-xs text-slate-400">
              Nenhum serviço ranqueado ainda.
            </p>
          )}

          {topServicos.map((serv, index) => (
            <div
              key={serv.id}
              className="rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2"
            >
              <p className="truncate text-xs font-medium text-slate-100">
                {index + 1}. {serv.titulo}
              </p>
              <p className="text-[11px] text-slate-400">
                {serv.total_contratos} contrato(s) ·{" "}
                {formatMoney(serv.receita_total)}
              </p>
              {typeof serv.nota_media === "number" && (
                <p className="text-[11px] text-amber-300">
                  {serv.nota_media.toFixed(1)} média
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
