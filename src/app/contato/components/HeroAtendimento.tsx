"use client";

import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineCheckBadge,
} from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";
import { trackContatoEvent } from "../trackContatoEvent";

type Props = {
  whatsappUrl?: string;
};

export default function HeroAtendimento({ whatsappUrl }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-header via-teal-dark to-secondary">
      {/* Pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Glow accents */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-teal-light/10 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-14 sm:pb-20 sm:pt-20">
        <div className="text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-1.5 text-xs font-medium tracking-wide text-white/80 backdrop-blur-sm">
            <HiOutlineChatBubbleLeftRight className="h-3.5 w-3.5" />
            Central de Ajuda Kavita
          </div>

          <h1 className="text-3xl font-extrabold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-[3.25rem]">
            Precisa de ajuda?
            <br />
            <span className="text-teal-light">Estamos com voce.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Tire duvidas sobre pedidos, entregas, trocas ou pagamentos.
            Nossa equipe responde rapido para voce resolver tudo sem complicacao.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackContatoEvent("whatsapp_hero_click")}
                className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-header shadow-lg shadow-black/10 transition hover:bg-gray-50 active:scale-[0.98] sm:w-auto"
              >
                <FaWhatsapp className="h-5 w-5 text-green-600" />
                Falar pelo WhatsApp
              </a>
            )}
            <a
              href="#formulario"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.15] active:scale-[0.98] sm:w-auto"
            >
              Enviar mensagem
            </a>
          </div>
        </div>

        {/* Trust pills */}
        <div className="mx-auto mt-10 flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[13px] text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Atendimento ativo agora
          </span>
          <span className="flex items-center gap-1.5">
            <HiOutlineClock className="h-3.5 w-3.5" />
            Seg a sex, 8h as 18h
          </span>
          <span className="flex items-center gap-1.5">
            <HiOutlineCheckBadge className="h-3.5 w-3.5" />
            Resposta em ate 24h
          </span>
        </div>
      </div>
    </section>
  );
}
