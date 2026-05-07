"use client";

// Seção "Benefícios para o operador" — antes "Por que pulverizar com
// drone". Layout horizontal premium conforme referência DJI showroom:
// 4 cards lado-a-lado, ícone à esquerda, título + descrição à direita.
// Fonte primária: GET /api/public/drones/sections/why (key mantida
// para preservar edições do admin existentes; copy agora foca no
// operador).

import { useDronesSection, type DroneSectionItem } from "@/hooks/useDronesSection";
import { getSectionIcon } from "@/lib/drones/sectionIcons";

const FALLBACK_ITEMS: DroneSectionItem[] = [
  {
    icon: "Leaf",
    title: "Economia",
    text: "Reduza o uso de insumos com aplicação precisa por mapa de prescrição.",
  },
  {
    icon: "Sprout",
    title: "Sustentabilidade",
    text: "Menor impacto ambiental e mais eficiência por hectare aplicado.",
  },
  {
    icon: "Gauge",
    title: "Produtividade",
    text: "Até 12 ha/h com máxima eficiência no campo, em qualquer condição.",
  },
  {
    icon: "ShieldCheck",
    title: "Segurança",
    text: "Operação segura com tecnologia confiável — operador fora da deriva.",
  },
];

const FALLBACK = {
  title: "Mais produtividade, menos esforço",
  subtitle: null as string | null,
  items: FALLBACK_ITEMS,
};

export default function WhyDrones() {
  const { title, items } = useDronesSection("why", FALLBACK);

  // Layout 4 cols quando temos 4 itens; 3 cols quando tem 3 ou 6;
  // 2 cols quando 2; 1 quando 1. Adapta sem ficar torto.
  const colCount = items.length;
  const lgCols =
    colCount >= 4
      ? "lg:grid-cols-4"
      : colCount === 3
        ? "lg:grid-cols-3"
        : colCount === 2
          ? "lg:grid-cols-2"
          : "lg:grid-cols-1";

  return (
    <section className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
            Benefícios para o operador
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl">
            {title || FALLBACK.title}
          </h2>
        </div>

        <div className={["mt-10 grid gap-3 sm:grid-cols-2", lgCols].join(" ")}>
          {items.map((r, idx) => {
            const Icon = getSectionIcon(r.icon);
            return (
              <article
                key={`${r.title}-${idx}`}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-[rgba(8,12,22,0.55)] p-5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-[rgba(10,16,28,0.7)]"
              >
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300 transition group-hover:scale-105 group-hover:border-emerald-400/50">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-extrabold tracking-tight text-white">
                    {r.title}
                  </h3>
                  {r.text ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-300/90">
                      {r.text}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
