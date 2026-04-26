// src/components/painel-corretora/ContratoCard.tsx
//
// Card de um contrato dentro do detalhe do lead. Renderiza status,
// tipo, hash resumido, datas-chave e ações contextuais (enviar
// para assinatura, baixar PDF, cancelar).
//
// Design language: stone-900 + amber accent, mesmo do PanelCard.

"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { API_BASE } from "@/utils/absUrl";
import { formatDateTime } from "@/utils/formatters";
import type { Contrato } from "@/types/contrato";
import { CONTRATO_TIPO_LABEL } from "@/types/contrato";
import { ContratoStatusBadge } from "./ContratoStatusBadge";

type Props = {
  contrato: Contrato;
  onChanged: () => void;
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return formatDateTime(iso) || String(iso);
}

export function ContratoCard({ contrato, onChanged }: Props) {
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const canSend = contrato.status === "draft";
  const canDownloadDraft = contrato.status !== "cancelled";
  const canCancel =
    contrato.status === "draft" || contrato.status === "sent";

  async function handleSend() {
    if (!canSend || sending) return;
    setSending(true);
    try {
      await apiClient.post(
        `/api/corretora/contratos/${contrato.id}/enviar`,
        {},
      );
      toast.success("Contrato enviado para assinatura.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao enviar contrato.").message);
    } finally {
      setSending(false);
    }
  }

  async function handleCancel() {
    if (!canCancel || cancelling) return;
    const motivo = window.prompt("Motivo do cancelamento:");
    if (!motivo || motivo.trim().length < 3) return;
    setCancelling(true);
    try {
      await apiClient.post(
        `/api/corretora/contratos/${contrato.id}/cancelar`,
        { motivo: motivo.trim() },
      );
      toast.success("Contrato cancelado.");
      onChanged();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao cancelar contrato.").message);
    } finally {
      setCancelling(false);
    }
  }

  function downloadPdf() {
    // Abre o PDF em nova aba — endpoint usa cookie da sessão, não
    // precisa passar nada por header aqui.
    window.open(
      `${API_BASE}/api/corretora/contratos/${contrato.id}/pdf`,
      "_blank",
      "noopener",
    );
  }

  const shortHash = `${contrato.hash_sha256.slice(0, 12)}…${contrato.hash_sha256.slice(-8)}`;

  return (
    <div className="rounded-xl bg-stone-900 ring-1 ring-white/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ContratoStatusBadge status={contrato.status} />
            <span className="text-xs text-stone-400">
              #{contrato.id}
            </span>
          </div>
          <div className="mt-2 text-sm font-semibold text-stone-100">
            {CONTRATO_TIPO_LABEL[contrato.tipo]}
          </div>
        </div>
        <div className="text-[10px] text-stone-500 font-mono text-right shrink-0">
          <div>SHA-256</div>
          <div className="text-stone-400">{shortHash}</div>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <dt className="text-stone-500">Criado</dt>
        <dd className="text-stone-300 text-right">{fmtDate(contrato.created_at)}</dd>
        {contrato.sent_at && (
          <>
            <dt className="text-stone-500">Enviado</dt>
            <dd className="text-stone-300 text-right">{fmtDate(contrato.sent_at)}</dd>
          </>
        )}
        {contrato.signed_at && (
          <>
            <dt className="text-stone-500">Assinado</dt>
            <dd className="text-emerald-400 text-right font-semibold">
              {fmtDate(contrato.signed_at)}
            </dd>
          </>
        )}
        {contrato.cancelled_at && (
          <>
            <dt className="text-stone-500">Cancelado</dt>
            <dd className="text-stone-400 text-right">{fmtDate(contrato.cancelled_at)}</dd>
          </>
        )}
        {contrato.cancel_reason && (
          <>
            <dt className="text-stone-500">Motivo</dt>
            <dd className="text-stone-300 text-right col-start-2 italic">
              {contrato.cancel_reason}
            </dd>
          </>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        {canSend && (
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:bg-stone-700 disabled:text-stone-500 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <>
                <span className="h-3 w-3 rounded-full border-2 border-stone-900/40 border-t-stone-900 animate-spin" />
                Enviando…
              </>
            ) : (
              "Enviar para assinatura"
            )}
          </button>
        )}
        {canDownloadDraft && (
          <button
            type="button"
            onClick={downloadPdf}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-200 hover:bg-stone-700 ring-1 ring-white/[0.05] transition-colors"
          >
            Baixar PDF
          </button>
        )}
        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={cancelling}
            className="inline-flex items-center gap-1.5 rounded-lg bg-transparent px-3 py-1.5 text-xs font-semibold text-stone-400 hover:text-red-400 hover:bg-stone-800 transition-colors disabled:cursor-not-allowed"
          >
            {cancelling ? "Cancelando…" : "Cancelar"}
          </button>
        )}
      </div>

      <div className="mt-3 text-[10px] text-stone-500">
        <a
          href={`/verificar/${contrato.qr_verification_token}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-amber-400 transition-colors"
        >
          Verificar autenticidade →
        </a>
      </div>
    </div>
  );
}
