"use client";

// Barra de métricas do case (até 6 itens) — visual HUD horizontal
// igual ao SpecBar do hero. Aparece sob a comparação antes/depois.
// Cada métrica: valor grande emerald + label uppercase + dica opcional.

import { Activity } from "lucide-react";
import type { DroneCaseMetric } from "@/types/drones";

type Props = {
  metrics: DroneCaseMetric[];
};

export default function CaseMetricsBar({ metrics }: Props) {
  if (!metrics || !metrics.length) return null;
  const slots = metrics.slice(0, 6).filter((m) => m.label || m.value);
  if (!slots.length) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.85)] backdrop-blur-md">
      {/* Halo accent decorativo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-12 -top-16 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -bottom-16 h-40 w-40 rounded-full bg-cyan-500/12 blur-3xl"
      />

      {/* Mobile: scroll horizontal com snap */}
      <div className="kvt-scroll-fade-r sm:hidden">
        <div className="relative flex snap-x snap-mandatory gap-0 overflow-x-auto scrollbar-hide">
          {slots.map((m, i) => (
            <Cell key={`${m.label}-${i}`} metric={m} className="snap-start shrink-0 basis-[68%] border-r border-white/8 last:border-r-0" />
          ))}
        </div>
      </div>

      {/* Desktop: grid divisores */}
      <div
        className={[
          "relative hidden divide-x divide-white/8 sm:grid",
          slots.length === 6
            ? "sm:grid-cols-3 lg:grid-cols-6"
            : slots.length === 5
              ? "sm:grid-cols-3 lg:grid-cols-5"
              : slots.length === 4
                ? "sm:grid-cols-2 lg:grid-cols-4"
                : slots.length === 3
                  ? "sm:grid-cols-3"
                  : slots.length === 2
                    ? "sm:grid-cols-2"
                    : "sm:grid-cols-1",
        ].join(" ")}
      >
        {slots.map((m, i) => (
          <Cell key={`${m.label}-${i}`} metric={m} />
        ))}
      </div>
    </div>
  );
}

function Cell({
  metric,
  className = "",
}: {
  metric: DroneCaseMetric;
  className?: string;
}) {
  return (
    <div
      className={[
        "flex items-start gap-2.5 px-4 py-4 transition hover:bg-white/[0.02]",
        className,
      ].join(" ")}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
        <Activity className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="text-base font-extrabold leading-tight text-emerald-300 sm:text-lg">
          {metric.value || "—"}
        </div>
        <div className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {metric.label || ""}
        </div>
        {metric.hint ? (
          <div className="mt-0.5 text-[11px] leading-snug text-slate-500">
            {metric.hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}
