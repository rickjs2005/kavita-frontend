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
import type { ContratoTipo, ContratoCriado } from "@/types/contrato";
import { CONTRATO_TIPO_LABEL } from "@/types/contrato";

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
      toast.error(formatApiError(err, "Erro ao gerar contrato.").message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
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
