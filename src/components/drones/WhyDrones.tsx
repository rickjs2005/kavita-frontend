"use client";

// Seção "Por que usar drones agrícolas?"
// Educativa, voltada para produtor rural e prestador de serviço.
// Conteúdo estático (não depende do admin) — argumentos de venda
// padrão da categoria. Se amanhã o time comercial quiser editar,
// trocar por fetch do admin sem alterar o layout.

import {
  CloudLightning,
  Gauge,
  Leaf,
  MapPin,
  ShieldCheck,
  Timer,
} from "lucide-react";
import type { ReactNode } from "react";

type Reason = {
  icon: ReactNode;
  title: string;
  text: string;
};

const REASONS: Reason[] = [
  {
    icon: <Timer className="h-5 w-5" aria-hidden />,
    title: "Economia de tempo",
    text: "Até 20 hectares por hora em pulverização. Uma pessoa faz em 1 dia o que tomaria semanas no trator.",
  },
  {
    icon: <Gauge className="h-5 w-5" aria-hidden />,
    title: "Precisão milimétrica",
    text: "Aplicação com taxa variável por mapa de prescrição. Economia de insumo de até 30% em relação ao pulverizador convencional.",
  },
  {
    icon: <Leaf className="h-5 w-5" aria-hidden />,
    title: "Menos desperdício",
    text: "Bicos calibrados e radar embarcado garantem cobertura uniforme mesmo em terreno irregular, sem sobreposição.",
  },
  {
    icon: <MapPin className="h-5 w-5" aria-hidden />,
    title: "Acesso a áreas difíceis",
    text: "Opera em relevo acidentado, baixadas alagadas e lavouras já crescidas — lugares onde máquina terrestre não entra.",
  },
  {
    icon: <CloudLightning className="h-5 w-5" aria-hidden />,
    title: "Operação noturna",
    text: "Sensores e câmeras FPV permitem aplicar à noite, aproveitando a janela de menor evaporação e mais estabilidade do vento.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" aria-hidden />,
    title: "Segurança no campo",
    text: "Operador fora da deriva e fora do sol forte. Desvio automático de obstáculos (torres, cercas, árvores).",
  },
];

export default function WhyDrones() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Por que usar drones agrícolas
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
            Tecnologia que vira produtividade no campo
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Pulverização aérea deixou de ser só modernismo — virou argumento
            de produtividade. Menos insumo, menos tempo, mais controle sobre
            a aplicação.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((r) => (
            <div
              key={r.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-emerald-400/25 hover:bg-white/[0.05]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                {r.icon}
              </div>
              <h3 className="mt-3 text-sm font-extrabold text-white">
                {r.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">
                {r.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
