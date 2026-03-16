"use client";

import Link from "next/link";
import type { AlertItem, TopCliente, TopProduto, TopServico } from "../dashboardTypes";
import { formatMoney, getAlertColors, LoadingSpinner } from "../dashboardUtils";

type Props = {
  alertas: AlertItem[];
  alertasLoading: boolean;
  alertasError: string | null;
  topClientes: TopCliente[];
  topProdutos: TopProduto[];
  topServicos: TopServico[];
  topsLoading: boolean;
  topsError: string | null;
};

export function AlertsAndMetricsSection({
  alertas,
  alertasLoading,
  alertasError,
  topClientes,
  topProdutos,
  topServicos,
  topsLoading,
  topsError,
}: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Store alerts */}
      <div className="col-span-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300">
              Alertas da loja
            </p>
            <h2 className="text-sm font-semibold text-slate-50">
              O que precisa de atenção
            </h2>
          </div>
          {alertas.length > 0 && (
            <span className="rounded-full bg-amber-500/10 px-2 py-[2px] text-[10px] font-medium text-amber-200">
              {alertas.length} alerta(s)
            </span>
          )}
        </div>

        <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
          {alertasLoading && (
            <div className="flex items-center justify-center py-5 text-xs text-slate-400">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Verificando status da loja...</span>
            </div>
          )}

          {alertasError && !alertasLoading && (
            <p className="text-xs text-rose-300">{alertasError}</p>
          )}

          {!alertasLoading && !alertasError && alertas.length === 0 && (
            <p className="text-xs text-slate-400">
              Nenhum alerta crítico no momento. Sua loja está saudável. 🎉
            </p>
          )}

          {alertas.map((alerta) => {
            const colors = getAlertColors(alerta.nivel);
            return (
              <div
                key={alerta.id}
                className="rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2.5"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                  <span
                    className={`rounded-full px-2 py-[1px] text-[10px] font-medium uppercase tracking-[0.14em] ${colors.badge}`}
                  >
                    {alerta.tipo.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-100">
                  {alerta.titulo}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-300">
                  {alerta.mensagem}
                </p>
                {alerta.link && alerta.link_label && (
                  <Link
                    href={alerta.link}
                    className="mt-1 inline-flex text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
                  >
                    {alerta.link_label} →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
            Ver todos →
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
            <div
              key={cli.id}
              className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100">
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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top products + services */}
      <div className="col-span-1 flex flex-col gap-3">
        {/* Top products */}
        <div className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
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
              Ver todos →
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
                className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-100">
                    {index + 1}. {prod.nome}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {prod.total_vendido} un. · {formatMoney(prod.receita_total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top services */}
        <div className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
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
              Ver todos →
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
                className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-100">
                    {index + 1}. {serv.titulo}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {serv.total_contratos} contrato(s) ·{" "}
                    {formatMoney(serv.receita_total)}
                  </p>
                  {typeof serv.nota_media === "number" && (
                    <p className="text-[11px] text-amber-300">
                      ⭐ {serv.nota_media.toFixed(1)} média
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
