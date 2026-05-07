"use client";

// Seção "Por que usar drones agrícolas?"
// Fonte primária: GET /api/public/drones/sections/why (hook).
// Fallback: lista estática abaixo. Visual SaaS premium agro — bullets
// com glow accent, hierarquia forte, sem o "wall of cards" antigo.

import { useDronesSection, type DroneSectionItem } from "@/hooks/useDronesSection";
import { getSectionIcon } from "@/lib/drones/sectionIcons";

const FALLBACK_ITEMS: DroneSectionItem[] = [
  {
    icon: "Timer",
    title: "Economia de tempo",
    text: "Até 20 hectares por hora em pulverização. Uma pessoa faz em 1 dia o que tomaria semanas no trator.",
  },
  {
    icon: "Gauge",
    title: "Precisão milimétrica",
    text: "Aplicação com taxa variável por mapa de prescrição. Economia de insumo de até 30%.",
  },
  {
    icon: "Leaf",
    title: "Menos desperdício",
    text: "Bicos calibrados e radar embarcado garantem cobertura uniforme — sem sobreposição.",
  },
  {
    icon: "MapPin",
    title: "Acesso a áreas difíceis",
    text: "Opera em relevo acidentado, baixadas alagadas e lavouras crescidas — onde máquina terrestre não entra.",
  },
  {
    icon: "CloudLightning",
    title: "Operação noturna",
    text: "Sensores e câmeras FPV permitem aplicar à noite, na janela de menor evaporação e mais estabilidade do vento.",
  },
  {
    icon: "ShieldCheck",
    title: "Segurança no campo",
    text: "Operador fora da deriva e fora do sol forte. Desvio automático de torres, cercas e árvores.",
  },
];

const FALLBACK = {
  title: "Tecnologia que vira produtividade no campo",
  subtitle:
    "Pulverização aérea deixou de ser modernismo — virou argumento de produtividade. Menos insumo, menos tempo, mais controle sobre a aplicação.",
  items: FALLBACK_ITEMS,
};

export default function WhyDrones() {
  const { title, subtitle, items } = useDronesSection("why", FALLBACK);

  return (
    <section className="relative py-16 sm:py-24">
      {/* Halo accent emerald sutil de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
            Por que pulverizar com drone
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

        {/* Grid mais respirado, divisores sutis em vez de cards independentes */}
        <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-12">
          {items.map((r, idx) => {
            const Icon = getSectionIcon(r.icon);
            return (
              <div
                key={`${r.title}-${idx}`}
                className="group relative"
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300 transition group-hover:scale-105 group-hover:border-emerald-400/40">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-extrabold tracking-tight text-white">
                  {r.title}
                </h3>
                {r.text ? (
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-300/90">
                    {r.text}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
