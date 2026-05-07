"use client";

// Seção "Para quem é"
// Fonte primária: GET /api/public/drones/sections/who.
// Cards segmentados com badge de modelo recomendado quando aplicável.
// Layout 2x3 (tablet) / 3x2 (desktop) com ar para respirar.

import { useDronesSection, type DroneSectionItem } from "@/hooks/useDronesSection";
import { getSectionIcon } from "@/lib/drones/sectionIcons";

const FALLBACK_ITEMS: DroneSectionItem[] = [
  {
    icon: "Sprout",
    title: "Pequenas e médias propriedades",
    text: "Lavouras até 300 ha, agricultura familiar, relevo variado. Drone compacto, transporte em picape.",
    badge: "T25P",
  },
  {
    icon: "Tractor",
    title: "Grandes lavouras",
    text: "Fazendas acima de 500 ha. Pulverização em alta vazão para cobrir mais área na janela de safra.",
    badge: "T70P / T100",
  },
  {
    icon: "Wrench",
    title: "Prestadores de serviço",
    text: "Vive de pulverização terceirizada? O drone amplia o mix e o raio de atendimento da operação.",
    badge: "T70P / T100",
  },
  {
    icon: "Users",
    title: "Cooperativas",
    text: "Frota compartilhada entre associados, rastreabilidade por lote, contratos por talhão.",
  },
  {
    icon: "Building2",
    title: "Empresas do agro",
    text: "Consultorias, revendas e integradores que querem oferecer serviço aéreo como diferencial.",
  },
];

const FALLBACK = {
  title: "Cabe na sua operação, do pequeno ao grande",
  subtitle:
    "Não importa o tamanho da propriedade — tem um modelo da linha DJI Agras para a sua realidade.",
  items: FALLBACK_ITEMS,
};

export default function WhoIsFor() {
  const { title, subtitle, items } = useDronesSection("who", FALLBACK);

  return (
    <section className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
            Para quem é
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.6rem]">
            {title || FALLBACK.title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s, idx) => {
            const Icon = getSectionIcon(s.icon);
            return (
              <article
                key={`${s.title}-${idx}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[rgba(8,12,22,0.55)] p-5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[rgba(10,16,28,0.7)]"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-12 -right-8 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl opacity-0 transition group-hover:opacity-70"
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  {s.badge ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-200">
                      {s.badge}
                    </span>
                  ) : null}
                </div>

                <h3 className="relative mt-4 text-[15px] font-extrabold tracking-tight text-white">
                  {s.title}
                </h3>
                {s.text ? (
                  <p className="relative mt-1.5 text-[13px] leading-relaxed text-slate-300">
                    {s.text}
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
