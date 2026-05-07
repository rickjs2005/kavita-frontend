"use client";

// Seção "Por que usar drones na sua operação?" — 5 cards horizontais.
// Inspiração: imagem de referência DJI showroom — eyebrow uppercase
// emerald, headline curto, 5 cards em linha (desktop) com ícone em
// pill e copy compacta.
//
// Fonte: GET /api/public/drones/sections/why (admin pode editar copy
// e itens). Fallback estático com 5 itens da referência.

import { useDronesSection, type DroneSectionItem } from "@/hooks/useDronesSection";
import { getSectionIcon } from "@/lib/drones/sectionIcons";

const FALLBACK_ITEMS: DroneSectionItem[] = [
  {
    icon: "Droplet",
    title: "Precisão total",
    text: "Aplicação uniforme com gotas controladas e menos desperdício.",
  },
  {
    icon: "Gauge",
    title: "Mais produtividade",
    text: "Cubra mais hectares em menos tempo com segurança.",
  },
  {
    icon: "ShieldCheck",
    title: "Segurança operacional",
    text: "Sensores inteligentes e sistemas avançados de desvio de obstáculos.",
  },
  {
    icon: "Leaf",
    title: "Sustentabilidade",
    text: "Uso racional de insumos e menor impacto ambiental.",
  },
  {
    icon: "Sparkles",
    title: "Melhor retorno",
    text: "Redução de custos operacionais e maior rentabilidade.",
  },
];

const FALLBACK = {
  title: "Mais eficiência, menos desperdício, melhores resultados.",
  subtitle: null as string | null,
  items: FALLBACK_ITEMS,
};

export default function WhyDrones() {
  const { title, items } = useDronesSection("why", FALLBACK);

  // Layout adaptativo: 5 cards em desktop, 2-3 em tablet, 1 em mobile.
  const colCount = items.length;
  const lgCols =
    colCount >= 5
      ? "lg:grid-cols-5"
      : colCount === 4
        ? "lg:grid-cols-4"
        : colCount === 3
          ? "lg:grid-cols-3"
          : colCount === 2
            ? "lg:grid-cols-2"
            : "lg:grid-cols-1";

  return (
    <section className="relative py-16 sm:py-20">
      {/* Halo accent sutil de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5">
        {/* Cabeçalho centralizado */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
            Por que usar drones na sua operação?
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-3xl md:text-[2.25rem]">
            {title || FALLBACK.title}
          </h2>
        </div>

        {/* Grid de cards horizontais */}
        <div className={["mt-12 grid gap-3 sm:grid-cols-2 md:grid-cols-3", lgCols].join(" ")}>
          {items.map((r, idx) => {
            const Icon = getSectionIcon(r.icon);
            return (
              <article
                key={`${r.title}-${idx}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.55)] p-5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-[rgba(10,16,28,0.7)]"
              >
                {/* Halo accent on hover */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-12 -right-8 h-36 w-36 rounded-full bg-emerald-500/12 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />

                {/* Ícone em pill */}
                <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300 transition group-hover:scale-105 group-hover:border-emerald-400/45">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>

                <h3 className="relative mt-4 text-[15px] font-extrabold tracking-tight text-white">
                  {r.title}
                </h3>
                {r.text ? (
                  <p className="relative mt-1.5 text-[13px] leading-relaxed text-slate-300/90">
                    {r.text}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
