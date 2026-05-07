"use client";

// Vitrine completa dos 3 modelos DJI Agras (T25P / T70P / T100).
// Substitui o lineup compacto do hero pela versão expandida com
// descrição, specs reais e dois CTAs por modelo. Usa
// ModelShowcaseCard (cinematográfico, accent por modelo).

import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
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
    <section
      id="drones-models"
      className="relative scroll-mt-24 py-16 sm:py-24"
    >
      {/* Halos accent triplos posicionais (cyan/emerald/amber) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-10 h-72 w-[28rem] rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute right-[10%] top-[35%] h-80 w-[32rem] rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="absolute left-[40%] bottom-0 h-64 w-[26rem] rounded-full bg-amber-500/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5">
        {/* Header editorial — não compete com o hero, só diferencia a seção */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
            A linha
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.6rem]">
            Três drones, uma decisão técnica simples
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Cada modelo foi pensado para uma escala diferente de operação —
            do pequeno produtor que transporta na picape ao prestador de
            serviço que cobre centenas de hectares por dia.
          </p>

          <div className="mt-6 inline-flex items-center gap-3">
            <button
              type="button"
              onClick={onTalkToRepGeneric}
              className="group inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-extrabold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              Fale com especialista
              <ArrowRight
                className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
          </div>
        </div>

        {/* Grid desktop / scroll mobile */}
        <div className="relative mt-12">
          {/* Setas em mobile/tablet */}
          <div className="mb-4 flex items-center justify-end gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => scrollByCards(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label="Modelo anterior"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
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
              "flex gap-5 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory pb-2 scrollbar-hide",
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

          <p className="mt-3 text-center text-[11px] text-slate-500 lg:hidden">
            Arraste para o lado para comparar
          </p>
        </div>
      </div>
    </section>
  );
}
