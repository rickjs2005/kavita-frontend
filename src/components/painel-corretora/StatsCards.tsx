// src/components/painel-corretora/StatsCards.tsx
//
// KPI grid hierárquico da Sala Reservada:
//
//   ┌──────────────────┐ ┌────────┬────────┐
//   │                  │ │ Novos  │Em cont.│
//   │   TOTAL (hero)   │ ├────────┼────────┤
//   │                  │ │Fechados│Perdidos│
//   └──────────────────┘ └────────┴────────┘
//
// O card "Total" é o centro de gravidade visual: hero com gradient
// stone-900/amber, brand mark decorativo, número gigante. Os 4 outros
// ficam num grid 2×2 secundário à direita, com cards compactos.

import { PanelCard } from "./PanelCard";
import { PanelBrandMark } from "./PanelBrand";
import type { LeadsSummary } from "@/types/lead";

type Props = {
  summary: LeadsSummary;
  loading?: boolean;
};

type SecondaryCard = {
  key: keyof LeadsSummary;
  label: string;
  hint: string;
  dotClass: string;
};

const secondaryCards: SecondaryCard[] = [
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
    dotClass: "bg-amber-600",
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

const STAGGER_STEP_MS = 70;

export function StatsCards({ summary, loading }: Props) {
  const total = summary.total ?? 0;
  const totalIsZero = !loading && total === 0;
  const newCount = summary.new ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
      {/* HERO CARD — Total de leads */}
      <div
        className="kavita-rise-in relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-800 p-6 ring-1 ring-stone-900/20 md:col-span-1 md:p-7"
        style={{ animationDelay: "0ms" }}
      >
        {/* Top highlight premium */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
        />

        {/* Warm glow atmosférico */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-amber-600/10 blur-3xl"
        />

        {/* Brand mark decorativo */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-4 -right-4 text-stone-700/20"
        >
          <PanelBrandMark className="h-32 w-32" />
        </span>

        <div className="relative">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
              Total de leads
            </p>
          </div>

          <p
            className={`mt-5 text-6xl font-semibold tracking-tight tabular-nums md:text-[4.5rem] md:leading-[0.9] ${
              totalIsZero ? "text-stone-500" : "text-stone-50"
            }`}
          >
            {loading ? (
              <span className="inline-block h-16 w-20 animate-pulse rounded bg-stone-700/60" />
            ) : (
              total
            )}
          </p>

          <p className="mt-4 text-xs leading-relaxed text-stone-400">
            {totalIsZero
              ? "Aguardando primeiros contatos da sua página pública."
              : `${newCount > 0 ? `${newCount} novo${newCount > 1 ? "s" : ""} aguardando resposta. ` : ""}Contatos recebidos via Mercado do Café.`}
          </p>
        </div>
      </div>

      {/* SECONDARY GRID — 2×2 */}
      <div className="grid grid-cols-2 gap-3 md:col-span-2 md:gap-4">
        {secondaryCards.map((card, index) => {
          const value = summary[card.key] ?? 0;
          const isAttention = card.key === "new" && value > 0;
          const isZero = !loading && value === 0;

          return (
            <PanelCard
              key={card.key}
              density="compact"
              accent={isAttention ? "amber" : "none"}
              className="kavita-rise-in group"
              style={{ animationDelay: `${(index + 1) * STAGGER_STEP_MS}ms` }}
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
                  isZero ? "text-stone-300" : "text-stone-900"
                }`}
              >
                {loading ? (
                  <span className="inline-block h-8 w-10 animate-pulse rounded bg-stone-100" />
                ) : (
                  value
                )}
              </p>
              <p className="mt-1 text-[11px] text-stone-500">{card.hint}</p>
            </PanelCard>
          );
        })}
      </div>
    </div>
  );
}
