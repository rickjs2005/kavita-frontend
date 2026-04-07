// src/components/admin/mercado-do-cafe/solicitacoes/SubmissionsTable.tsx
"use client";

import Link from "next/link";
import type { CorretoraSubmission } from "@/types/corretora";

type Props = {
  rows: CorretoraSubmission[];
  loading: boolean;
  statusFilter: "pending" | "approved" | "rejected";
  onStatusFilterChange: (s: "pending" | "approved" | "rejected") => void;
};

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  } catch {
    return "—";
  }
}

export default function SubmissionsTable({
  rows,
  loading,
  statusFilter,
  onStatusFilterChange,
}: Props) {
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
            onClick={() => onStatusFilterChange(s)}
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
                  className="transition-colors hover:bg-slate-900/40"
                >
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
