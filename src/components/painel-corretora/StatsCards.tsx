// src/components/painel-corretora/StatsCards.tsx

import type { LeadsSummary } from "@/types/lead";

type Props = {
  summary: LeadsSummary;
  loading?: boolean;
};

const cards: Array<{
  key: keyof LeadsSummary;
  label: string;
  hint: string;
  tone: string;
}> = [
  {
    key: "total",
    label: "Total de leads",
    hint: "Contatos recebidos no período",
    tone: "text-zinc-900",
  },
  {
    key: "new",
    label: "Novos",
    hint: "Ainda não contatados",
    tone: "text-emerald-700",
  },
  {
    key: "contacted",
    label: "Em contato",
    hint: "Negociação em andamento",
    tone: "text-amber-700",
  },
  {
    key: "closed",
    label: "Fechados",
    hint: "Negociações ganhas",
    tone: "text-sky-700",
  },
  {
    key: "lost",
    label: "Perdidos",
    hint: "Não avançaram",
    tone: "text-rose-700",
  },
];

export function StatsCards({ summary, loading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-zinc-200 bg-white p-4"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {card.label}
          </p>
          <p className={`mt-2 text-3xl font-bold ${card.tone}`}>
            {loading ? "…" : (summary[card.key] ?? 0)}
          </p>
          <p className="mt-1 text-xs text-zinc-400">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}
