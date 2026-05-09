// src/components/home/BenefitIcons.tsx
//
// SVG icons usados na faixa de benefícios da home pública (HomeClient).
// Estilo unificado: stroke 1.8, viewBox 24×24, currentColor — herda do
// container (text-emerald-700 + bg-emerald-50 nos círculos da home).
//
// Mantidos como componentes pequenos sem deps externas para evitar
// importar uma lib de ícones inteira só por 4 desenhos.

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

export function ShieldCheckIcon({ className, size }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M12 3l8 3v6c0 4.5-3.2 8.5-8 10-4.8-1.5-8-5.5-8-10V6l8-3z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </svg>
  );
}

export function WhatsAppIcon({ className, size }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M8.6 9.5c.2 1.6 1 3.1 2.2 4.3 1.2 1.2 2.7 2 4.3 2.2.5 0 .9-.4.9-.9v-1.1c0-.4-.2-.7-.6-.8l-1.4-.4a.8.8 0 0 0-.8.2l-.4.4a6.7 6.7 0 0 1-2.6-2.6l.4-.4a.8.8 0 0 0 .2-.8L9.4 8.2a.8.8 0 0 0-.8-.6H7.5c-.5 0-.9.4-.9.9 0 .3 0 .7.1 1z" />
    </svg>
  );
}

export function TruckIcon({ className, size }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </svg>
  );
}

export function LeafIcon({ className, size }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M20 4c-7 0-13 4-13 11 0 2.5 1.5 5 4 5 7 0 9-9 9-16z" />
      <path d="M7 20c2-4 5-7 9-9" />
    </svg>
  );
}
