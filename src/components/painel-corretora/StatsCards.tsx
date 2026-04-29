// src/components/painel-corretora/StatsCards.tsx
//
// KPI grid da Sala Reservada — v3 com identidade café editorial.
//
//   ┌──────────────────────┐  ┌────────┬────────┐
//   │                      │  │ Novos  │Em cont.│
//   │   TOTAL              │  ├────────┼────────┤
//   │   (hero dark, bean   │  │Fechados│Perdidos│
//   │    scatter, serif)   │  └────────┴────────┘
//   └──────────────────────┘
//
// Hero card "Total" é o centro gravitacional: dark com bean scatter,
// número gigante serif, tagline editorial. Os 4 secundários são cards
// warm (stone-50 gradient) com amber highlights e hover lift.

import { PanelBrandMark } from "./PanelBrand";
import { BeanScatter } from "./PanelOrnaments";
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
    dotClass: "bg-amber-700",
  },
  {
    key: "closed",
    label: "Fechados",
    hint: "Negócios ganhos",
    dotClass: "bg-emerald-600",
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-5 md:gap-5">
      {/* ============================================================
          HERO CARD — Total de leads
         ============================================================ */}
      <div
        className="kavita-rise-in relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-950 via-panel-warm-via to-stone-900 p-6 shadow-xl shadow-stone-900/30 ring-1 ring-amber-900/20 md:col-span-3 md:p-8"
        style={{ animationDelay: "0ms" }}
      >
        {/* Top highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"
        />

        {/* Atmospheric glows */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-amber-500/[0.12] blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-amber-700/[0.1] blur-3xl"
        />

        {/* Bean scatter */}
        <BeanScatter tone="dark" density="heavy" />

        {/* Decorative massive bean */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-8 -right-4 text-stone-700/25"
        >
          <PanelBrandMark className="h-40 w-40" />
        </span>

        <div className="relative">
          {/* Kicker */}
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]"
            />
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
              Total de leads
            </p>
          </div>

          {/* Mega number with serif */}
          <p
            className={`mt-6 font-serif text-7xl font-semibold leading-[0.85] tracking-tight tabular-nums md:text-[7rem] ${
              totalIsZero ? "text-stone-500" : "text-stone-50"
            }`}
          >
            {loading ? (
              <span className="inline-block h-20 w-28 animate-pulse rounded bg-stone-700/60" />
            ) : (
              total
            )}
          </p>

          {/* Tagline editorial */}
          <div className="mt-6 flex items-center gap-3">
            <span aria-hidden className="h-px w-10 bg-amber-300/50" />
            <p className="max-w-sm text-xs leading-relaxed text-stone-400">
              {totalIsZero ? (
                <>
                  <span className="font-semibold text-stone-200">
                    Aguardando primeiros contatos.
                  </span>{" "}
                  Sua sala está pronta para receber produtores interessados.
                </>
              ) : (
                <>
                  {newCount > 0 && (
                    <>
                      <span className="font-semibold text-amber-300">
                        {newCount} novo{newCount > 1 ? "s" : ""}
                      </span>{" "}
                      aguardando sua resposta.{" "}
                    </>
                  )}
                  <span className="text-stone-500">
                    Contatos recebidos via Mercado do Café.
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================
          SECONDARY GRID — 2×2 warm premium
         ============================================================ */}
      <div className="grid grid-cols-2 gap-3 md:col-span-2 md:gap-4">
        {secondaryCards.map((card, index) => {
          const value = summary[card.key] ?? 0;
          const isAttention = card.key === "new" && value > 0;
          const isZero = !loading && value === 0;

          return (
            <div
              key={card.key}
              className={`kavita-rise-in group relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 p-4 shadow-sm shadow-black/20 ring-1 transition-all hover:-translate-y-0.5 hover:shadow-md md:p-5 ${
                isAttention
                  ? "ring-2 ring-amber-500/60"
                  : "ring-white/[0.06]"
              }`}
              style={{ animationDelay: `${(index + 1) * STAGGER_STEP_MS}ms` }}
            >
              {/* Top highlight */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"
              />
              {/* Warm glow on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-500/0 blur-2xl transition-all group-hover:bg-amber-500/15"
              />

              <div className="relative">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 rounded-full ${card.dotClass}`}
                  />
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                    {card.label}
                  </p>
                </div>
                <p
                  className={`mt-3 font-serif text-3xl font-semibold tracking-tight tabular-nums md:text-[2.25rem] ${
                    isZero ? "text-stone-400" : "text-stone-50"
                  }`}
                >
                  {loading ? (
                    <span className="inline-block h-8 w-10 animate-pulse rounded bg-stone-700/60" />
                  ) : (
                    value
                  )}
                </p>
                <p className="mt-1 text-[11px] text-stone-400">{card.hint}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
