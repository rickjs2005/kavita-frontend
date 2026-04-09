"use client";

import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";

export default function HeroAtendimento() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-header via-secondary to-primary py-14 sm:py-20">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-white/5" />

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
          <HiOutlineChatBubbleLeftRight className="h-8 w-8 text-white" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Central de Atendimento
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
          Estamos aqui para ajudar. Tire suas duvidas, fale com nossa equipe
          ou encontre rapidamente a informacao que precisa.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Atendimento em horario comercial
          </span>
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm">
            Resposta em ate 24h uteis
          </span>
        </div>
      </div>
    </section>
  );
}
