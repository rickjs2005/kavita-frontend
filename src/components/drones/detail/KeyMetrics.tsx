"use client";

// Faixa de métricas-chave exibida logo abaixo do hero na página de
// detalhe /drones/[id]. Tira 4 números de alto impacto (capacidade,
// vazão, largura, autonomia) das specs cadastradas no admin e mostra
// em formato "número grande + label pequeno".
//
// Se a spec não estiver cadastrada, o slot cai no fallback estático
// específico do modelo — evita a grade vazia.

import type { Accent } from "./accent";

export type Metric = { label: string; value: string };

type Props = {
  metrics: Metric[];
  accent: Accent;
};

export default function KeyMetrics({ metrics, accent }: Props) {
  if (!metrics.length) return null;

  return (
    <section className="relative -mt-8 sm:-mt-12">
      <div className="mx-auto max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-dark-850/80 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {/* Halo accent discreto */}
          <div
            className={[
              "pointer-events-none absolute -top-12 right-10 h-40 w-40 rounded-full blur-3xl opacity-50",
              accent.halo,
            ].join(" ")}
          />

          <div className="relative grid grid-cols-2 divide-x divide-white/8 sm:grid-cols-4">
            {metrics.map((m, i) => (
              <div
                key={`${m.label}-${i}`}
                className="px-5 py-5 sm:px-6 sm:py-6"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {m.label}
                </div>
                <div
                  className={[
                    "mt-1.5 text-xl sm:text-2xl font-extrabold leading-tight tracking-tight",
                    accent.text,
                  ].join(" ")}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
