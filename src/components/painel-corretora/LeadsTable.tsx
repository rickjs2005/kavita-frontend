"use client";

// src/components/painel-corretora/LeadsTable.tsx

import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { LeadStatusBadge } from "./LeadStatusBadge";
import type { CorretoraLead, LeadStatus } from "@/types/lead";

type Props = {
  leads: CorretoraLead[];
  onChanged?: () => void;
  emptyMessage?: string;
};

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Em contato" },
  { value: "closed", label: "Fechado" },
  { value: "lost", label: "Perdido" },
];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function LeadsTable({ leads, onChanged, emptyMessage }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function updateLead(
    id: number,
    patch: { status?: LeadStatus; nota_interna?: string },
  ) {
    setSavingId(id);
    try {
      await apiClient.patch(`/api/corretora/leads/${id}`, patch);
      toast.success("Lead atualizado.");
      onChanged?.();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao atualizar lead.").message);
    } finally {
      setSavingId(null);
    }
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
        {emptyMessage ?? "Nenhum lead encontrado."}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <ul role="list" className="divide-y divide-zinc-100">
        {leads.map((lead) => {
          const isExpanded = expandedId === lead.id;
          const saving = savingId === lead.id;

          return (
            <li key={lead.id} className="p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-zinc-900">
                      {lead.nome}
                    </h3>
                    <LeadStatusBadge status={lead.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-600">
                    📞 {lead.telefone}
                    {lead.cidade ? ` • 📍 ${lead.cidade}` : null}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-400">
                    Recebido em {formatDate(lead.created_at)}
                  </p>
                  {lead.mensagem && (
                    <p className="mt-2 whitespace-pre-line rounded-lg bg-zinc-50 p-2 text-sm text-zinc-700">
                      {lead.mensagem}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-stretch gap-2 md:items-end">
                  <label className="text-xs font-medium text-zinc-500">
                    Status
                  </label>
                  <select
                    value={lead.status}
                    disabled={saving}
                    onChange={(e) =>
                      updateLead(lead.id, {
                        status: e.target.value as LeadStatus,
                      })
                    }
                    className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : lead.id)
                    }
                    className="text-xs font-medium text-emerald-700 hover:underline"
                  >
                    {isExpanded ? "Fechar nota" : "Nota interna"}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <NoteEditor
                  initial={lead.nota_interna ?? ""}
                  saving={saving}
                  onSave={(nota) =>
                    updateLead(lead.id, { nota_interna: nota })
                  }
                />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function NoteEditor({
  initial,
  saving,
  onSave,
}: {
  initial: string;
  saving: boolean;
  onSave: (nota: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Ex: Ligou em 10/04, vai mandar amostra na próxima semana..."
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
      />
      <button
        type="button"
        disabled={saving || value === initial}
        onClick={() => onSave(value)}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Salvando..." : "Salvar nota"}
      </button>
    </div>
  );
}
