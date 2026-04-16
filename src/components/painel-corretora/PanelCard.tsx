// src/components/painel-corretora/PanelCard.tsx
//
// Superfície premium da Sala Reservada. Todos os cards do painel
// passam por aqui para garantir material consistente:
//
//   - hairline ring quente (stone-900 @ 6% opacidade)
//   - sombra warm-tinted (stone-900 @ 4%)
//   - highlight de topo: uma linha de 1px cruzando o topo com gradiente
//     from-transparent → via-white → to-transparent, simulando luz
//     caindo sobre a superfície
//   - densidade configurável (compact / default / spacious)
//
// Esses detalhes são o que separa "card default Tailwind" de
// "card de produto premium". Nenhum deles é caro em performance.

import type { ReactNode, HTMLAttributes } from "react";

type Density = "compact" | "default" | "spacious";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  density?: Density;
  /** Variante com ring mais presente e sombra maior (para hero cards). */
  elevated?: boolean;
  /** Remove o padding interno (útil quando o card envolve um <ul>/table). */
  flush?: boolean;
  /** Ring de destaque colorido (usado pelo card "Novos" quando há leads). */
  accent?: "amber" | "none";
};

const densityMap: Record<Density, string> = {
  compact: "p-4",
  default: "p-5 md:p-6",
  spacious: "p-6 md:p-8",
};

export function PanelCard({
  children,
  density = "default",
  elevated = false,
  flush = false,
  accent = "none",
  className = "",
  ...rest
}: Props) {
  const ring = elevated
    ? "ring-1 ring-white/[0.08]"
    : "ring-1 ring-white/[0.06]";
  const shadow = elevated
    ? "shadow-lg shadow-black/30"
    : "shadow-sm shadow-black/20";
  const accentRing =
    accent === "amber"
      ? "ring-2 ring-amber-500/60"
      : "";
  const padding = flush ? "" : densityMap[density];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-stone-900 ${ring} ${shadow} ${accentRing} ${padding} ${className}`}
      {...rest}
    >
      {/* Highlight de topo — luz caindo sobre a superfície */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
      />
      {children}
    </div>
  );
}
