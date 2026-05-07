"use client";

// Seção "Por que escolher a Kavita".
// Fonte primária: GET /api/public/drones/sections/trust.
// Fallback estático preserva landing se admin ainda não cadastrou itens.

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
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Por que escolher a Kavita
          </p>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {title || FALLBACK.title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p, idx) => (
            <div
              key={`${p.title}-${idx}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 className="mt-3 text-sm font-extrabold text-white">
                {p.title}
              </h3>
              {p.text ? (
                <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-slate-300">
                  {p.text}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
