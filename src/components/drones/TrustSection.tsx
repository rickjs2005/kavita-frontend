"use client";

// Seção "Por que escolher a Kavita" — pilares de confiança.
// Fonte primária: GET /api/public/drones/sections/trust.
// Visual SaaS premium: divisores verticais sutis, ícone check inline,
// nada de "wall of cards" pesado.

import { Check } from "lucide-react";
import { useDronesSection, type DroneSectionItem } from "@/hooks/useDronesSection";

const FALLBACK_ITEMS: DroneSectionItem[] = [
  {
    title: "Atendimento regional",
    text: "Representantes autorizados Kavita em cidades produtoras — contato humano, não call center.",
  },
  {
    title: "Suporte na escolha do modelo",
    text: "Orientação sobre qual DJI Agras cabe no tamanho da sua área, relevo e cultura.",
  },
  {
    title: "Contato direto por WhatsApp",
    text: "Fale diretamente com o representante da sua região, sem intermediários.",
  },
  {
    title: "Orientação antes da compra",
    text: "Tire dúvidas sobre operação, manutenção e treinamento antes de decidir.",
  },
];

const FALLBACK = {
  title: "Atendimento humano para uma decisão técnica",
  subtitle:
    "Drone agrícola é investimento sério. A Kavita oferece conversa direta com representante autorizado para você escolher com segurança o modelo certo para sua operação.",
  items: FALLBACK_ITEMS,
};

export default function TrustSection() {
  const { title, subtitle, items } = useDronesSection("trust", FALLBACK);

  return (
    <section className="relative py-16 sm:py-24">
      {/* Banner editorial — fundo glassmorphism com halo accent */}
      <div className="relative mx-auto max-w-7xl px-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-400/15 bg-[rgba(8,12,22,0.7)] p-8 backdrop-blur-md sm:p-12 lg:p-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-16 h-64 w-64 rounded-full bg-cyan-500/12 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-start lg:gap-14">
            {/* Coluna esquerda: cabeçalho */}
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
                Por que escolher a Kavita
              </p>
              <h2 className="mt-3 text-2xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl">
                {title || FALLBACK.title}
              </h2>
              {subtitle ? (
                <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {/* Coluna direita: pilares como bullet list premium */}
            <ul className="grid gap-4">
              {items.map((p, idx) => (
                <li
                  key={`${p.title}-${idx}`}
                  className="group flex items-start gap-3"
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/15 text-emerald-300 transition group-hover:scale-105">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[14px] font-extrabold text-white">
                      {p.title}
                    </h3>
                    {p.text ? (
                      <p className="mt-0.5 text-[13px] leading-relaxed text-slate-300/90">
                        {p.text}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
