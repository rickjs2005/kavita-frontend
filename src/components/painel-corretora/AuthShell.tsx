// src/components/painel-corretora/AuthShell.tsx
//
// Shell das telas de auth da Sala Reservada (login, esqueci-senha,
// resetar-senha). Backdrop escuro stone-950 com um warm glow no topo
// (gradiente amber-950) e o brand mark centrado acima do slot do card.
//
// A metáfora: a corretora "entra da escuridão para a luz" — dark no
// login, light no painel interno. O card flutua no escuro como uma
// mesa iluminada, dando sensação de exclusividade.

import type { ReactNode } from "react";
import Link from "next/link";
import { PanelBrandMark } from "./PanelBrand";
import { GrainOverlay } from "./GrainOverlay";

type Props = {
  children: ReactNode;
  /** Texto do kicker acima do título. Default: "Sala Reservada" */
  kicker?: string;
  /** Título grande exibido abaixo do brand mark. */
  title: string;
  /** Subtítulo curto abaixo do título. */
  subtitle?: string;
};

export function AuthShell({
  children,
  kicker = "Sala Reservada",
  title,
  subtitle,
}: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-100">
      {/* Warm radial glow no topo — luz de candelabro */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-gradient-to-b from-amber-950/40 via-amber-950/10 to-transparent"
      />
      {/* Vinheta inferior para aprofundar a atmosfera */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-black/60 to-transparent"
      />

      {/* Textura de grão em mix-blend-screen — realça highlights em dark */}
      <GrainOverlay tone="dark" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        {/* Brand lockup — mark + kicker + título */}
        <header className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center text-stone-100">
            <PanelBrandMark className="h-full w-full" />
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/70">
            {kicker}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-50 sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-sm text-sm text-stone-400">{subtitle}</p>
          )}
        </header>

        {/* Card slot — sempre centrado, largura controlada */}
        <section className="w-full max-w-[26rem]">{children}</section>

        {/* Atalho de volta para a loja Kavita. Discreto, mas sempre
            visível — dá saída clara para quem abriu o link sem querer
            ou quer voltar ao site público sem ter que manipular a URL. */}
        <Link
          href="/"
          className="group mt-8 inline-flex items-center gap-2 rounded-full border border-stone-800 bg-stone-900/50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300 backdrop-blur-sm transition-colors hover:border-amber-200/30 hover:bg-stone-900/80 hover:text-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/40 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="transition-transform group-hover:-translate-x-0.5"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
          Voltar à loja Kavita
        </Link>

        {/* Footer sutil com wordmark completo */}
        <footer className="mt-6 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">
          <span>Kavita</span>
          <span aria-hidden className="h-px w-6 bg-stone-700" />
          <span>Mercado do Café</span>
        </footer>
      </div>
    </main>
  );
}
