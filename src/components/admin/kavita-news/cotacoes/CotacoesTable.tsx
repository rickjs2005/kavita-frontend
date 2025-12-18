"use client";

import type { CotacaoItem } from "@/types/kavita-news";
import { formatDateTimeBR, fmtNum } from "@/utils/kavita-news/cotacoes";

type Props = {
  rows: CotacaoItem[];
  loading: boolean;
  errorMsg: string | null;

  onReload: () => void | Promise<void>;
  onSyncAll?: () => void | Promise<void>;
  syncingAll?: boolean;

  onEdit: (item: CotacaoItem) => void;
  onDelete: (id: number) => void;

  onSync?: (id: number) => void;

  deletingId: number | null;
  syncingId?: number | null;
};

export default function CotacoesTable({
  rows,
  loading,
  errorMsg,
  onReload,
  onSyncAll,
  syncingAll = false,
  onEdit,
  onDelete,
  onSync,
  deletingId,
  syncingId,
}: Props) {
  const handleSyncAll = async () => {
    if (onSyncAll) return Promise.resolve(onSyncAll());
    return Promise.resolve(onReload());
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] overflow-hidden">
      <header className="px-5 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-base font-semibold text-slate-900">Cotações cadastradas</h4>
            <p className="text-sm text-slate-500">
              Total: <span className="font-semibold text-slate-800">{rows.length}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncingAll || rows.length === 0}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
            title="Sincroniza todas as cotações ativas de uma vez"
          >
            {syncingAll ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {errorMsg ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMsg}
          </div>
        ) : null}
      </header>

      {/* MOBILE: cards */}
      <div className="md:hidden p-4 space-y-3">
        {loading && rows.length === 0 ? (
          <div className="text-sm text-slate-500">Carregando...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhuma cotação cadastrada.</div>
        ) : (
          rows.map((r: any) => {
            const ativo = Number(r.ativo ?? 1) === 1;
            const isSyncing = syncingId === r.id;
            const disabledRowActions = syncingAll;

            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{r.name}</p>
                    <p className="text-xs text-slate-500">
                      {r.type} • {r.slug}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${
                      ativo
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${ativo ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2">
                    <p className="text-slate-500">Preço</p>
                    <p className="font-medium text-slate-900">
                      {fmtNum(r.price, 4)} {r.unit ? `(${r.unit})` : ""}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    <p className="text-slate-500">Variação</p>
                    <p className="font-medium text-slate-900">{fmtNum(r.variation_day, 4)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2 col-span-2">
                    <p className="text-slate-500">Atualizado</p>
                    <p className="font-medium text-slate-900">{formatDateTimeBR(r.last_update_at ?? null)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  {onSync ? (
                    <button
                      type="button"
                      onClick={() => onSync(r.id)}
                      disabled={disabledRowActions || isSyncing}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                    >
                      {isSyncing ? "Sincronizando..." : "Sync"}
                    </button>
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(r)}
                      disabled={disabledRowActions}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(r.id)}
                      disabled={disabledRowActions || deletingId === r.id}
                      className="px-3 py-2 rounded-xl border border-rose-200 bg-white text-sm font-medium text-rose-700 hover:bg-rose-50 transition disabled:opacity-60"
                    >
                      {deletingId === r.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP: tabela */}
      <div className="hidden md:block overflow-auto">
        <table className="min-w-[1120px] w-full text-sm">
          <thead className="bg-white sticky top-0 z-10">
            <tr className="text-left border-b">
              <th className="px-5 py-3 font-semibold text-slate-700">Nome</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Tipo</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Slug</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Preço</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Unidade</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Variação</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Atualizado</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Status</th>
              <th className="px-5 py-3 font-semibold text-slate-700 text-right">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && rows.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-slate-500" colSpan={9}>
                  Carregando...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-slate-500" colSpan={9}>
                  Nenhuma cotação cadastrada.
                </td>
              </tr>
            ) : (
              rows.map((r: any) => {
                const ativo = Number(r.ativo ?? 1) === 1;
                const isSyncing = syncingId === r.id;
                const disabledRowActions = syncingAll;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3 font-semibold text-slate-900">{r.name}</td>
                    <td className="px-5 py-3 text-slate-700">{r.type}</td>
                    <td className="px-5 py-3 text-slate-700">{r.slug}</td>
                    <td className="px-5 py-3 text-slate-700">{fmtNum(r.price, 4)}</td>
                    <td className="px-5 py-3 text-slate-700">{r.unit ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-700">{fmtNum(r.variation_day, 4)}</td>
                    <td className="px-5 py-3 text-slate-700">{formatDateTimeBR(r.last_update_at ?? null)}</td>

                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${
                          ativo
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${ativo ? "bg-emerald-500" : "bg-slate-400"}`} />
                        {ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {onSync ? (
                          <button
                            type="button"
                            onClick={() => onSync(r.id)}
                            disabled={disabledRowActions || isSyncing}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                          >
                            {isSyncing ? "Sincronizando..." : "Sync"}
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => onEdit(r)}
                          disabled={disabledRowActions}
                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => onDelete(r.id)}
                          disabled={disabledRowActions || deletingId === r.id}
                          className="px-3 py-2 rounded-xl border border-rose-200 bg-white text-sm font-medium text-rose-700 hover:bg-rose-50 transition disabled:opacity-60"
                        >
                          {deletingId === r.id ? "Excluindo..." : "Excluir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
