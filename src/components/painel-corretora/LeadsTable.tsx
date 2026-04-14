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
import {
  OBJETIVOS_CONTATO,
  TIPOS_CAFE,
  VOLUMES_LEAD,
  CANAIS_CONTATO,
} from "@/lib/regioes";

// Lookup maps — evitam recomputar .find() em cada render do lead.
const LABEL_OBJETIVO = Object.fromEntries(
  OBJETIVOS_CONTATO.map((o) => [o.value, o.label]),
) as Record<string, string>;
const LABEL_TIPO_CAFE = Object.fromEntries(
  TIPOS_CAFE.map((t) => [t.value, t.label]),
) as Record<string, string>;
const LABEL_VOLUME = Object.fromEntries(
  VOLUMES_LEAD.map((v) => [v.value, v.label]),
) as Record<string, string>;
const LABEL_CANAL = Object.fromEntries(
  CANAIS_CONTATO.map((c) => [c.value, c.label]),
) as Record<string, string>;

// Leads com volume >= 200 sacas são destacados visualmente no painel.
const HIGH_PRIORITY_VOLUMES = new Set(["200_500", "500_mais"]);

/** wa.me link com mensagem pré-formatada citando o contexto do lead. */
function buildWhatsAppUrl(lead: CorretoraLead): string {
  const digits = lead.telefone.replace(/\D/g, "").replace(/^0+/, "");
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  const cidadeStr = lead.cidade ? `de ${lead.cidade} ` : "";
  const objetivoStr = lead.objetivo
    ? ` sobre ${LABEL_OBJETIVO[lead.objetivo].toLowerCase()}`
    : "";
  const msg = `Olá ${lead.nome}, recebi seu contato ${cidadeStr}pelo Kavita · Mercado do Café${objetivoStr}. Como posso te ajudar?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

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

          const isHighPriority =
            lead.volume_range && HIGH_PRIORITY_VOLUMES.has(lead.volume_range);
          const waUrl = buildWhatsAppUrl(lead);

          return (
            <li
              key={lead.id}
              className={`px-5 py-4 md:px-6 md:py-5 ${isHighPriority ? "bg-amber-50/40" : ""}`}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
                {/* LEFT — info principal */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-stone-900">
                      {lead.nome}
                    </h3>
                    <LeadStatusBadge status={lead.status} />
                    {isHighPriority && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-800 ring-1 ring-amber-500/40">
                        <span aria-hidden className="h-1 w-1 rounded-full bg-amber-500" />
                        Alta prioridade
                      </span>
                    )}
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
                        <span className="font-semibold text-stone-700">{lead.cidade}</span>
                      </>
                    )}
                    <span aria-hidden className="text-stone-300">·</span>
                    <span className="tabular-nums">
                      {formatDate(lead.created_at)}
                    </span>
                  </div>

                  {/* Qualificação — chips com objetivo, tipo, volume, canal */}
                  {(lead.objetivo || lead.tipo_cafe || lead.volume_range || lead.canal_preferido) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {lead.objetivo && (
                        <QualChip
                          kicker="Objetivo"
                          label={LABEL_OBJETIVO[lead.objetivo]}
                          tone="amber"
                        />
                      )}
                      {lead.volume_range && (
                        <QualChip
                          kicker="Volume"
                          label={LABEL_VOLUME[lead.volume_range]}
                          tone={isHighPriority ? "amber-strong" : "neutral"}
                        />
                      )}
                      {lead.tipo_cafe && (
                        <QualChip
                          kicker="Café"
                          label={LABEL_TIPO_CAFE[lead.tipo_cafe]}
                          tone="neutral"
                        />
                      )}
                      {lead.canal_preferido && (
                        <QualChip
                          kicker="Prefere"
                          label={LABEL_CANAL[lead.canal_preferido]}
                          tone="neutral"
                        />
                      )}
                    </div>
                  )}

                  {lead.mensagem && (
                    <p className="mt-3 whitespace-pre-line rounded-lg bg-stone-50 p-3 text-sm text-stone-700 ring-1 ring-stone-900/[0.04]">
                      {lead.mensagem}
                    </p>
                  )}
                </div>

                {/* RIGHT — ações */}
                <div className="flex shrink-0 flex-col gap-2 md:items-end">
                  {/* WhatsApp direto com mensagem contextualizada */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-emerald-600/30 transition-colors hover:from-emerald-400 hover:to-emerald-500"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.84 12.84 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                    </svg>
                    WhatsApp
                  </a>

                  <label className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
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

/**
 * QualChip — chip inline mostrando um dos atributos qualificados do
 * lead (objetivo, volume, tipo de café, canal preferido). Kicker mono
 * em amber, valor em stone. Variante "amber-strong" destaca o volume
 * em leads de alta prioridade.
 */
function QualChip({
  kicker,
  label,
  tone = "neutral",
}: {
  kicker: string;
  label: string;
  tone?: "neutral" | "amber" | "amber-strong";
}) {
  const toneClass: Record<typeof tone, string> = {
    neutral:
      "bg-white ring-stone-900/[0.06] text-stone-700",
    amber:
      "bg-amber-50 ring-amber-400/30 text-amber-900",
    "amber-strong":
      "bg-amber-100 ring-amber-500/50 text-amber-900 font-semibold",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] ring-1 ${toneClass[tone]}`}
    >
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber-700/80">
        {kicker}
      </span>
      <span className="h-2 w-px bg-stone-300" aria-hidden />
      <span>{label}</span>
    </span>
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
