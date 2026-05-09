// src/lib/heroIcons.tsx
//
// Catálogo central de ícones do CMS Hero. Compartilhado entre:
//   - Admin (form de criação/edição: seletor visual)
//   - Público (HeroCarousel: render do badge, features, quick_links)
//
// O backend valida que `badge_icon`, `features[].icon` e
// `quick_links[].icon` venham SEMPRE de HERO_ICON_KEYS — não aceita
// arbitrário (anti-XSS). Frontend mapeia key → SVG componente.
//
// Para adicionar novo ícone:
//   1. Adicionar a key em HERO_ICON_KEYS abaixo
//   2. Adicionar o componente em HERO_ICON_MAP
//   3. (opcional) atualizar o label em HERO_ICON_LABELS
//   4. Atualizar a lista em schemas/heroSlidesSchemas.js no backend

import type { JSX } from "react";

export const HERO_ICON_KEYS = [
  "leaf",
  "news",
  "chart-line",
  "drone",
  "bell",
  "shield",
  "cloud",
  "pie-chart",
  "truck",
  "wallet",
  "messages",
  "clock",
] as const;

export type HeroIconKey = (typeof HERO_ICON_KEYS)[number];

export const HERO_ICON_LABELS: Record<HeroIconKey, string> = {
  leaf: "Folha (sustentabilidade, café)",
  news: "Notícias (jornal)",
  "chart-line": "Gráfico de linha (mercado)",
  drone: "Drone",
  bell: "Sino (alertas)",
  shield: "Escudo (segurança)",
  cloud: "Nuvem (clima)",
  "pie-chart": "Gráfico pizza (gestão)",
  truck: "Caminhão (logística)",
  wallet: "Carteira (financeiro)",
  messages: "Mensagens (atendimento)",
  clock: "Relógio (tempo)",
};

type IconProps = { className?: string; size?: number };

function baseProps(size = 18, className = "") {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor" as const,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
}

function Leaf({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M20 4c-7 0-13 4-13 11 0 2.5 1.5 5 4 5 7 0 9-9 9-16z" />
      <path d="M7 20c2-4 5-7 9-9" />
    </svg>
  );
}

function News({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M4 5h13a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z" />
      <path d="M19 7h2v10a2 2 0 0 1-2 2" />
      <path d="M7 9h8M7 13h8M7 17h5" />
    </svg>
  );
}

function ChartLine({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M14 7h7v7" />
    </svg>
  );
}

function Drone({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="9" y="9" width="6" height="6" rx="1" />
      <circle cx="5" cy="5" r="2" />
      <circle cx="19" cy="5" r="2" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
      <path d="M7 7l2 2M17 7l-2 2M7 17l2-2M17 17l-2-2" />
    </svg>
  );
}

function Bell({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8z" />
      <path d="M10.5 21a2 2 0 0 0 3 0" />
    </svg>
  );
}

function Shield({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M12 3l8 3v6c0 4.5-3.2 8.5-8 10-4.8-1.5-8-5.5-8-10V6l8-3z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </svg>
  );
}

function Cloud({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M7 18a5 5 0 0 1 .5-9.95A6 6 0 0 1 19 9a4 4 0 0 1-1 7.87" />
      <path d="M9 14l-1 3M14 14l-1 3M11 16l-1 3" />
    </svg>
  );
}

function PieChart({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M21 12A9 9 0 1 1 12 3v9z" />
      <path d="M21 12a9 9 0 0 0-9-9v9z" />
    </svg>
  );
}

function Truck({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  );
}

function Wallet({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M3 7a2 2 0 0 1 2-2h13l3 3v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M16 13h2" />
      <path d="M3 9h18" />
    </svg>
  );
}

function Messages({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

function Clock({ size, className }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export const HERO_ICON_MAP: Record<
  HeroIconKey,
  (props: IconProps) => JSX.Element
> = {
  leaf: Leaf,
  news: News,
  "chart-line": ChartLine,
  drone: Drone,
  bell: Bell,
  shield: Shield,
  cloud: Cloud,
  "pie-chart": PieChart,
  truck: Truck,
  wallet: Wallet,
  messages: Messages,
  clock: Clock,
};

/**
 * Resolve uma key (vinda do banco) para o componente. Se a key não
 * estiver no catálogo, retorna o ícone default `leaf` em vez de quebrar.
 */
export function getHeroIcon(key?: string | null): (props: IconProps) => JSX.Element {
  if (key && (HERO_ICON_KEYS as readonly string[]).includes(key)) {
    return HERO_ICON_MAP[key as HeroIconKey];
  }
  return HERO_ICON_MAP.leaf;
}

export function isHeroIconKey(value: unknown): value is HeroIconKey {
  return (
    typeof value === "string" &&
    (HERO_ICON_KEYS as readonly string[]).includes(value)
  );
}
