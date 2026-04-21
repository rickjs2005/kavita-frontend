// src/components/painel-corretora/PanelOrnaments.tsx
//
// Ornamentos decorativos editoriais para a Sala Reservada. Traz
// identidade café de forma sutil e premium, sem cair em tema caricato.
//
// Componentes:
//   - BeanScatter: grãos de café dispersos em baixa opacidade (textura
//     de fundo para superfícies escuras)
//   - OrnamentalDivider: divisor editorial com grão central entre
//     hairlines (separador entre capítulos)
//   - MarketStrip: strip editorial no estilo "newspaper masthead" com
//     data, safra e mercado (contextualiza o broker)

import type { ReactNode } from "react";
import { PanelBrandMark } from "./PanelBrand";

// ===================================================================
// BeanScatter — textura de grãos dispersos sobre superfície dark.
// Cada grão tem rotação e opacidade diferentes para parecer orgânico.
// ===================================================================
export function BeanScatter({
  tone = "dark",
  density = "medium",
}: {
  tone?: "dark" | "light";
  density?: "light" | "medium" | "heavy";
}) {
  const baseOpacity = tone === "dark" ? "text-stone-700" : "text-stone-400";

  // Posições fixas calibradas para parecer casual mas equilibrado
  const beans =
    density === "heavy"
      ? [
          { top: "8%", left: "6%", size: "h-10 w-10", rotate: "14deg", op: "/15" },
          { top: "18%", right: "8%", size: "h-14 w-14", rotate: "-22deg", op: "/10" },
          { top: "42%", left: "12%", size: "h-8 w-8", rotate: "38deg", op: "/12" },
          { top: "55%", right: "18%", size: "h-12 w-12", rotate: "-8deg", op: "/8" },
          { bottom: "18%", left: "22%", size: "h-9 w-9", rotate: "52deg", op: "/10" },
          { bottom: "8%", right: "8%", size: "h-11 w-11", rotate: "-32deg", op: "/12" },
          { top: "68%", left: "44%", size: "h-7 w-7", rotate: "18deg", op: "/8" },
        ]
      : density === "medium"
        ? [
            { top: "12%", right: "10%", size: "h-12 w-12", rotate: "16deg", op: "/12" },
            { top: "48%", left: "8%", size: "h-10 w-10", rotate: "-28deg", op: "/10" },
            { bottom: "18%", right: "14%", size: "h-14 w-14", rotate: "42deg", op: "/10" },
            { bottom: "8%", left: "36%", size: "h-8 w-8", rotate: "-12deg", op: "/8" },
          ]
        : [
            { top: "20%", right: "12%", size: "h-10 w-10", rotate: "18deg", op: "/10" },
            { bottom: "14%", left: "14%", size: "h-12 w-12", rotate: "-28deg", op: "/8" },
          ];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {beans.map((b, i) => (
        <PanelBrandMark
          key={i}
          className={`absolute ${b.size} ${baseOpacity}${b.op}`}
          style={{
            top: b.top,
            left: b.left,
            right: b.right,
            bottom: b.bottom,
            transform: `rotate(${b.rotate})`,
          }}
        />
      ))}
    </div>
  );
}

// ===================================================================
// OrnamentalDivider — divisor editorial entre capítulos da página.
// Hairline amber + grão central + hairline amber. Cria ritmo sem
// adicionar peso visual significativo.
// ===================================================================
export function OrnamentalDivider({
  label,
}: {
  label?: string;
}) {
  return (
    <div
      aria-hidden
      className="flex items-center justify-center gap-3 py-1"
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-stone-700 to-stone-700" />
      <span className="flex items-center gap-2">
        <span className="h-0.5 w-0.5 rounded-full bg-amber-500/40" />
        <PanelBrandMark className="h-2.5 w-2.5 text-amber-500/40" />
        {label && (
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            {label}
          </span>
        )}
        <PanelBrandMark className="h-2.5 w-2.5 -scale-x-100 text-amber-500/40" />
        <span className="h-0.5 w-0.5 rounded-full bg-amber-500/40" />
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-stone-700 to-stone-700" />
    </div>
  );
}

// ===================================================================
// MarketStrip — strip editorial no estilo "masthead de jornal".
// Mostra data, safra e contexto de mercado. Posiciona a corretora
// dentro do ecossistema café sem virar decoração barata.
// ===================================================================
export function MarketStrip({ children }: { children: ReactNode }) {
  // Mobile: scroll horizontal discreto em vez de quebra de linha feia
  // (whitespace-nowrap + overflow-x-auto). Scrollbar-none mantém o
  // visual limpo quando o usuário arrasta.
  // Desktop (md+): comportamento original com flex-wrap — 4 itens
  // raramente extravasam, mas se acontecer, quebram.
  return (
    <div
      className="flex items-center gap-x-3 gap-y-1 overflow-x-auto whitespace-nowrap border-b border-white/[0.06] pb-3 text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-stone-400 md:flex-wrap md:overflow-visible md:whitespace-normal"
      style={{ scrollbarWidth: "none" }}
    >
      {children}
    </div>
  );
}

export function MarketStripItem({
  children,
  pulse = false,
  accent = false,
}: {
  children: ReactNode;
  pulse?: boolean;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        accent ? "text-amber-300" : ""
      }`}
    >
      {pulse && (
        <span aria-hidden className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-500/60" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-amber-500" />
        </span>
      )}
      {children}
    </span>
  );
}

export function MarketStripDivider() {
  return (
    <span aria-hidden className="text-stone-600">
      ·
    </span>
  );
}
