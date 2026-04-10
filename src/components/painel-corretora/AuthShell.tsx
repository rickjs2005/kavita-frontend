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
import { PanelBrandMark } from "./PanelBrand";

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

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
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

        {/* Footer sutil com wordmark completo */}
        <footer className="mt-10 flex items-center gap-3 text-[10px] font-medium uppercase tracking-[0.2em] text-stone-500">
          <span>Kavita</span>
          <span aria-hidden className="h-px w-6 bg-stone-700" />
          <span>Mercado do Café</span>
        </footer>
      </div>
    </main>
  );
}
