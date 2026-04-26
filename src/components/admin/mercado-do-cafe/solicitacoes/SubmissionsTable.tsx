// src/components/admin/mercado-do-cafe/solicitacoes/SubmissionsTable.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CorretoraSubmission } from "@/types/corretora";
import { formatDateWithYear } from "@/utils/formatters";

type Props = {
  rows: CorretoraSubmission[];
  loading: boolean;
  statusFilter: "pending" | "approved" | "rejected";
  onStatusFilterChange: (s: "pending" | "approved" | "rejected") => void;
  // Sprint 3 — bulk actions. Opcionais para preservar compat com
  // chamadas antigas; só aparecem na UI quando passados.
  onBulkApprove?: (ids: number[]) => Promise<void> | void;
  onBulkReject?: (ids: number[], reason: string) => Promise<void> | void;
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return formatDateWithYear(dateStr) || "—";
}

export default function SubmissionsTable({
  rows,
  loading,
  statusFilter,
  onStatusFilterChange,
  onBulkApprove,
  onBulkReject,
}: Props) {
  // Seleção só faz sentido na aba "pending" — nas outras não há ação.
  // Reset quando o filtro muda evita manter IDs que saíram da tela.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const bulkEnabled =
    statusFilter === "pending" && (onBulkApprove || onBulkReject);

  const pendingIds = useMemo(
    () => rows.filter((r) => r.status === "pending").map((r) => r.id),
    [rows],
  );

  const allSelected =
    pendingIds.length > 0 && pendingIds.every((id) => selectedIds.has(id));

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  }

  async function handleBulkApprove() {
    if (!onBulkApprove || bulkBusy) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const ok = window.confirm(
      `Aprovar ${ids.length} solicitação(ões) selecionada(s)?\n\n` +
        "Cada aprovação cria a corretora, envia e-mail de boas-vindas e atribui o plano Free com trial de 3 meses.",
    );
    if (!ok) return;
    setBulkBusy(true);
    try {
      await onBulkApprove(ids);
      setSelectedIds(new Set());
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleBulkReject() {
    if (!onBulkReject || bulkBusy) return;
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const reason = window.prompt(
      `Motivo da rejeição para ${ids.length} solicitação(ões) (mín. 10 caracteres):`,
    );
    if (!reason) return;
    if (reason.trim().length < 10) {
      window.alert("O motivo precisa ter pelo menos 10 caracteres.");
      return;
    }
    setBulkBusy(true);
    try {
      await onBulkReject(ids, reason.trim());
      setSelectedIds(new Set());
    } finally {
      setBulkBusy(false);
    }
  }
  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/15 text-amber-300";
      case "approved":
        return "bg-emerald-500/15 text-emerald-300";
      case "rejected":
        return "bg-rose-500/15 text-rose-300";
      default:
        return "bg-slate-500/15 text-slate-300";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "approved": return "Aprovada";
      case "rejected": return "Rejeitada";
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              onStatusFilterChange(s);
              setSelectedIds(new Set());
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === s
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                : "border-slate-800 text-slate-400 hover:border-slate-600"
            }`}
          >
            {statusLabel(s)}
          </button>
        ))}
      </div>

      {/* Bulk action bar — só aparece em "pending" com callbacks
          passados. Fica sticky no topo quando há seleção. */}
      {bulkEnabled && selectedIds.size > 0 && (
        <div
          className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 shadow-lg shadow-emerald-900/20 backdrop-blur"
          role="toolbar"
          aria-label="Ações em lote"
        >
          <div className="text-xs font-semibold text-emerald-100">
            {selectedIds.size} selecionada(s)
          </div>
          <div className="flex items-center gap-2">
            {onBulkApprove && (
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={bulkBusy}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-emerald-950 shadow transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {bulkBusy ? "Processando..." : "✅ Aprovar selecionadas"}
              </button>
            )}
            {onBulkReject && (
              <button
                type="button"
                onClick={handleBulkReject}
                disabled={bulkBusy}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-200 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ❌ Rejeitar selecionadas
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-100/80 hover:text-emerald-100"
            >
              Limpar
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <p className="text-sm text-slate-400">
            Nenhuma solicitação {statusLabel(statusFilter).toLowerCase()}.
          </p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-left text-xs uppercase tracking-wider text-slate-400">
                {bulkEnabled && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todas as pendentes"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 cursor-pointer accent-emerald-500"
                    />
                  </th>
                )}
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Cidade</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Enviado em</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map((s) => (
                <tr
                  key={s.id}
                  className={`transition-colors hover:bg-slate-900/40 ${
                    selectedIds.has(s.id) ? "bg-emerald-500/5" : ""
                  }`}
                >
                  {bulkEnabled && (
                    <td className="w-10 px-4 py-3">
                      {s.status === "pending" ? (
                        <input
                          type="checkbox"
                          aria-label={`Selecionar ${s.name}`}
                          checked={selectedIds.has(s.id)}
                          onChange={() => toggleOne(s.id)}
                          className="h-4 w-4 cursor-pointer accent-emerald-500"
                        />
                      ) : (
                        <span aria-hidden className="block h-4 w-4" />
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.contact_name}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {s.city}, {s.state}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(s.status)}`}
                    >
                      {statusLabel(s.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {formatDate(s.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/mercado-do-cafe/solicitacoes/${s.id}`}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-emerald-500/40 hover:text-emerald-200 transition-colors"
                    >
                      {s.status === "pending" ? "Revisar" : "Ver detalhes"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
