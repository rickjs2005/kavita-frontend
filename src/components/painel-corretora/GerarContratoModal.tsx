// src/components/painel-corretora/GerarContratoModal.tsx
//
// Modal para gerar contrato novo. Formulário discriminado por tipo
// (disponivel | entrega_futura). O backend espera 2s+ para renderizar
// o PDF via Puppeteer — o botão tem loading state proeminente.

"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { isApiError } from "@/lib/errors";
import type { ContratoTipo, ContratoCriado } from "@/types/contrato";
import { CONTRATO_TIPO_LABEL } from "@/types/contrato";

// Bloqueio explícito devolvido pelo backend quando a corretora não
// pode emitir contrato (KYC pendente/rejeitado, plano inativo ou
// capability ausente). Cada caso tem ação própria — UI pinta um
// banner em vez de só toast genérico, com CTA para o caminho de
// resolução. Manter alinhado com:
//   - services/corretoraKycService.requireVerifiedOrThrow
//   - services/planService.requireActivePlanWithCapability
type BlockReason =
  | { kind: "kyc"; status: string | null }
  | {
      kind: "plan_inactive";
      subscriptionStatus: string | null;
      upgradeUrl: string;
    }
  | {
      kind: "plan_capability";
      capability: string;
      currentPlan: string;
      upgradeUrl: string;
    };

function detectBlockReason(err: unknown): BlockReason | null {
  if (!isApiError(err) || err.status !== 403) return null;
  const details = (err.details ?? null) as Record<string, unknown> | null;

  // KYC: AppError 403 com code=FORBIDDEN e details.kyc_status. A
  // mensagem do backend já cita "KYC" mas usamos o details para
  // não depender da string.
  if (details && typeof details.kyc_status === "string") {
    return { kind: "kyc", status: details.kyc_status };
  }
  if (err.code === "PLAN_INACTIVE") {
    return {
      kind: "plan_inactive",
      subscriptionStatus:
        (details?.subscription_status as string | undefined) ?? null,
      upgradeUrl:
        (details?.upgrade_url as string | undefined) ??
        "/painel/corretora/planos",
    };
  }
  if (err.code === "PLAN_CAPABILITY_REQUIRED") {
    return {
      kind: "plan_capability",
      capability:
        (details?.capability as string | undefined) ?? "create_contract",
      currentPlan: (details?.current_plan as string | undefined) ?? "free",
      upgradeUrl:
        (details?.upgrade_url as string | undefined) ??
        "/painel/corretora/planos",
    };
  }
  return null;
}

type Props = {
  leadId: number;
  isOpen: boolean;
  onClose: () => void;
  onGenerated: () => void;
};

type BaseState = {
  safra: string;
  bebida_laudo: string;
  quantidade_sacas: string;
  nome_armazem_ou_fazenda: string;
  id_amostra: string;
  observacoes: string;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function GerarContratoModal({
  leadId,
  isOpen,
  onClose,
  onGenerated,
}: Props) {
  const [tipo, setTipo] = useState<ContratoTipo>("disponivel");
  const [base, setBase] = useState<BaseState>({
    safra: "",
    bebida_laudo: "",
    quantidade_sacas: "",
    nome_armazem_ou_fazenda: "",
    id_amostra: "",
    observacoes: "",
  });

  // Campos específicos do disponível.
  const [precoSaca, setPrecoSaca] = useState("");
  const [prazoPagamentoDias, setPrazoPagamentoDias] = useState("15");

  // Campos específicos do entrega futura.
  const [safraFutura, setSafraFutura] = useState("");
  const [diferencialBasis, setDiferencialBasis] = useState("0");
  const [dataRefCepea, setDataRefCepea] = useState(todayISO());

  const [submitting, setSubmitting] = useState(false);
  const [blockReason, setBlockReason] = useState<BlockReason | null>(null);

  // Reset quando fecha e reabre.
  useEffect(() => {
    if (!isOpen) {
      setBase({
        safra: "",
        bebida_laudo: "",
        quantidade_sacas: "",
        nome_armazem_ou_fazenda: "",
        id_amostra: "",
        observacoes: "",
      });
      setPrecoSaca("");
      setPrazoPagamentoDias("15");
      setSafraFutura("");
      setDiferencialBasis("0");
      setDataRefCepea(todayISO());
      setTipo("disponivel");
      setBlockReason(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (submitting) return;

    const data_fields: Record<string, unknown> = {
      safra: base.safra,
      bebida_laudo: base.bebida_laudo,
      quantidade_sacas: Number(base.quantidade_sacas),
      nome_armazem_ou_fazenda: base.nome_armazem_ou_fazenda,
      id_amostra: base.id_amostra || null,
      observacoes: base.observacoes || null,
    };

    if (tipo === "disponivel") {
      data_fields.preco_saca = Number(precoSaca);
      data_fields.prazo_pagamento_dias = Number(prazoPagamentoDias);
    } else {
      data_fields.safra_futura = safraFutura;
      data_fields.diferencial_basis = Number(diferencialBasis);
      data_fields.data_referencia_cepea = dataRefCepea;
    }

    setSubmitting(true);
    setBlockReason(null);
    try {
      await apiClient.post<ContratoCriado>("/api/corretora/contratos", {
        lead_id: leadId,
        tipo,
        data_fields,
      });
      toast.success("Contrato gerado com sucesso.");
      onGenerated();
      onClose();
    } catch (err) {
      const reason = detectBlockReason(err);
      if (reason) {
        // Mostra banner contextual no modal — o toast genérico
        // não comunica o suficiente para a corretora resolver.
        setBlockReason(reason);
      } else {
        toast.error(formatApiError(err, "Erro ao gerar contrato.").message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="button"
      tabIndex={0}
      aria-label="Fechar diálogo"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      onKeyDown={(e) => {
        if (
          e.target === e.currentTarget &&
          !submitting &&
          (e.key === "Enter" || e.key === " ")
        ) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-stone-900 ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-stone-900 border-b border-white/[0.06] px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-stone-100">
            Gerar contrato
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-stone-400 hover:text-stone-200 text-xl leading-none disabled:opacity-50"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {blockReason && <BlockBanner reason={blockReason} />}
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-2">
              Tipo de contrato
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(["disponivel", "entrega_futura"] as ContratoTipo[]).map((t) => (
                <label
                  key={t}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors ${
                    tipo === t
                      ? "border-amber-400 bg-amber-400/10 text-stone-100"
                      : "border-stone-700 text-stone-300 hover:border-stone-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={t}
                    checked={tipo === t}
                    onChange={() => setTipo(t)}
                    className="sr-only"
                  />
                  <span className="font-semibold">{CONTRATO_TIPO_LABEL[t]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Safra"
              value={base.safra}
              onChange={(v) => setBase((b) => ({ ...b, safra: v }))}
              placeholder="ex.: 2025/2026"
              required
            />
            <Field
              label="Bebida (laudo)"
              value={base.bebida_laudo}
              onChange={(v) => setBase((b) => ({ ...b, bebida_laudo: v }))}
              placeholder="ex.: Dura"
              required
            />
            <Field
              label="Quantidade (sacas 60kg)"
              value={base.quantidade_sacas}
              onChange={(v) => setBase((b) => ({ ...b, quantidade_sacas: v }))}
              type="number"
              placeholder="200"
              required
            />
            <Field
              label="Local de entrega"
              value={base.nome_armazem_ou_fazenda}
              onChange={(v) =>
                setBase((b) => ({ ...b, nome_armazem_ou_fazenda: v }))
              }
              placeholder="Armazém / Fazenda"
              required
            />
          </div>

          {tipo === "disponivel" ? (
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Preço por saca (R$)"
                value={precoSaca}
                onChange={setPrecoSaca}
                type="number"
                placeholder="1450.00"
                required
              />
              <Field
                label="Prazo pagamento (dias úteis)"
                value={prazoPagamentoDias}
                onChange={setPrazoPagamentoDias}
                type="number"
                placeholder="15"
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Safra futura"
                value={safraFutura}
                onChange={setSafraFutura}
                placeholder="ex.: 2026/2027"
                required
              />
              <Field
                label="Data de referência CEPEA"
                value={dataRefCepea}
                onChange={setDataRefCepea}
                type="date"
                required
              />
              <div className="col-span-2">
                <Field
                  label="Diferencial (basis) em R$ por saca"
                  value={diferencialBasis}
                  onChange={setDiferencialBasis}
                  type="number"
                  placeholder="ex.: -25.00"
                  required
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="ID da amostra (opcional)"
              value={base.id_amostra}
              onChange={(v) => setBase((b) => ({ ...b, id_amostra: v }))}
              placeholder="ex.: AMO-2026-0123"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={base.observacoes}
              onChange={(e) =>
                setBase((b) => ({ ...b, observacoes: e.target.value }))
              }
              rows={3}
              className="w-full rounded-lg bg-stone-800 border border-stone-700 px-3 py-2 text-sm text-stone-100 focus:border-amber-400 focus:outline-none"
              placeholder="Detalhes adicionais acordados entre as partes…"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-stone-950 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-stone-900/40 border-t-stone-900 animate-spin" />
                  Gerando PDF (~3s)…
                </>
              ) : (
                "Gerar contrato"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlockBanner({ reason }: { reason: BlockReason }) {
  if (reason.kind === "kyc") {
    return (
      <div
        role="alert"
        className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-sm"
      >
        <p className="font-semibold text-amber-200">
          Verificação KYC pendente
        </p>
        <p className="mt-1 text-stone-200">
          Sua corretora ainda não foi verificada
          {reason.status && reason.status !== "pending_verification"
            ? ` (status atual: ${reason.status})`
            : ""}
          . Aguarde a aprovação do KYC para emitir contratos. Se já enviou
          os dados há mais de um dia útil, fale com o time da Kavita.
        </p>
      </div>
    );
  }
  if (reason.kind === "plan_inactive") {
    return (
      <div
        role="alert"
        className="rounded-lg border border-rose-400/40 bg-rose-500/10 p-4 text-sm"
      >
        <p className="font-semibold text-rose-200">Plano inativo</p>
        <p className="mt-1 text-stone-200">
          Sua assinatura está como{" "}
          <span className="font-mono">
            {reason.subscriptionStatus ?? "sem plano"}
          </span>
          . Regularize a assinatura para gerar contratos.
        </p>
        <a
          href={reason.upgradeUrl}
          className="mt-3 inline-flex items-center gap-1 rounded-md bg-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-100 ring-1 ring-rose-400/40 hover:bg-rose-500/40"
        >
          Regularizar assinatura →
        </a>
      </div>
    );
  }
  // plan_capability
  return (
    <div
      role="alert"
      className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-sm"
    >
      <p className="font-semibold text-amber-200">
        Plano atual não permite contratos
      </p>
      <p className="mt-1 text-stone-200">
        Seu plano <span className="font-mono">{reason.currentPlan}</span> não
        inclui geração de contratos. Faça upgrade para um plano que liberte
        a feature <span className="font-mono">{reason.capability}</span>.
      </p>
      <a
        href={reason.upgradeUrl}
        className="mt-3 inline-flex items-center gap-1 rounded-md bg-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-100 ring-1 ring-amber-400/40 hover:bg-amber-500/40"
      >
        Ver planos →
      </a>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-400 mb-1.5">
        {label}
        {required && <span className="text-amber-400 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg bg-stone-800 border border-stone-700 px-3 py-2 text-sm text-stone-100 focus:border-amber-400 focus:outline-none placeholder:text-stone-500"
      />
    </div>
  );
}
