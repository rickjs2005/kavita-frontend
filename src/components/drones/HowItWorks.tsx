"use client";

// Seção "Como funciona" — timeline horizontal premium em desktop,
// vertical em mobile. Numeração 01/02/... derivada do índice.
// Fonte primária: GET /api/public/drones/sections/how.

import { useDronesSection, type DroneSectionItem } from "@/hooks/useDronesSection";
import { getSectionIcon } from "@/lib/drones/sectionIcons";

const FALLBACK_ITEMS: DroneSectionItem[] = [
  {
    icon: "Search",
    title: "Diagnóstico",
    text: "Conte sua realidade: tamanho da área, cultura, relevo. O representante ouve antes de indicar.",
  },
  {
    icon: "Compass",
    title: "Escolha do modelo",
    text: "T25P para mobilidade, T70P para produtividade média-alta, T100 para operações grandes.",
  },
  {
    icon: "Sparkles",
    title: "Demonstração e orçamento",
    text: "Veja o drone voando em uma área real. Orçamento fechado com especificação e prazo.",
  },
  {
    icon: "GraduationCap",
    title: "Treinamento",
    text: "Você e sua equipe recebem capacitação para operar com segurança e fazer manutenção básica.",
  },
  {
    icon: "Plane",
    title: "Aplicação no campo",
    text: "Suporte continuado pelo representante regional: software, peças e dúvidas técnicas.",
  },
];

const FALLBACK = {
  title: "Do primeiro contato até a primeira aplicação",
  subtitle:
    "Não tem mistério. O caminho para operar drone agrícola é conversa, escolha do modelo, demo, treinamento e suporte.",
  items: FALLBACK_ITEMS,
};

export default function HowItWorks() {
  const { title, subtitle, items } = useDronesSection("how", FALLBACK);

  return (
    <section className="relative py-16 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
            Como funciona
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

        {/* Timeline horizontal desktop / vertical mobile */}
        <div className="relative mt-14">
          {/* Linha conectora desktop */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-[2.25rem] hidden h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent lg:block"
          />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4">
            {items.map((s, idx) => {
              const Icon = getSectionIcon(s.icon);
              return (
                <div key={`${s.title}-${idx}`} className="relative">
                  <div className="relative inline-flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-emerald-400/25 bg-[rgba(8,12,22,0.7)] backdrop-blur-md">
                    <Icon className="h-6 w-6 text-emerald-300" aria-hidden />
                    {/* Badge numérico */}
                    <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500 px-1.5 font-mono text-[10px] font-extrabold tabular-nums text-black">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[15px] font-extrabold tracking-tight text-white">
                    {s.title}
                  </h3>
                  {s.text ? (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300/90">
                      {s.text}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
