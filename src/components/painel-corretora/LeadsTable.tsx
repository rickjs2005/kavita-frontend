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
import { formatDateTime } from "@/utils/formatters";
import { PanelCard } from "./PanelCard";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { NextActionChip } from "./NextActionChip";
import { PanelBrandMark } from "./PanelBrand";
import type {
  CorretoraLead,
  LeadStatus,
  AmostraStatus,
  BebidaClassificacao,
} from "@/types/lead";
import {
  OBJETIVOS_CONTATO,
  TIPOS_CAFE,
  VOLUMES_LEAD,
  CANAIS_CONTATO,
} from "@/lib/regioes";
import { BebidaBadge, PotencialBadge, LaudoPanel } from "./LaudoPanel";
import { QuickRepliesDropdown } from "./QuickRepliesDropdown";

// Sprint 7 — fluxo de amostra física (kanban simplificado)
const AMOSTRA_LABELS: Record<AmostraStatus, string> = {
  nao_entregue: "Não entregue",
  prometida: "Prometida",
  recebida: "Recebida",
  laudada: "Laudada",
};
const AMOSTRA_FLOW: { value: AmostraStatus; label: string; icon: string }[] = [
  { value: "prometida", label: "Prometida", icon: "·" },
  { value: "recebida", label: "Recebida", icon: "✓" },
  { value: "laudada", label: "Laudada", icon: "★" },
];

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
  corretoraNome?: string;
  corretoraNomeEmpresa?: string;
};

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Em contato" },
  { value: "closed", label: "Fechado" },
  { value: "lost", label: "Perdido" },
];

function formatDate(iso: string) {
  try {
    return formatDateTime(iso) || iso;
  } catch {
    return iso;
  }
}

export function LeadsTable({
  leads,
  onChanged,
  emptyMessage,
  corretoraNome = "",
  corretoraNomeEmpresa = "",
}: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function updateLead(
    id: number,
    patch: {
      status?: LeadStatus;
      nota_interna?: string;
      amostra_status?: AmostraStatus;
      bebida_classificacao?: BebidaClassificacao | null;
      pontuacao_sca?: number | null;
      preco_referencia_saca?: number | null;
    },
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
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/10 ring-1 ring-amber-400/30">
          <PanelBrandMark className="h-8 w-8 text-amber-300" />
        </div>
        <h3 className="text-base font-semibold text-stone-100">
          Sua sala está pronta
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-400">
          {emptyMessage ??
            "Leads aparecerão aqui em tempo real assim que visitantes entrarem em contato pela sua página no Mercado do Café."}
        </p>
        <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <a
            href="/mercado-do-cafe/corretoras"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 shadow-lg shadow-amber-500/20 transition-colors hover:from-amber-300 hover:to-amber-400"
          >
            Ver minha página pública
            <span aria-hidden>↗</span>
          </a>
        </div>
      </PanelCard>
    );
  }

  return (
    <ul role="list" className="space-y-2">
      {leads.map((lead) => {
          const isExpanded = expandedId === lead.id;
          const saving = savingId === lead.id;

          const isHighPriority =
            lead.volume_range && HIGH_PRIORITY_VOLUMES.has(lead.volume_range);
          const waUrl = buildWhatsAppUrl(lead);
          const isLoteIndisponivel = lead.lote_disponivel === false;

          // Lead precisa de ação urgente? Se sim, a row ganha borda
          // animada (border-beam) para chamar atenção do corretor.
          const ageH = (() => {
            const t = new Date(lead.created_at).getTime();
            return Number.isNaN(t) ? 0 : (Date.now() - t) / 3600000;
          })();
          const needsUrgentAction =
            !isLoteIndisponivel &&
            ((lead.status === "new" && ageH >= 2) ||
              lead.amostra_status === "prometida" ||
              lead.amostra_status === "recebida");

          return (
            <li
              key={lead.id}
              className={`group relative overflow-hidden rounded-2xl border transition-all ${
                isLoteIndisponivel
                  ? "border-white/[0.04] bg-stone-950/60 opacity-60"
                  : needsUrgentAction
                    ? "border-amber-400/25 bg-stone-900"
                    : lead.bebida_classificacao === "especial"
                      ? "border-emerald-500/20 bg-stone-900"
                      : lead.bebida_classificacao === "dura"
                        ? "border-amber-400/15 bg-stone-900"
                        : lead.bebida_classificacao === "rio" || lead.bebida_classificacao === "riado"
                          ? "border-orange-600/15 bg-stone-900"
                          : "border-white/[0.06] bg-stone-900 hover:border-white/[0.1]"
              }`}
            >
              {/* Hairline amber sutil no topo para cards laudados */}
              {lead.bebida_classificacao && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent"
                />
              )}

              {/* Border-beam animado — leads urgentes */}
              {needsUrgentAction && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-0 top-0 h-full w-[2px] overflow-hidden"
                >
                  <span className="absolute inset-x-0 h-8 animate-[borderBeam_2.5s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-amber-400 to-transparent" />
                </span>
              )}

              {/* ═══ SEÇÃO PRINCIPAL ═══ */}
              <div className="px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
                <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:gap-5">

                  {/* ── Identidade + origem + contato + tags ── */}
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* L1: nome + badges (max 3) */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3
                        className={`text-[15px] font-bold tracking-tight ${isLoteIndisponivel ? "text-stone-500 line-through" : "text-stone-50"}`}
                      >
                        {lead.nome}
                      </h3>
                      <LeadStatusBadge status={lead.status} />
                      {!isLoteIndisponivel && (
                        <NextActionChip
                          status={lead.status}
                          createdAt={lead.created_at}
                          updatedAt={lead.updated_at}
                          amostraStatus={lead.amostra_status}
                        />
                      )}
                      {/* Sprint 5 — dedupe: sinaliza que este produtor
                          já entrou em contato antes com esta corretora.
                          Escopo restrito ao tenant atual (sem leak entre
                          corretoras). Só aparece quando count > 0. */}
                      {lead.previous_contacts_count != null &&
                        lead.previous_contacts_count > 0 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200 ring-1 ring-amber-400/30"
                            title={`Este produtor já enviou ${lead.previous_contacts_count} contato(s) anteriores com a corretora.`}
                          >
                            ↺ Já te procurou {lead.previous_contacts_count}×
                          </span>
                        )}
                      {/* Sprint 6 — score de prioridade. Só mostra a
                          tag quando o lead bate alta/urgente (>=40);
                          abaixo disso não agrega informação útil. */}
                      {lead.priority_score != null &&
                        lead.priority_score >= 60 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-rose-200 ring-1 ring-rose-400/30"
                            title={`Urgente (score ${lead.priority_score}). Combina volume alto, córrego especial e tempo de espera.`}
                          >
                            🔥 Urgente
                          </span>
                        )}
                      {lead.priority_score != null &&
                        lead.priority_score >= 40 &&
                        lead.priority_score < 60 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200 ring-1 ring-amber-400/30"
                            title={`Alta prioridade (score ${lead.priority_score}).`}
                          >
                            ★ Alta prioridade
                          </span>
                        )}
                      {isLoteIndisponivel && (
                        <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-stone-400 ring-1 ring-white/[0.06]">
                          Lote vendido
                        </span>
                      )}
                    </div>

                    {/* L2: origem + data */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-400">
                      {lead.corrego_localidade && (
                        <span className="font-semibold text-amber-200">⛰ {lead.corrego_localidade}</span>
                      )}
                      {lead.cidade && <span className="text-stone-300">{lead.cidade}</span>}
                      <span className="font-mono tabular-nums text-stone-500">{formatDate(lead.created_at)}</span>
                    </div>

                    {/* L3: contato pill + tags em uma mesma faixa */}
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:+55${lead.telefone.replace(/\D/g, "")}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800/60 px-2.5 py-1 text-[11px] font-medium text-stone-300 ring-1 ring-white/[0.06] transition-colors hover:text-amber-200 hover:ring-amber-400/30"
                        title="Ligar"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 shrink-0" aria-hidden>
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span className="font-mono tabular-nums">{lead.telefone}</span>
                      </a>
                      {lead.objetivo && (
                        <span className="rounded-lg bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200 ring-1 ring-amber-400/20">
                          {LABEL_OBJETIVO[lead.objetivo]}
                        </span>
                      )}
                      {lead.volume_range && (
                        <span className={`rounded-lg px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums ring-1 ${
                          isHighPriority
                            ? "bg-amber-400/10 text-amber-200 ring-amber-400/30"
                            : "bg-stone-800/60 text-stone-200 ring-white/[0.06]"
                        }`}>
                          {LABEL_VOLUME[lead.volume_range]}
                        </span>
                      )}
                      {lead.tipo_cafe && (
                        <span className="rounded-lg bg-stone-800/60 px-2 py-0.5 text-[10px] font-medium text-stone-300 ring-1 ring-white/[0.06]">
                          {LABEL_TIPO_CAFE[lead.tipo_cafe]}
                        </span>
                      )}
                      {lead.safra_tipo && (
                        <span className="hidden rounded-lg bg-stone-800/60 px-2 py-0.5 text-[10px] font-medium text-stone-400 ring-1 ring-white/[0.06] sm:inline-flex">
                          {lead.safra_tipo === "atual" ? "Safra atual" : "Estoque"}
                        </span>
                      )}
                      {lead.canal_preferido && (
                        <span className="hidden text-[10px] text-stone-500 sm:inline">
                          · {LABEL_CANAL[lead.canal_preferido]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ── Ações (canto direito no desktop, inline no mobile) ── */}
                  <div className="flex shrink-0 items-center gap-2 md:flex-col md:items-stretch md:gap-1.5">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 min-w-[100px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-[12px] font-semibold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-500"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.84 12.84 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                      </svg>
                      WhatsApp
                    </a>
                    <QuickRepliesDropdown
                      lead={lead}
                      corretoraNome={corretoraNomeEmpresa || corretoraNome}
                    />
                    <a
                      href={`tel:+55${lead.telefone.replace(/\D/g, "")}`}
                      className="inline-flex h-9 min-w-[100px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[12px] font-semibold text-stone-200 transition-colors hover:border-amber-400/30 hover:text-amber-200"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden>
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      Ligar
                    </a>
                    <select
                      value={lead.status}
                      disabled={saving}
                      onChange={(e) => updateLead(lead.id, { status: e.target.value as LeadStatus })}
                      className="h-9 min-w-[100px] rounded-xl border border-white/10 bg-stone-800 px-3 text-center text-[12px] font-medium text-stone-100 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/25 disabled:opacity-60 [color-scheme:dark]"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} style={{ backgroundColor: "#1c1917", color: "#f5f5f4" }}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ═══ SEÇÃO AMOSTRA + LAUDO ═══ */}
              {(lead.bebida_classificacao || !isLoteIndisponivel) && (
                <div className="border-t border-white/[0.05] bg-stone-950/30 px-4 py-3 sm:px-5 sm:py-4">
                  {/* Barra de progresso da amostra */}
                  {!isLoteIndisponivel && (
                    <AmostraFlow
                      lead={lead}
                      saving={saving}
                      onUpdate={(next) => updateLead(lead.id, { amostra_status: next })}
                    />
                  )}

                  {/* Resultado do laudo — bloco premium */}
                  {lead.bebida_classificacao && (
                    <div className="mt-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 sm:p-4">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <BebidaBadge classificacao={lead.bebida_classificacao} />
                        <PotencialBadge lead={lead} />
                        {lead.aptidao_oferta === "sim" && (
                          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-300 ring-1 ring-emerald-500/30">
                            ✓ Apto
                          </span>
                        )}
                      </div>
                      {/* Dados numéricos em grid responsivo */}
                      <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                        {lead.pontuacao_sca != null && <ResultDatum label="SCA" value={`${lead.pontuacao_sca}`} mono />}
                        {lead.umidade_pct != null && <ResultDatum label="Umidade" value={`${lead.umidade_pct}%`} mono />}
                        {lead.peneira && <ResultDatum label="Peneira" value={lead.peneira} mono />}
                        {lead.altitude_origem != null && <ResultDatum label="Altitude" value={`${lead.altitude_origem}m`} mono />}
                        {lead.preco_referencia_saca != null && <ResultDatum label="R$/saca" value={`${lead.preco_referencia_saca}`} mono highlight />}
                        {lead.mercado_indicado && (
                          <ResultDatum
                            label="Mercado"
                            value={{ exportacao: "Exportação", mercado_interno: "Interno", cafeteria: "Cafeteria", commodity: "Commodity", indefinido: "—" }[lead.mercado_indicado] ?? "—"}
                          />
                        )}
                      </div>
                      {lead.obs_sensoriais && (
                        <p className="mt-2 border-t border-white/[0.04] pt-2 text-[11px] italic leading-relaxed text-stone-400">
                          {lead.obs_sensoriais}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Mensagem do produtor */}
                  {lead.mensagem && (
                    <p className="mt-2.5 whitespace-pre-line rounded-lg bg-white/[0.02] px-3 py-2 text-[12px] leading-relaxed text-stone-400 ring-1 ring-white/[0.04]">
                      {lead.mensagem}
                    </p>
                  )}

                  {/* CTA editar laudo / nota + abrir detalhe */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-4 text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-400/10 hover:border-amber-400/30"
                    >
                      {isExpanded
                        ? "✕ Fechar"
                        : lead.amostra_status === "recebida" ||
                            lead.amostra_status === "laudada" ||
                            lead.bebida_classificacao
                          ? "☕ Editar laudo"
                          : "📝 Nota interna"}
                    </button>
                    <a
                      href={`/painel/corretora/leads/${lead.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-[11px] font-semibold text-stone-200 transition-colors hover:bg-white/[0.06]"
                    >
                      Abrir detalhe →
                    </a>
                  </div>
                </div>
              )}

              {/* ═══ EXPANDIDO ═══ */}
              {isExpanded && (
                <div className="space-y-4 border-t border-white/[0.06] bg-stone-950/20 px-4 py-4 sm:px-5 sm:py-5">
                  {(lead.amostra_status === "recebida" ||
                    lead.amostra_status === "laudada" ||
                    lead.bebida_classificacao) && (
                    <LaudoPanel
                      lead={lead}
                      saving={saving}
                      corretoraNome={corretoraNome}
                      corretoraNomeEmpresa={corretoraNomeEmpresa}
                      onUpdate={(patch) => updateLead(lead.id, patch)}
                    />
                  )}
                  <NoteEditor
                    initial={lead.nota_interna ?? ""}
                    saving={saving}
                    onSave={(nota) => updateLead(lead.id, { nota_interna: nota })}
                  />
                </div>
              )}
            </li>
          );
        })}
    </ul>
  );
}

/**
 * AmostraFlow — kanban inline da amostra física (Sprint 7).
 * 4 estados: nao_entregue (default), prometida, recebida, laudada.
 *
 * UX: barra de 3 botões avançando o fluxo + dropdown discreto para
 * voltar ao estado anterior se a corretora errar o clique.
 */
function AmostraFlow({
  lead,
  saving,
  onUpdate,
}: {
  lead: CorretoraLead;
  saving: boolean;
  onUpdate: (next: AmostraStatus) => void;
}) {
  const current: AmostraStatus = lead.amostra_status ?? "nao_entregue";
  const currentIndex = AMOSTRA_FLOW.findIndex((s) => s.value === current);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-2">
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-amber-300">
        Amostra
      </span>
      <div className="flex items-center gap-0.5">
        {AMOSTRA_FLOW.map((step, i) => {
          const reached = currentIndex >= i;
          const isCurrent = current === step.value;
          return (
            <button
              key={step.value}
              type="button"
              disabled={saving || isCurrent}
              onClick={() => onUpdate(step.value)}
              className={[
                "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                isCurrent
                  ? "bg-amber-400 text-stone-950 shadow-sm shadow-amber-400/30"
                  : reached
                    ? "bg-amber-400/15 text-amber-200 hover:bg-amber-400/25"
                    : "bg-stone-800 text-stone-400 ring-1 ring-white/[0.06] hover:bg-stone-700 hover:text-stone-200",
                saving || isCurrent ? "cursor-default" : "",
              ].join(" ")}
              title={
                isCurrent
                  ? `Atual: ${step.label}`
                  : `Marcar como ${step.label}`
              }
            >
              <span aria-hidden>{step.icon}</span>
              {step.label}
            </button>
          );
        })}
      </div>
      {current !== "nao_entregue" && (
        <button
          type="button"
          disabled={saving}
          onClick={() => onUpdate("nao_entregue")}
          className="ml-auto text-[10px] font-semibold text-stone-400 underline-offset-2 hover:text-stone-200 hover:underline"
        >
          Resetar
        </button>
      )}
    </div>
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
      "bg-stone-800 ring-white/[0.06] text-stone-200",
    amber:
      "bg-amber-400/10 ring-amber-400/30 text-amber-200",
    "amber-strong":
      "bg-amber-400/15 ring-amber-400/40 text-amber-100 font-semibold",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] ring-1 ${toneClass[tone]}`}
    >
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber-300/80">
        {kicker}
      </span>
      <span className="h-2 w-px bg-stone-600" aria-hidden />
      <span>{label}</span>
    </span>
  );
}

/**
 * ResultDatum — dado-chave do resultado da amostra mostrado inline
 * no bloco de resultado. Label em stone-500 + valor em stone-100.
 * `highlight` opcional para destaque amber (ex: "Apto para oferta").
 */
function ResultDatum({
  label,
  value,
  highlight = false,
  mono = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-1 text-[11px]">
      <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-stone-500">
        {label}
      </span>
      <span
        className={`font-semibold tabular-nums ${mono ? "font-mono" : ""} ${
          highlight ? "text-amber-200" : "text-stone-100"
        }`}
      >
        {value}
      </span>
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
      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        Nota interna
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Ex: Ligou em 10/04, vai mandar amostra na próxima semana..."
        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 shadow-sm focus:border-amber-400/60 focus:outline-none focus:ring-2 focus:ring-amber-400/25"
      />
      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving || value === initial}
          onClick={() => onSave(value)}
          className="rounded-lg bg-amber-400 px-3 py-1.5 text-[11px] font-semibold text-stone-950 shadow-sm shadow-amber-400/20 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar nota"}
        </button>
      </div>
    </div>
  );
}
