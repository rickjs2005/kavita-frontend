// src/components/painel-corretora/LeadStatusBadge.tsx
//
// Badge monocromático disciplinado: cada status tem um "dot" colorido
// + texto em stone-700, sobre fundo stone-50 cercado por hairline.
// A cor do dot é o único acento — o resto é escala neutra. Isso dá
// coerência visual e evita a impressão de "alarme" em status negativos.

import type { LeadStatus } from "@/types/lead";

const STYLES: Record<
  LeadStatus,
  { label: string; dot: string }
> = {
  new: {
    label: "Novo",
    dot: "bg-amber-500",
  },
  contacted: {
    label: "Em contato",
    dot: "bg-amber-500",
  },
  closed: {
    label: "Fechado",
    dot: "bg-stone-700",
  },
  lost: {
    label: "Perdido",
    dot: "bg-stone-400",
  },
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const s = STYLES[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-50 px-2 py-0.5 text-[11px] font-semibold text-stone-700 ring-1 ring-stone-900/[0.06]">
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
