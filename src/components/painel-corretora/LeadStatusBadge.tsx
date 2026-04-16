// src/components/painel-corretora/LeadStatusBadge.tsx
//
// Badge de status do lead — dark mode operacional.
// Cada status tem dot colorido + texto stone-200 sobre fundo stone-800.
// O dot é o único acento — leitura rápida em ambiente escuro.

import type { LeadStatus } from "@/types/lead";

const STYLES: Record<
  LeadStatus,
  { label: string; dot: string }
> = {
  new: {
    label: "Novo",
    dot: "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]",
  },
  contacted: {
    label: "Em contato",
    dot: "bg-amber-500",
  },
  closed: {
    label: "Fechado",
    dot: "bg-emerald-400",
  },
  lost: {
    label: "Perdido",
    dot: "bg-stone-500",
  },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const s = STYLES[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-800 px-2.5 py-0.5 text-[11px] font-semibold text-stone-200 ring-1 ring-white/[0.06]">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
