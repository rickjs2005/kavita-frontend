"use client";

// src/components/painel-corretora/LeadsTable.tsx
//
// Lista de leads do painel. Cada row é denso mas respirado, com
// hierarquia clara: nome + badge em primeiro, meta (telefone/cidade/
// data) em segundo, mensagem destacada num bloco stone-50, ações
// agrupadas à direita.
//
// O editor de nota é inline e expande suavemente, com um divisor
// hairline acima para separar visualmente da linha principal.

import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { PanelCard } from "./PanelCard";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { PanelBrandMark } from "./PanelBrand";
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
      month: "short",
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
      <PanelCard density="spacious" className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-200/60">
          <PanelBrandMark className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-base font-semibold text-stone-900">
          Sua sala está pronta
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-500">
          {emptyMessage ??
            "Leads aparecerão aqui em tempo real assim que visitantes entrarem em contato pela sua página no Mercado do Café."}
        </p>
        <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <a
            href="/mercado-do-cafe/corretoras"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition-colors hover:from-amber-400 hover:to-amber-500"
          >
            Ver minha página pública
            <span aria-hidden>↗</span>
          </a>
        </div>
      </PanelCard>
    );
  }

  return (
    <PanelCard flush>
      <ul role="list" className="divide-y divide-stone-900/[0.06]">
        {leads.map((lead) => {
          const isExpanded = expandedId === lead.id;
          const saving = savingId === lead.id;

          return (
            <li key={lead.id} className="px-5 py-4 md:px-6 md:py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
                {/* LEFT — info principal */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-stone-900">
                      {lead.nome}
                    </h3>
                    <LeadStatusBadge status={lead.status} />
                  </div>

                  {/* Meta — telefone / cidade / data numa linha única */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-stone-500">
                    <span className="inline-flex items-center gap-1 text-stone-700">
                      <span aria-hidden>☏</span>
                      <span className="tabular-nums">{lead.telefone}</span>
                    </span>
                    {lead.cidade && (
                      <>
                        <span aria-hidden className="text-stone-300">·</span>
                        <span>{lead.cidade}</span>
                      </>
                    )}
                    <span aria-hidden className="text-stone-300">·</span>
                    <span className="tabular-nums">
                      {formatDate(lead.created_at)}
                    </span>
                  </div>

                  {lead.mensagem && (
                    <p className="mt-3 whitespace-pre-line rounded-lg bg-stone-50 p-3 text-sm text-stone-700 ring-1 ring-stone-900/[0.04]">
                      {lead.mensagem}
                    </p>
                  )}
                </div>

                {/* RIGHT — ações */}
                <div className="flex shrink-0 flex-col gap-2 md:items-end">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
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
                    className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-700 shadow-sm shadow-stone-900/[0.02] transition-colors focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40 disabled:opacity-60"
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
                    className="text-[11px] font-semibold text-amber-700 underline-offset-2 hover:underline"
                  >
                    {isExpanded ? "Fechar nota" : "Nota interna"}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 border-t border-stone-900/[0.06] pt-4">
                  <NoteEditor
                    initial={lead.nota_interna ?? ""}
                    saving={saving}
                    onSave={(nota) =>
                      updateLead(lead.id, { nota_interna: nota })
                    }
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </PanelCard>
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
    <div className="space-y-2">
      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        Nota interna
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Ex: Ligou em 10/04, vai mandar amostra na próxima semana..."
        className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 shadow-sm shadow-stone-900/[0.02] focus:border-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
      />
      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving || value === initial}
          onClick={() => onSave(value)}
          className="rounded-lg bg-stone-900 px-3 py-1.5 text-[11px] font-semibold text-stone-50 shadow-sm shadow-stone-900/20 transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar nota"}
        </button>
      </div>
    </div>
  );
}
