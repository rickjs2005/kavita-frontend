// src/components/painel-corretora/GrainOverlay.tsx
//
// Textura de grão extremamente sutil, fixa na viewport, usada como
// camada de "material" sobre os fundos da Sala Reservada.
//
// Implementação: SVG fractal noise inline (feTurbulence) renderizado
// em data URI. Sem imagens, sem fontes, sem dependências. Zero custo
// de carregamento além dos ~350 bytes do SVG inline.
//
// A prop `tone` controla em qual fundo o grão vai viver:
//   - light: painel claro (stone-50) → grão escuro 4% via multiply
//   - dark: backdrop do login (stone-950) → grão claro 6% via screen
//
// Sempre pointer-events-none e aria-hidden para não interferir.

type Props = {
  tone?: "light" | "dark";
};

// SVG fractal noise. Opacity do noise (alpha do feColorMatrix) fica baixa
// — o efeito "subtle grain" vem da composição, não de alpha alto.
const GRAIN_SVG = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
    <filter id='n'>
      <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>
      <feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/>
    </filter>
    <rect width='100%' height='100%' filter='url(#n)'/>
  </svg>`
    .replace(/\s+/g, " ")
    .trim(),
);

const GRAIN_URL = `url("data:image/svg+xml,${GRAIN_SVG}")`;

export function GrainOverlay({ tone = "light" }: Props) {
  const style =
    tone === "light"
      ? {
          backgroundImage: GRAIN_URL,
          backgroundSize: "240px 240px",
          opacity: 0.06,
          mixBlendMode: "multiply" as const,
        }
      : {
          backgroundImage: GRAIN_URL,
          backgroundSize: "240px 240px",
          opacity: 0.12,
          mixBlendMode: "screen" as const,
        };

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={style}
    />
  );
}
