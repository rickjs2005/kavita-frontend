"use client";

import { useMemo, useState } from "react";
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

function badgeClass(kind: "ok" | "error" | "neutral") {
  if (kind === "ok") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (kind === "error") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-600 border-slate-200";
}

function dotClass(kind: "ok" | "error" | "neutral") {
  if (kind === "ok") return "bg-emerald-500";
  if (kind === "error") return "bg-rose-500";
  return "bg-slate-400";
}

function syncKind(r: any): "ok" | "error" | "neutral" {
  if (r?.last_sync_status === "ok") return "ok";
  if (r?.last_sync_status === "error") return "error";
  return "neutral";
}

function syncLabel(r: any) {
  const k = syncKind(r);
  if (k === "ok") return "OK";
  if (k === "error") return "Erro";
  return "—";
}

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
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);

  const handleSyncAll = async () => {
    if (onSyncAll) return Promise.resolve(onSyncAll());
    return Promise.resolve(onReload());
  };

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return (rows || []).filter((r: any) => {
      const ativo = Number(r.ativo ?? 1) === 1;
      const isErr = r?.last_sync_status === "error";

      if (onlyActive && !ativo) return false;
      if (onlyErrors && !isErr) return false;

      if (!query) return true;

      const hay =
        `${r?.name ?? ""} ${r?.slug ?? ""} ${r?.type ?? ""} ${r?.source ?? ""}`.toLowerCase();

      return hay.includes(query);
    });
  }, [rows, q, onlyActive, onlyErrors]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] overflow-hidden">
      <header className="px-5 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h4 className="text-base font-semibold text-slate-900">Cotações cadastradas</h4>
            <p className="text-sm text-slate-500">
              Total: <span className="font-semibold text-slate-800">{filtered.length}</span>{" "}
              <span className="text-slate-400">/ {rows.length}</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nome, slug, tipo, fonte..."
                className="w-full sm:w-[340px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EC5B20] focus:border-transparent"
              />

              <button
                type="button"
                onClick={() => setQ("")}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                title="Limpar busca"
              >
                Limpar
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                  className="h-4 w-4 accent-[#EC5B20]"
                />
                Somente ativos
              </label>

              <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  checked={onlyErrors}
                  onChange={(e) => setOnlyErrors(e.target.checked)}
                  className="h-4 w-4 accent-[#EC5B20]"
                />
                Somente com erro
              </label>

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
          </div>
        </div>

        {errorMsg ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMsg}
          </div>
        ) : null}
      </header>

      {/* MOBILE: cards */}
      <div className="md:hidden p-4 space-y-3">
        {loading && filtered.length === 0 ? (
          <div className="text-sm text-slate-500">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhuma cotação encontrada.</div>
        ) : (
          filtered.map((r: any) => {
            const ativo = Number(r.ativo ?? 1) === 1;
            const isSyncing = syncingId === r.id;
            const disabledRowActions = syncingAll;
            const sk = syncKind(r);

            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{r.name}</p>
                    <p className="text-xs text-slate-500">
                      {r.type} • {r.slug}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 truncate" title={r.source || ""}>
                      Fonte: <span className="font-medium text-slate-700">{r.source ?? "—"}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
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

                    <span
                      title={r.last_sync_status === "error" ? (r.last_sync_message || "Erro ao sincronizar") : "Status do Sync"}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${badgeClass(
                        sk
                      )}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${dotClass(sk)}`} />
                      Sync: {syncLabel(r)}
                    </span>
                  </div>
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
                      disabled={disabledRowActions || isSyncing || !ativo}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                      title={!ativo ? "Cotação inativa" : "Sincronizar agora"}
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
        <table className="min-w-[1240px] w-full text-sm">
          <thead className="bg-white sticky top-0 z-10">
            <tr className="text-left border-b">
              <th className="px-5 py-3 font-semibold text-slate-700">Nome</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Tipo</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Slug</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Preço</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Unidade</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Variação</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Fonte</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Atualizado</th>
              <th className="px-5 py-3 font-semibold text-slate-700">Sync</th>
              <th className="px-5 py-3 font-semibold text-slate-700 text-right">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading && filtered.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-slate-500" colSpan={10}>
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="px-5 py-6 text-slate-500" colSpan={10}>
                  Nenhuma cotação encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((r: any) => {
                const ativo = Number(r.ativo ?? 1) === 1;
                const isSyncing = syncingId === r.id;
                const disabledRowActions = syncingAll;
                const sk = syncKind(r);

                const syncTitle =
                  r.last_sync_status === "error"
                    ? r.last_sync_message || "Erro ao sincronizar"
                    : r.last_sync_status === "ok"
                    ? "Sincronizado com sucesso"
                    : "Sem sincronização recente";

                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3 font-semibold text-slate-900">{r.name}</td>
                    <td className="px-5 py-3 text-slate-700">{r.type}</td>
                    <td className="px-5 py-3 text-slate-700">{r.slug}</td>
                    <td className="px-5 py-3 text-slate-700">{fmtNum(r.price, 4)}</td>
                    <td className="px-5 py-3 text-slate-700">{r.unit ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-700">{fmtNum(r.variation_day, 4)}</td>
                    <td className="px-5 py-3 text-slate-700" title={r.source || ""}>
                      {r.source ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-700">{formatDateTimeBR(r.last_update_at ?? null)}</td>

                    <td className="px-5 py-3">
                      <span
                        title={syncTitle}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${badgeClass(
                          sk
                        )}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${dotClass(sk)}`} />
                        {syncLabel(r)}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {onSync ? (
                          <button
                            type="button"
                            onClick={() => onSync(r.id)}
                            disabled={disabledRowActions || isSyncing || !ativo}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                            title={!ativo ? "Cotação inativa" : "Sincronizar agora"}
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
