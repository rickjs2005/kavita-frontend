"use client";

// Seção que envolve os cards dos modelos DJI Agras.
//
// Layout responsivo:
// - Mobile/tablet: carrossel horizontal com snap + setas escondidas
// - Desktop (lg+): grid de 3 colunas (um card por modelo visível de uma vez)
// - Fundo com gradientes radiais que dão sensação de "showroom"
// - Header comercial com título forte + subtítulo + CTA "Fale com especialista"
//
// Substitui a ModelsCarouselSection inline no DronesClient, que usava
// o ModelCard antigo.

import { useRef } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
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
  onTalkToRepGeneric,
  onTalkToRepForModel,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  function scrollByCards(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.85) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  if (!entries.length) return null;

  return (
    <section id="drones-models" className="relative scroll-mt-24 py-14 sm:py-20">
      <style>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Fundo vivo — halos radiais sutis dão sensação de showroom premium */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[10%] top-0 h-64 w-[28rem] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[8%] top-[30%] h-72 w-[32rem] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute left-[35%] bottom-0 h-60 w-[26rem] rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5">
        {/* Header comercial */}
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
              Linha DJI Agras · Representante autorizado Kavita
            </p>
            <h2 className="mt-3 text-2xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-3xl md:text-4xl">
              Três drones, uma decisão técnica simples
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
              Cada modelo foi pensado para uma escala diferente de operação —
              do pequeno produtor que vai transportar na picape até o
              prestador de serviço que cobre centenas de hectares por dia.
            </p>
          </div>

          <button
            onClick={onTalkToRepGeneric}
            className="group inline-flex items-center justify-center gap-2 self-start rounded-full border border-emerald-400/35 bg-emerald-500/10 px-5 py-3 text-sm font-extrabold text-emerald-200 transition hover:bg-emerald-500/20 md:self-end"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Fale com especialista
          </button>
        </div>

        {/* Container: grid no desktop, carrossel no mobile/tablet */}
        <div className="relative mt-8">
          {/* Setas só aparecem em telas médias pra cima (onde o carrossel
              ainda faz sentido antes de virar grid). No desktop grande
              todos os cards aparecem juntos, setas ficam ocultas. */}
          <div className="mb-4 flex items-center justify-end gap-2 lg:hidden">
            <button
              onClick={() => scrollByCards(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label="Modelo anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              onClick={() => scrollByCards(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label="Próximo modelo"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div
            ref={scrollerRef}
            className={[
              // Mobile/tablet: scroll horizontal com snap
              "no-scrollbar flex gap-5 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory pb-2",
              // Desktop: grid de 3 colunas (um card por coluna) — cabem
              // lado a lado sem scroll. lg:overflow-visible desativa
              // o overflow que travaria em grid.
              "lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0",
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

          {/* Hint de navegação mobile */}
          <p className="mt-3 text-center text-[11px] text-slate-400 lg:hidden">
            No celular, arraste para o lado · No desktop, veja todos juntos
          </p>
        </div>
      </div>
    </section>
  );
}
