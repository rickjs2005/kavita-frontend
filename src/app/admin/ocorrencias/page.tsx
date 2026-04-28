"use client";

import { useEffect, useState, useMemo } from "react";
import apiClient from "@/lib/apiClient";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

// ----- Tipos -----
type StatusOcorrencia = "aberta" | "em_analise" | "aguardando_retorno" | "resolvida" | "rejeitada";

type Ocorrencia = {
  id: number;
  pedido_id: number;
  usuario_id: number;
  usuario_nome: string;
  usuario_email: string;
  usuario_telefone: string | null;
  tipo: string;
  motivo: string;
  observacao: string | null;
  resposta_cliente: string | null;
  endereco_sugerido: string | null;
  status: StatusOcorrencia;
  resposta_admin: string | null;
  endereco_corrigido: string | null;
  taxa_extra: number;
  admin_id: number | null;
  feedback_nota: number | null;
  feedback_comentario: string | null;
  created_at: string;
  updated_at: string;
  pedido_endereco: string | null;
  pedido_status_pagamento: string;
  pedido_status_entrega: string;
  pedido_forma_pagamento: string;
  pedido_total: number;
  pedido_data: string;
};

// ----- Labels & badges -----
const LABEL_STATUS: Record<StatusOcorrencia, string> = {
  aberta: "Nova",
  em_analise: "Em análise",
  aguardando_retorno: "Aguardando retorno",
  resolvida: "Resolvida",
  rejeitada: "Recusada",
};

const COR_STATUS: Record<StatusOcorrencia, string> = {
  aberta:
    "border-amber-500/40 bg-amber-500/10 text-amber-100 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200",
  em_analise:
    "border-sky-500/40 bg-sky-500/10 text-sky-100 dark:border-sky-400/30 dark:bg-sky-500/15 dark:text-sky-200",
  aguardando_retorno:
    "border-violet-500/40 bg-violet-500/10 text-violet-100 dark:border-violet-400/30 dark:bg-violet-500/15 dark:text-violet-200",
  resolvida:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200",
  rejeitada:
    "border-rose-500/40 bg-rose-500/10 text-rose-100 dark:border-rose-400/30 dark:bg-rose-500/15 dark:text-rose-200",
};

const LABEL_MOTIVO: Record<string, string> = {
  numero_errado: "Número errado",
  complemento_faltando: "Complemento faltando",
  bairro_incorreto: "Bairro incorreto",
  cep_incorreto: "CEP incorreto",
  destinatario_incorreto: "Destinatário incorreto",
  outro: "Outro problema",
};

const STATUS_OPTIONS: StatusOcorrencia[] = [
  "aberta",
  "aguardando_retorno",
  "em_analise",
  "resolvida",
  "rejeitada",
];

// ----- Helpers -----
function formatDate(iso: string) {
  return formatDateTime(iso) || iso;
}

function parseEndereco(raw: string | null): Record<string, string> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function resumoEndereco(raw: string | null): string {
  const e = parseEndereco(raw);
  if (!e) return "—";
  const parts = [
    e.rua || e.endereco || e.logradouro,
    e.numero,
    e.bairro,
    e.cidade,
    e.estado,
  ].filter(Boolean);
  return parts.join(", ") || "—";
}

function Badge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-tight ${className}`}
    >
      {label}
    </span>
  );
}

// ----- Templates de contato -----
const CONTACT_TEMPLATES = [
  { id: "ocorrencia_confirmacao", nome: "Confirmar recebimento" },
  { id: "ocorrencia_solicitar_dados", nome: "Solicitar dados corretos" },
  { id: "ocorrencia_taxa_extra", nome: "Informar possível taxa extra" },
  { id: "ocorrencia_correcao_concluida", nome: "Correção concluída" },
  { id: "ocorrencia_resolvida", nome: "Ocorrência resolvida" },
] as const;

function buildWhatsappMsg(templateId: string, nome: string, pedidoId: number): string {
  const t: Record<string, string> = {
    ocorrencia_confirmacao: `Olá ${nome}! Recebemos sua solicitação sobre o endereço de entrega do pedido #${pedidoId}. Nosso time está analisando e em breve retornamos. Equipe Kavita.`,
    ocorrencia_solicitar_dados: `Olá ${nome}! Sobre o pedido #${pedidoId}, precisamos confirmar o endereço correto de entrega. Pode nos enviar os dados atualizados (rua, número, bairro, cidade, estado, CEP)? Equipe Kavita.`,
    ocorrencia_taxa_extra: `Olá ${nome}! Analisamos a alteração de endereço do pedido #${pedidoId}. A mudança pode gerar um custo logístico adicional. Podemos conversar sobre os detalhes? Equipe Kavita.`,
    ocorrencia_correcao_concluida: `Olá ${nome}! O endereço de entrega do pedido #${pedidoId} foi corrigido com sucesso. Seu pedido seguirá normalmente. Obrigado por nos informar! Equipe Kavita.`,
    ocorrencia_resolvida: `Olá ${nome}! Sua solicitação sobre o pedido #${pedidoId} foi analisada e resolvida. Se precisar de algo mais, estamos aqui. Equipe Kavita.`,
  };
  return t[templateId] || `Olá ${nome}, sobre o seu pedido #${pedidoId}...`;
}

function normalizeTelBr(tel?: string | null): string | null {
  if (!tel) return null;
  const d = tel.replace(/\D/g, "");
  if (!d) return null;
  return d.startsWith("55") ? d : `55${d}`;
}

// ----- Componente de detalhe/edição -----
function OcorrenciaDetail({
  oc,
  onUpdate,
  onClose,
}: {
  oc: Ocorrencia;
  onUpdate: (id: number, data: Partial<Ocorrencia>) => void;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<StatusOcorrencia>(oc.status);
  const [resposta, setResposta] = useState(oc.resposta_admin || "");
  const [taxaExtra, setTaxaExtra] = useState(
    oc.taxa_extra > 0 ? String(oc.taxa_extra) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Endereço parseado (antes do addrForm para evitar referência antecipada)
  const endereco = parseEndereco(oc.pedido_endereco);

  // Edição de endereço
  const [editingAddress, setEditingAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({
    cep: endereco?.cep?.replace(/\D/g, "") || "",
    rua: endereco?.rua || endereco?.endereco || endereco?.logradouro || "",
    numero: endereco?.numero || "",
    bairro: endereco?.bairro || "",
    cidade: endereco?.cidade || "",
    estado: endereco?.estado || "",
    complemento: endereco?.complemento || "",
    ponto_referencia: endereco?.ponto_referencia || endereco?.referencia || "",
  });
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrMsg, setAddrMsg] = useState<string | null>(null);

  // Contato
  const [selectedTemplate, setSelectedTemplate] = useState<string>(CONTACT_TEMPLATES[0].id);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const [contactMsg, setContactMsg] = useState<string | null>(null);

  const whatsappNum = normalizeTelBr(oc.usuario_telefone);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const taxa = taxaExtra ? Number(taxaExtra.replace(",", ".")) : null;
      await apiClient.put(`/api/admin/pedidos/ocorrencias/${oc.id}`, {
        status,
        resposta_admin: resposta.trim(),
        taxa_extra: taxa && taxa > 0 ? taxa : null,
      });
      onUpdate(oc.id, {
        status,
        resposta_admin: resposta.trim(),
        taxa_extra: taxa && taxa > 0 ? taxa : 0,
      });
    } catch (err: any) {
      setError(err?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    setSavingAddr(true);
    setAddrMsg(null);
    try {
      await apiClient.put(`/api/admin/pedidos/${oc.pedido_id}/endereco`, {
        ...addrForm,
        cep: addrForm.cep.replace(/\D/g, ""),
      });
      setAddrMsg("Endereço atualizado com sucesso.");
      setEditingAddress(false);
    } catch (err: any) {
      setAddrMsg(`Erro: ${err?.message || "não foi possível atualizar."}`);
    } finally {
      setSavingAddr(false);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setContactMsg(null);
    try {
      await apiClient.post("/api/admin/comunicacao/email", {
        template: selectedTemplate,
        pedidoId: oc.pedido_id,
      });
      setContactMsg("Email enviado com sucesso.");
    } catch (err: any) {
      setContactMsg(`Erro ao enviar email: ${err?.message || "tente novamente."}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleOpenWhatsApp = async () => {
    if (!whatsappNum) return;
    const msg = buildWhatsappMsg(selectedTemplate, oc.usuario_nome, oc.pedido_id);
    const url = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");

    // Registrar no backend que a mensagem foi enviada
    setSendingWa(true);
    setContactMsg(null);
    try {
      await apiClient.post("/api/admin/comunicacao/whatsapp", {
        template: selectedTemplate,
        pedidoId: oc.pedido_id,
      });
      setContactMsg("WhatsApp aberto e contato registrado.");
    } catch {
      setContactMsg("WhatsApp aberto. (Registro de log falhou, mas a mensagem foi enviada.)");
    } finally {
      setSendingWa(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm"
      role="button"
      tabIndex={0}
      aria-label="Fechar detalhe da ocorrência"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Detalhe da ocorrência"
        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/60 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
              Ocorrência #{oc.id}
            </h2>
            <p className="mt-0.5 text-sm text-slate-400">
              Pedido #{oc.pedido_id} — {formatDate(oc.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:text-slate-200"
            aria-label="Fechar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Grid de informações */}
        <div className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          {/* Cliente */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cliente</p>
            <p className="mt-1 font-medium text-slate-200">{oc.usuario_nome}</p>
            <p className="text-slate-400">{oc.usuario_email}</p>
            {oc.usuario_telefone && <p className="text-slate-400">{oc.usuario_telefone}</p>}
          </div>

          {/* Pedido */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Pedido</p>
            <p className="mt-1 font-medium text-slate-200">#{oc.pedido_id} — {formatCurrency(oc.pedido_total)}</p>
            <p className="text-slate-400">{oc.pedido_forma_pagamento} — Pgto: {oc.pedido_status_pagamento}</p>
            <p className="text-slate-400">Entrega: {oc.pedido_status_entrega}</p>
          </div>

          {/* Endereço atual + edição */}
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 sm:col-span-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Endereço do pedido
              </p>
              {!editingAddress && (
                <button
                  type="button"
                  onClick={() => setEditingAddress(true)}
                  className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Corrigir endereço
                </button>
              )}
            </div>

            {!editingAddress ? (
              <>
                {endereco ? (
                  <div className="mt-1 space-y-0.5 text-slate-300">
                    <p>{endereco.rua || endereco.endereco || endereco.logradouro}{endereco.numero ? `, ${endereco.numero}` : ""}</p>
                    {endereco.bairro && <p>{endereco.bairro} — {endereco.cidade}/{endereco.estado}</p>}
                    {endereco.complemento && <p>{endereco.complemento}</p>}
                    {endereco.cep && <p>CEP: {endereco.cep}</p>}
                    {(endereco.ponto_referencia || endereco.referencia) && (
                      <p>Ref: {endereco.ponto_referencia || endereco.referencia}</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-slate-500">Endereço não disponível</p>
                )}
                {addrMsg && (
                  <p className={`mt-2 text-xs ${addrMsg.startsWith("Erro") ? "text-red-400" : "text-emerald-400"}`}>
                    {addrMsg}
                  </p>
                )}
              </>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {([
                  ["rua", "Rua / Logradouro", "sm:col-span-2"],
                  ["numero", "Número", ""],
                  ["complemento", "Complemento", ""],
                  ["bairro", "Bairro", ""],
                  ["cidade", "Cidade", ""],
                  ["estado", "Estado (UF)", ""],
                  ["cep", "CEP", ""],
                  ["ponto_referencia", "Ponto de referência", "sm:col-span-2"],
                ] as const).map(([field, label, span]) => (
                  <div key={field} className={span}>
                    <label className="block text-[11px] text-slate-400">{label}</label>
                    <input
                      type="text"
                      value={addrForm[field]}
                      onChange={(e) => setAddrForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="mt-0.5 w-full rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                    />
                  </div>
                ))}
                {addrMsg && (
                  <p className={`sm:col-span-2 text-xs ${addrMsg.startsWith("Erro") ? "text-red-400" : "text-emerald-400"}`}>
                    {addrMsg}
                  </p>
                )}
                <div className="flex gap-2 sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => { setEditingAddress(false); setAddrMsg(null); }}
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAddress}
                    disabled={savingAddr}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingAddr ? "Salvando..." : "Salvar endereço corrigido"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Problema relatado */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-400">Problema relatado pelo cliente</p>
            <p className="mt-1 font-medium text-slate-200">{LABEL_MOTIVO[oc.motivo] || oc.motivo}</p>
            {oc.observacao && <p className="mt-1 whitespace-pre-wrap text-slate-400">{oc.observacao}</p>}
          </div>

          {/* Resposta do cliente (se existir) */}
          {oc.resposta_cliente && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-400">Resposta do cliente</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-300">{oc.resposta_cliente}</p>
              {oc.endereco_sugerido && (() => {
                const addr = typeof oc.endereco_sugerido === "string"
                  ? (() => { try { return JSON.parse(oc.endereco_sugerido); } catch { return null; } })()
                  : oc.endereco_sugerido;
                if (!addr) return null;
                return (
                  <div className="mt-2 rounded-md border border-emerald-500/10 bg-slate-950/30 p-2 text-xs text-slate-400">
                    <p className="font-medium text-emerald-300">Endereço sugerido pelo cliente:</p>
                    <p>{addr.rua}{addr.numero ? `, ${addr.numero}` : ""}</p>
                    {addr.bairro && <p>{addr.bairro} — {addr.cidade}/{addr.estado}</p>}
                    {addr.complemento && <p>{addr.complemento}</p>}
                    {addr.cep && <p>CEP: {addr.cep}</p>}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Feedback de satisfação (se existir) */}
          {oc.feedback_nota && (
            <div className="rounded-lg border border-slate-700 bg-slate-950/40 p-3 sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Feedback do cliente</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg">{["😞","😕","😐","🙂","😊"][oc.feedback_nota - 1] || "—"}</span>
                <span className="text-sm text-slate-300">
                  {["Muito insatisfeito","Insatisfeito","Neutro","Satisfeito","Muito satisfeito"][oc.feedback_nota - 1] || "—"}
                </span>
              </div>
              {oc.feedback_comentario && (
                <p className="mt-1 text-sm text-slate-400">{oc.feedback_comentario}</p>
              )}
            </div>
          )}
        </div>

        {/* Contato com o cliente */}
        <div className="mt-5 space-y-3 border-t border-slate-800 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Contato com o cliente
          </p>

          {/* Template selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300">Mensagem</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            >
              {CONTACT_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Preview WhatsApp</p>
            <p className="mt-1 text-sm text-slate-300">
              {buildWhatsappMsg(selectedTemplate, oc.usuario_nome, oc.pedido_id)}
            </p>
          </div>

          {/* Botões de envio */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              disabled={!whatsappNum || sendingWa}
              title={whatsappNum ? "" : "Cliente sem telefone cadastrado"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sendingWa ? "Abrindo..." : "WhatsApp"}
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sendingEmail}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/50 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sendingEmail ? "Enviando..." : "Enviar email"}
            </button>
          </div>

          {/* Feedback */}
          {contactMsg && (
            <p className={`text-sm ${contactMsg.startsWith("Erro") ? "text-red-400" : "text-emerald-400"}`}>
              {contactMsg}
            </p>
          )}

          {!whatsappNum && (
            <p className="text-xs text-slate-500">
              Cliente sem telefone cadastrado. Apenas email disponível.
            </p>
          )}
        </div>

        {/* Tratativa do admin */}
        <div className="mt-5 space-y-4 border-t border-slate-800 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tratativa do admin
          </p>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusOcorrencia)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{LABEL_STATUS[s]}</option>
              ))}
            </select>
          </div>

          {/* Resposta */}
          <div>
            <label className="block text-sm font-medium text-slate-300">Observação interna / resposta</label>
            <textarea
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Decisão, orientação ou resposta ao cliente..."
              className="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            />
          </div>

          {/* Taxa extra */}
          <div>
            <label className="block text-sm font-medium text-slate-300">Taxa extra (R$) — opcional</label>
            <input
              type="text"
              inputMode="decimal"
              value={taxaExtra}
              onChange={(e) => setTaxaExtra(e.target.value)}
              placeholder="0,00"
              className="mt-1 w-full max-w-[200px] rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
            />
            <p className="mt-1 text-xs text-slate-500">Preencha apenas se houver custo logístico adicional.</p>
          </div>

          {/* Erro */}
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

          {/* Botões */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar tratativa"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Página principal -----
export default function OcorrenciasAdminPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Paginação + filtros server-side
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  const [filtroStatus, setFiltroStatus] = useState<StatusOcorrencia | "">("");
  const [filtroMotivo, setFiltroMotivo] = useState("");
  const [busca, setBusca] = useState("");

  // Contadores vindos de endpoint separado
  const [contadores, setContadores] = useState({ aberta: 0, em_analise: 0, aguardando_retorno: 0 });

  const carregar = async (p = page) => {
    try {
      setLoading(true);
      setErro(null);
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", String(limit));
      if (filtroStatus) params.set("status", filtroStatus);
      if (filtroMotivo) params.set("motivo", filtroMotivo);

      const resp = await apiClient.get<{ data: Ocorrencia[]; meta: { total: number; page: number; limit: number } }>(
        `/api/admin/pedidos/ocorrencias?${params.toString()}`,
      );

      // response.paginated retorna { ok, data, meta }
      // apiClient desempacota ok+data, mas meta fica no nível superior
      // Precisamos lidar com ambos os formatos
      if (Array.isArray(resp)) {
        // Fallback: resposta não paginada
        setOcorrencias(resp as unknown as Ocorrencia[]);
        setTotalPages(1);
        setTotalItems(resp.length);
      } else if (resp && typeof resp === "object" && "data" in resp) {
        setOcorrencias(resp.data);
        setTotalPages(Math.ceil(resp.meta.total / resp.meta.limit) || 1);
        setTotalItems(resp.meta.total);
        setPage(resp.meta.page);
      } else {
        setOcorrencias([]);
      }
    } catch (err) {
      console.error("Erro ao carregar ocorrências:", err);
      setErro("Não foi possível carregar as ocorrências.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar contadores
  useEffect(() => {
    apiClient
      .get<{ aberta: number; em_analise: number; aguardando_retorno: number }>(
        "/api/admin/pedidos/ocorrencias/count",
      )
      .then(setContadores)
      .catch(() => {});
  }, []);

  // Recarregar ao mudar filtros ou página
  useEffect(() => {
    carregar(page);
  }, [page, filtroStatus, filtroMotivo]);

  // Reset página ao mudar filtro
  const handleFilterChange = (setter: (v: any) => void, value: any) => {
    setter(value);
    setPage(1);
  };

  // Busca client-side (dentro da página atual)
  const filtradas = useMemo(() => {
    if (!busca.trim()) return ocorrencias;
    const q = busca.toLowerCase();
    return ocorrencias.filter(
      (o) =>
        o.usuario_nome.toLowerCase().includes(q) ||
        o.usuario_email.toLowerCase().includes(q) ||
        String(o.pedido_id).includes(q) ||
        String(o.id).includes(q),
    );
  }, [ocorrencias, busca]);

  const handleUpdate = (id: number, data: Partial<Ocorrencia>) => {
    setOcorrencias((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...data } : o)),
    );
    setSelectedId(null);
  };

  const selectedOc = ocorrencias.find((o) => o.id === selectedId) ?? null;

  // ----- Loading / Erro -----
  if (loading) {
    return (
      <main className="min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Ocorrências de Entrega
          </h1>
          <div className="mt-4">
            <LoadingState message="Carregando ocorrências..." variant="dark" />
          </div>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Ocorrências de Entrega
          </h1>
          <div className="mt-4">
            <ErrorState message={erro} variant="dark" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Ocorrências de Entrega
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Solicitações de correção de endereço enviadas pelos clientes.
            </p>
          </div>
          {/* Contadores */}
          <div className="flex flex-wrap gap-2">
            {contadores.aberta > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200">
                {contadores.aberta} nova{contadores.aberta > 1 ? "s" : ""}
              </span>
            )}
            {contadores.em_analise > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/40 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-200">
                {contadores.em_analise} em análise
              </span>
            )}
          </div>
        </header>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por cliente, email ou pedido..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 sm:max-w-xs"
          />
          <select
            value={filtroStatus}
            onChange={(e) =>
              handleFilterChange(setFiltroStatus, e.target.value as StatusOcorrencia | "")
            }
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          >
            <option value="">Todos os status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {LABEL_STATUS[s]}
              </option>
            ))}
          </select>
          <select
            value={filtroMotivo}
            onChange={(e) => handleFilterChange(setFiltroMotivo, e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          >
            <option value="">Todos os motivos</option>
            {Object.entries(LABEL_MOTIVO).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Vazio */}
        {filtradas.length === 0 && (
          <EmptyState
            message="Nenhuma ocorrência encontrada."
            variant="dark"
          />
        )}

        {/* Tabela desktop */}
        {filtradas.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto">
              {/* Desktop */}
              <div className="hidden min-w-full divide-y divide-gray-200 text-sm text-gray-700 md:table dark:divide-gray-800 dark:text-gray-200">
                {/* Header */}
                <div className="table-header-group bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900/70 dark:text-gray-400">
                  <div className="table-row">
                    <div className="table-cell px-4 py-3">#</div>
                    <div className="table-cell px-4 py-3">Pedido</div>
                    <div className="table-cell px-4 py-3">Cliente</div>
                    <div className="table-cell px-4 py-3">Problema</div>
                    <div className="table-cell px-4 py-3">Endereço</div>
                    <div className="table-cell px-4 py-3">Status</div>
                    <div className="table-cell px-4 py-3">Data</div>
                    <div className="table-cell px-4 py-3 text-right">Ação</div>
                  </div>
                </div>
                {/* Rows */}
                <div className="table-row-group divide-y divide-gray-200 dark:divide-gray-800">
                  {filtradas.map((oc) => (
                    <div
                      key={oc.id}
                      className="table-row hover:bg-gray-50/60 dark:hover:bg-gray-800/60"
                    >
                      <div className="table-cell px-4 py-3 align-top font-medium">
                        {oc.id}
                      </div>
                      <div className="table-cell px-4 py-3 align-top">
                        <span className="font-medium">#{oc.pedido_id}</span>
                        <br />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(oc.pedido_total)}
                        </span>
                      </div>
                      <div className="table-cell px-4 py-3 align-top">
                        <span className="font-medium">{oc.usuario_nome}</span>
                        <br />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {oc.usuario_email}
                        </span>
                      </div>
                      <div className="table-cell px-4 py-3 align-top">
                        {LABEL_MOTIVO[oc.motivo] || oc.motivo}
                        {oc.observacao && (
                          <p className="mt-0.5 max-w-[200px] truncate text-xs text-gray-500 dark:text-gray-400">
                            {oc.observacao}
                          </p>
                        )}
                      </div>
                      <div className="table-cell max-w-[180px] px-4 py-3 align-top">
                        <span className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                          {resumoEndereco(oc.pedido_endereco)}
                        </span>
                      </div>
                      <div className="table-cell px-4 py-3 align-top">
                        <Badge
                          label={LABEL_STATUS[oc.status]}
                          className={COR_STATUS[oc.status]}
                        />
                        {oc.taxa_extra > 0 && (
                          <p className="mt-1 text-[11px] text-amber-400">
                            Taxa: {formatCurrency(oc.taxa_extra)}
                          </p>
                        )}
                      </div>
                      <div className="table-cell px-4 py-3 align-top text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(oc.created_at)}
                      </div>
                      <div className="table-cell px-4 py-3 align-top text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedId(oc.id)}
                          className="inline-flex items-center rounded-md border border-emerald-500/60 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10"
                        >
                          Tratar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-gray-200 md:hidden dark:divide-gray-800">
                {filtradas.map((oc) => (
                  <div
                    key={oc.id}
                    className="space-y-2.5 p-4 hover:bg-gray-50/60 dark:hover:bg-gray-900/40"
                  >
                    {/* Topo: ID + Status + Data */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                          Ocorrência #{oc.id}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Pedido #{oc.pedido_id} —{" "}
                          {formatDate(oc.created_at)}
                        </p>
                      </div>
                      <Badge
                        label={LABEL_STATUS[oc.status]}
                        className={COR_STATUS[oc.status]}
                      />
                    </div>

                    {/* Cliente */}
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">{oc.usuario_nome}</span>
                      {" — "}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {oc.usuario_email}
                      </span>
                    </p>

                    {/* Problema */}
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {LABEL_MOTIVO[oc.motivo] || oc.motivo}
                    </p>
                    {oc.observacao && (
                      <p className="line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                        {oc.observacao}
                      </p>
                    )}

                    {/* Ação */}
                    <button
                      type="button"
                      onClick={() => setSelectedId(oc.id)}
                      className="mt-1 inline-flex w-full items-center justify-center rounded-md border border-emerald-500/60 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Ver detalhes e tratar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs text-slate-400">
            Página {page} de {totalPages} ({totalItems} total)
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal de detalhe */}
      {selectedOc && (
        <OcorrenciaDetail
          oc={selectedOc}
          onUpdate={handleUpdate}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}
