// src/components/painel-corretora/ContratoStatusBadge.tsx
//
// Badge de status do contrato, mesmo padrão visual do LeadStatusBadge:
// dot colorido + texto stone-200 sobre fundo stone-800.

import type { ContratoStatus } from "@/types/contrato";
import { CONTRATO_STATUS_LABEL } from "@/types/contrato";

const DOT: Record<ContratoStatus, string> = {
  draft: "bg-stone-400",
  sent: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
  signed: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]",
  cancelled: "bg-stone-500",
  expired: "bg-red-500",
};

export function ContratoStatusBadge({ status }: { status: ContratoStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-800 px-2.5 py-0.5 text-[11px] font-semibold text-stone-200 ring-1 ring-white/[0.06]">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
      {CONTRATO_STATUS_LABEL[status]}
    </span>
  );
}
