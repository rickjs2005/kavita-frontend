// src/components/painel-corretora/LeadStatusBadge.tsx

import type { LeadStatus } from "@/types/lead";

const STYLES: Record<
  LeadStatus,
  { label: string; className: string }
> = {
  new: {
    label: "Novo",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  contacted: {
    label: "Em contato",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  closed: {
    label: "Fechado",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  lost: {
    label: "Perdido",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${s.className}`}
    >
      {s.label}
    </span>
  );
}
