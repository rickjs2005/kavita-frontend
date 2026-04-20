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
import type { LeadStatus } from "@/types/lead";

type Props = {
  leadId: number;
  leadStatus: LeadStatus;
};

export function ContratosSection({ leadId, leadStatus }: Props) {
  const { items, loading, error, refetch } = useLeadContratos(leadId);
  const [modalOpen, setModalOpen] = useState(false);
  const canGenerate = leadStatus === "closed";

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
              : "Marque o negócio como Fechado para gerar contrato"
          }
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-stone-950 hover:bg-amber-400 disabled:bg-stone-800 disabled:text-stone-500 disabled:cursor-not-allowed transition-colors"
        >
          + Gerar contrato
        </button>
      </header>

      {!canGenerate && items.length === 0 && (
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
