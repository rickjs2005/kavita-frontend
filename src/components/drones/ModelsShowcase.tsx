"use client";

// Vitrine dos 3 modelos DJI Agras (T25P / T70P / T100).
// Inspiração: imagem de referência — 3 cards horizontais grandes
// lado-a-lado, cada um com texto à esquerda e drone à direita,
// background com tint accent por modelo (cyan/emerald/amber).

import { ArrowRight } from "lucide-react";
import ModelShowcaseCard, {
  type ModelShowcaseModel,
  type ModelShowcaseSpec,
} from "./ModelShowcaseCard";

export type ModelShowcaseEntry = {
  model: ModelShowcaseModel;
  badge: string;
  tagline: string;
  description: string;
  specs: ModelShowcaseSpec[];
};

type Props = {
  entries: ModelShowcaseEntry[];
  onOpenModel: (key: string) => void;
  onTalkToRepGeneric: () => void;
  onTalkToRepForModel: (key: string) => void;
};

export default function ModelsShowcase({
  entries,
  onOpenModel,
  onTalkToRepForModel,
}: Props) {
  if (!entries.length) return null;

  return (
    <section
      id="drones-models"
      className="relative scroll-mt-24 py-16 sm:py-20"
    >
      {/* Halos accent triplos posicionais (cyan/emerald/amber) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-[8%] top-10 h-72 w-[28rem] rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute right-[10%] top-[35%] h-80 w-[32rem] rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="absolute left-[40%] bottom-0 h-64 w-[26rem] rounded-full bg-amber-500/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5">
        {/* Header centralizado editorial */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
            Conheça os modelos DJI Agriculture
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-3xl md:text-[2.25rem]">
            Soluções para cada tipo de operação.
          </h2>
        </div>

        {/* Grid 3 colunas em desktop, scroll horizontal em mobile/tablet */}
        <div className="mt-12">
          <div
            className={[
              "flex gap-4 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide",
              "lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:pb-0",
            ].join(" ")}
          >
            {entries.map((e, i) => (
              <ModelShowcaseCard
                key={e.model.key}
                model={e.model}
                badge={e.badge}
                tagline={e.tagline}
                description={e.description}
                specs={e.specs}
                isFirst={i === 0}
                onOpen={onOpenModel}
                onTalkToRep={onTalkToRepForModel}
              />
            ))}
          </div>

          <p className="mt-3 text-center text-[11px] text-slate-500 lg:hidden">
            <ArrowRight className="mr-1 inline h-3 w-3" aria-hidden />
            Arraste para o lado
          </p>
        </div>
      </div>
    </section>
  );
}
