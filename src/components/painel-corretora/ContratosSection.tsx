// src/components/painel-corretora/ContratosSection.tsx
//
// Seção "Contratos" no detalhe do lead. Mostra:
//   - Botão "Gerar contrato" (habilitado apenas quando lead está fechado)
//   - Lista de contratos existentes em cards coloridos
//   - Estado vazio convidativo quando ainda não há contrato
//
// É um Client Component auto-contido — uso e orquestração em
// LeadDetailClient.tsx fica trivial (<ContratosSection leadId=... leadStatus=... />).

"use client";

import { useState } from "react";
import { PanelCard } from "./PanelCard";
import { ContratoCard } from "./ContratoCard";
import { GerarContratoModal } from "./GerarContratoModal";
import { useLeadContratos } from "@/hooks/useLeadContratos";
import { useMyKycStatus } from "@/hooks/useMyKycStatus";
import type { LeadStatus } from "@/types/lead";

type Props = {
  leadId: number;
  leadStatus: LeadStatus;
};

const KYC_STATUS_LABEL: Record<string, string> = {
  pending_verification: "Verificação pendente",
  under_review: "Em análise pela Kavita",
  rejected: "Verificação recusada",
};

export function ContratosSection({ leadId, leadStatus }: Props) {
  const { items, loading, error, refetch } = useLeadContratos(leadId);
  const { data: kyc } = useMyKycStatus();
  const [modalOpen, setModalOpen] = useState(false);

  const leadIsClosed = leadStatus === "closed";
  const kycApproved = kyc?.can_emit_contracts === true;
  const canGenerate = leadIsClosed && kycApproved;

  const blockReason = !leadIsClosed
    ? "Marque o negócio como Fechado para gerar contrato."
    : !kycApproved
      ? `Habilita quando seu KYC estiver aprovado. Status atual: ${KYC_STATUS_LABEL[kyc?.kyc_status || ""] || kyc?.kyc_status || "carregando…"}.`
      : null;

  return (
    <PanelCard>
      <header className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-stone-100 tracking-tight">
            Contratos
          </h3>
          <p className="mt-1 text-xs text-stone-400">
            Instrumentos de Compra e Venda ligados a este negócio.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={!canGenerate}
          title={
            canGenerate
              ? "Gerar novo contrato para este lead"
              : (blockReason ?? "Indisponível")
          }
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed transition-colors"
        >
          + Gerar contrato
        </button>
      </header>

      {/* Banner KYC — prioridade sobre "aguarde fechar" porque é
          bloqueio mais profundo. */}
      {!kycApproved && kyc && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs">
          <div className="flex items-start gap-2">
            <span className="text-amber-400 mt-0.5">⚠</span>
            <div>
              <div className="font-semibold text-amber-200">
                {KYC_STATUS_LABEL[kyc.kyc_status] ?? "KYC pendente"}
              </div>
              <p className="mt-1 text-stone-400">
                Enquanto seu KYC não for aprovado pela Kavita, o botão
                de gerar contrato permanece desabilitado. Você pode
                continuar atendendo leads, qualificando amostras e
                registrando propostas normalmente.
                {kyc.kyc_status === "rejected" && kyc.rejected_reason && (
                  <span className="block mt-1 italic text-stone-500">
                    Motivo informado: {kyc.rejected_reason}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {kycApproved && !leadIsClosed && items.length === 0 && (
        <p className="text-xs text-stone-500 italic">
          O botão fica disponível quando o lead é marcado como Fechado.
        </p>
      )}

      {loading && (
        <p className="text-xs text-stone-500">Carregando contratos…</p>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {!loading && !error && items.length === 0 && canGenerate && (
        <div className="text-center py-4 rounded-lg border border-dashed border-stone-700 bg-stone-950/40">
          <p className="text-sm text-stone-300">
            Nenhum contrato gerado ainda.
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Clique em <span className="text-amber-400 font-semibold">Gerar contrato</span> para iniciar.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((c) => (
            <ContratoCard key={c.id} contrato={c} onChanged={refetch} />
          ))}
        </div>
      )}

      <GerarContratoModal
        leadId={leadId}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onGenerated={refetch}
      />
    </PanelCard>
  );
}
