"use client";

// Faixa de métricas-chave logo abaixo do hero.
// Renderiza 1 a 5 cards com número grande + label pequeno.
// Desktop: grid 2-3-5 colunas. Mobile: scroll horizontal com snap.

import type { Accent } from "./accent";

export type Metric = { label: string; value: string };

type Props = {
  metrics: Metric[];
  accent: Accent;
};

export default function KeyMetrics({ metrics, accent }: Props) {
  if (!metrics.length) return null;

  // Quantas colunas no desktop? Até 5.
  const count = Math.min(metrics.length, 5);
  const lgCols =
    count === 5
      ? "lg:grid-cols-5"
      : count === 4
        ? "lg:grid-cols-4"
        : count === 3
          ? "lg:grid-cols-3"
          : count === 2
            ? "lg:grid-cols-2"
            : "lg:grid-cols-1";

  return (
    <section className="relative -mt-10 sm:-mt-14 lg:-mt-16 z-10 kvt-fade-up kvt-delay-2">
      <div className="mx-auto max-w-7xl px-5">
        <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-[rgba(8,12,22,0.78)] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {/* Halo accent superior */}
          <div
            aria-hidden
            className={[
              "pointer-events-none absolute -top-16 left-1/4 h-44 w-44 rounded-full blur-3xl opacity-60",
              accent.halo,
            ].join(" ")}
          />
          <div
            aria-hidden
            className={[
              "pointer-events-none absolute -bottom-16 right-1/4 h-44 w-44 rounded-full blur-3xl opacity-50",
              accent.halo,
            ].join(" ")}
          />

          {/* Mobile: scroll horizontal com snap */}
          <div className="relative flex snap-x snap-mandatory gap-0 overflow-x-auto scrollbar-hide sm:hidden">
            {metrics.slice(0, 5).map((m, i) => (
              <div
                key={`${m.label}-${i}`}
                className="snap-start shrink-0 basis-[60%] border-r border-white/8 px-5 py-5 last:border-r-0"
              >
                <MetricCell metric={m} accent={accent} />
              </div>
            ))}
          </div>

          {/* Desktop / tablet: grid */}
          <div
            className={[
              "relative hidden divide-x divide-white/8 sm:grid",
              "sm:grid-cols-2 md:grid-cols-3",
              lgCols,
            ].join(" ")}
          >
            {metrics.slice(0, 5).map((m, i) => (
              <div
                key={`${m.label}-${i}`}
                className="px-5 py-6 sm:px-6 sm:py-7 lg:px-7 lg:py-8 transition hover:bg-white/[0.02]"
              >
                <MetricCell metric={m} accent={accent} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCell({ metric, accent }: { metric: Metric; accent: Accent }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
        {metric.label}
      </div>
      <div
        className={[
          "mt-2 text-2xl sm:text-3xl lg:text-[2rem] font-extrabold leading-none tracking-tight",
          accent.text,
        ].join(" ")}
      >
        {metric.value}
      </div>
    </div>
  );
}
