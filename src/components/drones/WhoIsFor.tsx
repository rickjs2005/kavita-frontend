"use client";

// Seção "Para quem é"
// Segmenta o visitante. Produtor rural vê que tem opção para a sua
// escala; prestador de serviço vê que pode trabalhar com drones.

import { Building2, Sprout, Tractor, Users, Wrench } from "lucide-react";
import type { ReactNode } from "react";

type Segment = {
  icon: ReactNode;
  title: string;
  text: string;
  model?: string; // opcional: sugerir modelo DJI alinhado
};

const SEGMENTS: Segment[] = [
  {
    icon: <Sprout className="h-5 w-5" aria-hidden />,
    title: "Pequenas e médias propriedades",
    text: "Lavouras até 300 hectares, agricultura familiar, relevo variado. Drone compacto, transporte em picape.",
    model: "T25P",
  },
  {
    icon: <Tractor className="h-5 w-5" aria-hidden />,
    title: "Grandes lavouras",
    text: "Fazendas acima de 500 hectares. Pulverização em alta vazão para cobrir mais área na janela de safra.",
    model: "T70P / T100",
  },
  {
    icon: <Wrench className="h-5 w-5" aria-hidden />,
    title: "Prestadores de serviço",
    text: "Vive de pulverização terceirizada? O drone amplia o mix de serviços e o raio de atendimento da sua operação.",
    model: "T70P / T100",
  },
  {
    icon: <Users className="h-5 w-5" aria-hidden />,
    title: "Cooperativas",
    text: "Frota compartilhada entre associados, rastreabilidade por lote, contratos de aplicação por talhão.",
  },
  {
    icon: <Building2 className="h-5 w-5" aria-hidden />,
    title: "Empresas do agro",
    text: "Consultorias, revendas e integradores que querem oferecer serviço aéreo como diferencial.",
  },
];

export default function WhoIsFor() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Para quem é
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl md:text-3xl">
            Cabe na sua operação, do pequeno ao grande
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Não importa o tamanho da propriedade — tem um modelo da linha
            DJI Agras para a sua realidade. Fale com um representante para
            confirmar qual faz sentido.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SEGMENTS.map((s) => (
            <div
              key={s.title}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-emerald-400/25 hover:bg-white/[0.05]"
            >
              <div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                  {s.icon}
                </div>
                <h3 className="mt-3 text-sm font-extrabold text-white">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300">
                  {s.text}
                </p>
              </div>
              {s.model && (
                <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Modelo ideal: {s.model}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
