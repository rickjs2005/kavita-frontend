"use client";

// Seção "Como funciona"
// Desmistifica o processo — produtor descobre que não tem mistério:
// fala com representante, escolhe modelo, faz demo, recebe treinamento,
// aplica em campo. Cinco passos numerados com ícones.

import {
  Compass,
  GraduationCap,
  Plane,
  Search,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

type Step = {
  number: string;
  icon: ReactNode;
  title: string;
  text: string;
};

const STEPS: Step[] = [
  {
    number: "01",
    icon: <Search className="h-5 w-5" aria-hidden />,
    title: "Diagnóstico",
    text: "Conte sua realidade: tamanho da área, cultura, relevo. O representante ouve antes de indicar.",
  },
  {
    number: "02",
    icon: <Compass className="h-5 w-5" aria-hidden />,
    title: "Escolha do modelo",
    text: "T25P para mobilidade e propriedades menores, T70P para produtividade média-alta, T100 para operações grandes.",
  },
  {
    number: "03",
    icon: <Sparkles className="h-5 w-5" aria-hidden />,
    title: "Demonstração e orçamento",
    text: "Veja o drone voando em uma área real. Orçamento fechado com especificação, prazo e condição de pagamento.",
  },
  {
    number: "04",
    icon: <GraduationCap className="h-5 w-5" aria-hidden />,
    title: "Treinamento",
    text: "Você e sua equipe recebem capacitação para operar com segurança e manutenção básica do equipamento.",
  },
  {
    number: "05",
    icon: <Plane className="h-5 w-5" aria-hidden />,
    title: "Aplicação no campo",
    text: "Suporte continuado pelo representante regional: atualização de software, peças e dúvidas técnicas.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Como funciona
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
            Do primeiro contato até a primeira aplicação
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Não tem mistério. O caminho para operar drone agrícola é
            conversa, escolha do modelo, demo, treinamento e suporte.
          </p>
        </div>

        <div className="relative mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s) => (
            <div
              key={s.number}
              className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-5"
            >
              <div className="absolute -top-3 left-5 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-200">
                {s.number}
              </div>
              <div className="mt-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                {s.icon}
              </div>
              <h3 className="mt-3 text-sm font-extrabold text-white">
                {s.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
