"use client";

// Bloco narrativo após o hero na página de detalhe /drones/[id].
// Ancora o discurso comercial do modelo: para quem é, em que cenário
// se encaixa, o que entrega. Usa o MODEL_COPY.longDescription como
// texto principal e destaca 3 pontos-chave com accent por modelo.
//
// Não depende do admin — é conteúdo editorial fixo. Pensado pra dar
// peso antes do usuário bater nas specs técnicas.

import { Target, Zap, ShieldCheck } from "lucide-react";
import type { Accent } from "./accent";

type Pillar = { icon: "target" | "zap" | "shield"; title: string; text: string };

const PILLARS_BY_MODEL: Record<string, Pillar[]> = {
  t25p: [
    {
      icon: "target",
      title: "Pensado para pequenas propriedades",
      text: "Agricultura familiar, áreas até 300 ha e talhões recortados. Leveza e precisão.",
    },
    {
      icon: "zap",
      title: "Transporte ágil",
      text: "Cabe em picape comum. Sai da fazenda pro talhão em minutos — sem caminhão.",
    },
    {
      icon: "shield",
      title: "Relevo irregular",
      text: "Radar de onda milimétrica mantém altura constante em terreno acidentado.",
    },
  ],
  t70p: [
    {
      icon: "target",
      title: "Meio para grande porte",
      text: "Operação 300–800 ha/safra. Prestador de serviço, fazenda de médio porte.",
    },
    {
      icon: "zap",
      title: "Mais hectares por jornada",
      text: "70 kg de carga + autonomia longa = dia cheio sem trocar equipamento.",
    },
    {
      icon: "shield",
      title: "Taxa variável por mapa",
      text: "Aplica onde precisa, economiza onde não precisa. Reduz defensivo 20-30%.",
    },
  ],
  t100: [
    {
      icon: "target",
      title: "Alta vazão, grande escala",
      text: "Cooperativas, fazendas 800+ ha, prestadores de serviço profissionais.",
    },
    {
      icon: "zap",
      title: "Topo da linha DJI",
      text: "100 kg de carga, radar duplo, visão noturna. Janela operacional ampliada.",
    },
    {
      icon: "shield",
      title: "Operação intensiva",
      text: "Feito pra turno dobrado e safra apertada. Margem operacional robusta.",
    },
  ],
};

const PILLARS_DEFAULT: Pillar[] = [
  {
    icon: "target",
    title: "Atendimento regional",
    text: "Representantes Kavita em cidades produtoras. Contato direto por WhatsApp.",
  },
  {
    icon: "zap",
    title: "Tecnologia DJI",
    text: "Linha Agras homologada ANAC. Precisão de aplicação e economia de insumos.",
  },
  {
    icon: "shield",
    title: "Suporte pós-venda",
    text: "Treinamento na entrega, peças de reposição, manutenção preventiva.",
  },
];

function iconFor(name: Pillar["icon"], className: string) {
  if (name === "target") return <Target className={className} aria-hidden />;
  if (name === "zap") return <Zap className={className} aria-hidden />;
  return <ShieldCheck className={className} aria-hidden />;
}

type Props = {
  modelKey: string;
  longDescription: string;
  accent: Accent;
};

export default function ModelOverview({
  modelKey,
  longDescription,
  accent,
}: Props) {
  const pillars = PILLARS_BY_MODEL[modelKey.toLowerCase()] ?? PILLARS_DEFAULT;

  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          {/* Coluna esquerda — texto narrativo */}
          <div>
            <p
              className={[
                "font-mono text-[11px] font-semibold uppercase tracking-[0.24em]",
                accent.text,
              ].join(" ")}
            >
              Visão geral
            </p>
            <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-[1.1] tracking-tight text-white">
              Para quem é este modelo
            </h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300">
              {longDescription}
            </p>
          </div>

          {/* Coluna direita — 3 pilares */}
          <div className="grid gap-3">
            {pillars.map((p, i) => (
              <div
                key={i}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div
                  className={[
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    accent.badgeBorder,
                    accent.badgeBg,
                  ].join(" ")}
                >
                  {iconFor(p.icon, ["h-5 w-5", accent.text].join(" "))}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-white">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
                    {p.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
