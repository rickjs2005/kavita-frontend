"use client";

// Seção "Por que usar drones agrícolas?"
// Fonte primária: GET /api/public/drones/sections/why (hook).
// Fallback: lista estática abaixo — preserva landing funcional se a
// API falhar ou se admin ainda não cadastrou itens.

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
    text: "Aplicação com taxa variável por mapa de prescrição. Economia de insumo de até 30% em relação ao pulverizador convencional.",
  },
  {
    icon: "Leaf",
    title: "Menos desperdício",
    text: "Bicos calibrados e radar embarcado garantem cobertura uniforme mesmo em terreno irregular, sem sobreposição.",
  },
  {
    icon: "MapPin",
    title: "Acesso a áreas difíceis",
    text: "Opera em relevo acidentado, baixadas alagadas e lavouras já crescidas — lugares onde máquina terrestre não entra.",
  },
  {
    icon: "CloudLightning",
    title: "Operação noturna",
    text: "Sensores e câmeras FPV permitem aplicar à noite, aproveitando a janela de menor evaporação e mais estabilidade do vento.",
  },
  {
    icon: "ShieldCheck",
    title: "Segurança no campo",
    text: "Operador fora da deriva e fora do sol forte. Desvio automático de obstáculos (torres, cercas, árvores).",
  },
];

const FALLBACK = {
  title: "Tecnologia que vira produtividade no campo",
  subtitle:
    "Pulverização aérea deixou de ser só modernismo — virou argumento de produtividade. Menos insumo, menos tempo, mais controle sobre a aplicação.",
  items: FALLBACK_ITEMS,
};

export default function WhyDrones() {
  const { title, subtitle, items } = useDronesSection("why", FALLBACK);

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Por que usar drones agrícolas
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
            {title || FALLBACK.title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r, idx) => {
            const Icon = getSectionIcon(r.icon);
            return (
              <div
                key={`${r.title}-${idx}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-emerald-400/25 hover:bg-white/[0.05]"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-3 text-sm font-extrabold text-white">
                  {r.title}
                </h3>
                {r.text ? (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">
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
