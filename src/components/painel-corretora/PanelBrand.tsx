// src/components/painel-corretora/PanelBrand.tsx
//
// Brand mark exclusivo da Sala Reservada (área privada da corretora).
// SVG geométrico abstrato inspirado em grão de café — rotacionado 18°,
// preenchimento em currentColor para adaptar a light/dark, com um traço
// interno semi-transparente que simula a fenda central do grão.
//
// Não é figurativo. É um signo sutil, monocromático, que aparece no
// login, no header do painel e nos estados vazios. Uso disciplinado.

import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function PanelBrandMark({ title = "Kavita", ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      {...rest}
    >
      <g transform="rotate(-18 16 16)">
        <ellipse cx="16" cy="16" rx="8" ry="11" fill="currentColor" />
        <path
          d="M 11 7 Q 16 16 21 25"
          stroke="white"
          strokeOpacity={0.4}
          strokeWidth={1.2}
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
  tone?: "light" | "dark";
};

/**
 * Brand lockup completo: mark + wordmark "KAVITA" + divisor + kicker
 * "SALA RESERVADA". Componente usado como cabeçalho no nav e nos
 * auth screens para garantir identidade consistente.
 */
export function PanelBrand({ className = "", tone = "dark" }: WordmarkProps) {
  const markColor =
    tone === "light" ? "text-stone-100" : "text-stone-900";
  const wordColor =
    tone === "light" ? "text-stone-100" : "text-stone-900";
  const kickerColor =
    tone === "light" ? "text-stone-400" : "text-stone-500";
  const dividerColor =
    tone === "light" ? "bg-stone-700" : "bg-stone-300";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex h-7 w-7 items-center justify-center ${markColor}`}>
        <PanelBrandMark className="h-full w-full" />
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`text-sm font-semibold tracking-[0.2em] ${wordColor}`}
        >
          KAVITA
        </span>
        <span
          aria-hidden
          className={`hidden h-4 w-px ${dividerColor} sm:block`}
        />
        <span
          className={`hidden text-[10px] font-semibold uppercase tracking-[0.22em] ${kickerColor} sm:block`}
        >
          Sala Reservada
        </span>
      </div>
    </div>
  );
}
