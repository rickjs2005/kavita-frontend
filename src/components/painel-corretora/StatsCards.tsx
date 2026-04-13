// src/components/painel-corretora/StatsCards.tsx
//
// KPI grid do dashboard da Sala Reservada. Design hierárquico:
//
//   - "Total" e "Novos" são os cards de maior destaque (hero stats)
//   - "Em contato", "Fechados", "Perdidos" são secundários
//   - Quando há leads novos, o card "Novos" ganha um ring esmeralda
//     para pedir atenção, sem virar alarme vermelho
//
// Paleta monocromática deliberada: todos os números em stone-900,
// diferenciação pela hierarquia tipográfica e micro-acentos
// (ponto colorido no kicker, ring condicional).

import { PanelCard } from "./PanelCard";
import type { LeadsSummary } from "@/types/lead";

type Props = {
  summary: LeadsSummary;
  loading?: boolean;
};

type Card = {
  key: keyof LeadsSummary;
  label: string;
  hint: string;
  dotClass: string;
};

const cards: Card[] = [
  {
    key: "total",
    label: "Total de leads",
    hint: "Contatos recebidos",
    dotClass: "bg-stone-900",
  },
  {
    key: "new",
    label: "Novos",
    hint: "Aguardando resposta",
    dotClass: "bg-amber-500",
  },
  {
    key: "contacted",
    label: "Em contato",
    hint: "Em negociação",
    dotClass: "bg-amber-500",
  },
  {
    key: "closed",
    label: "Fechados",
    hint: "Negócios ganhos",
    dotClass: "bg-stone-700",
  },
  {
    key: "lost",
    label: "Perdidos",
    hint: "Não avançaram",
    dotClass: "bg-stone-400",
  },
];

// Delay incremental em ms aplicado a cada card do grid — cria cascata
// sutil ao montar. Só entra em ação uma vez, no mount inicial do React.
// O `.kavita-rise-in` honra prefers-reduced-motion via o reset global
// em globals.css, então desktops com redução de movimento ficam estáticos.
const STAGGER_STEP_MS = 70;

export function StatsCards({ summary, loading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
      {cards.map((card, index) => {
        const value = summary[card.key] ?? 0;
        const isAttention = card.key === "new" && value > 0;

        return (
          <PanelCard
            key={card.key}
            density="compact"
            accent={isAttention ? "amber" : "none"}
            className="kavita-rise-in group"
            style={{ animationDelay: `${index * STAGGER_STEP_MS}ms` }}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${card.dotClass}`}
              />
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                {card.label}
              </p>
            </div>
            <p
              className={`mt-3 text-3xl font-semibold tracking-tight tabular-nums md:text-[2rem] ${
                !loading && value === 0 ? "text-stone-300" : "text-stone-900"
              }`}
            >
              {loading ? (
                <span className="inline-block h-8 w-10 animate-pulse rounded bg-stone-100" />
              ) : (
                value
              )}
            </p>
            <p className="mt-1 text-[11px] text-stone-500">
              {!loading && value === 0 && card.key === "total"
                ? "Aguardando primeiros contatos"
                : card.hint}
            </p>
          </PanelCard>
        );
      })}
    </div>
  );
}
