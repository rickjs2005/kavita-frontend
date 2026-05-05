// src/components/painel-corretora/WhatsAppStatusBadge.tsx
//
// Etapa 5 da reativação WhatsApp (ver kavita-backend/docs/whatsapp-reativacao.md §10).
// Badge reusável para status de mensagem em qualquer card/lista do
// painel da corretora.
//
// Mapeia o enum do banco para 5 estados visuais distintos. queued e
// queued_stub compartilham aparência (em fila) porque para a UI da
// corretora a diferença é só operacional. manual_pending tem cor
// própria (âmbar) porque exige ação humana.

import type { ReactNode } from "react";

export type WhatsAppStatus =
  | "queued"
  | "queued_stub"
  | "manual_pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

type Props = {
  status: WhatsAppStatus;
  /** Quando true, esconde o ponto pulsante (estado terminal). */
  compact?: boolean;
};

type Variant = {
  label: string;
  className: string;
  dot: string;
  pulse: boolean;
};

const VARIANTS: Record<WhatsAppStatus, Variant> = {
  queued: {
    label: "Em fila",
    className:
      "bg-stone-800 text-stone-300 ring-1 ring-white/[0.08]",
    dot: "bg-stone-400",
    pulse: true,
  },
  queued_stub: {
    label: "Simulado",
    className:
      "bg-stone-800 text-stone-300 ring-1 ring-white/[0.08] italic",
    dot: "bg-stone-400",
    pulse: true,
  },
  manual_pending: {
    label: "Aguardando envio",
    className:
      "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/30",
    dot: "bg-amber-400",
    pulse: true,
  },
  sent: {
    label: "Enviado",
    className: "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30",
    dot: "bg-sky-400",
    pulse: false,
  },
  delivered: {
    label: "Entregue",
    className:
      "bg-emerald-500/12 text-emerald-200 ring-1 ring-emerald-400/25",
    dot: "bg-emerald-400",
    pulse: false,
  },
  read: {
    label: "Lido",
    className:
      "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40",
    dot: "bg-emerald-300",
    pulse: false,
  },
  failed: {
    label: "Falhou",
    className: "bg-red-500/15 text-red-200 ring-1 ring-red-400/30",
    dot: "bg-red-400",
    pulse: false,
  },
};

export function WhatsAppStatusBadge({ status, compact = false }: Props): ReactNode {
  const v = VARIANTS[status] || VARIANTS.queued;
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
        "text-[11px] font-semibold whitespace-nowrap",
        v.className,
      ].join(" ")}
      aria-label={`Status WhatsApp: ${v.label}`}
    >
      {!compact && (
        <span
          aria-hidden
          className={[
            "h-1.5 w-1.5 rounded-full",
            v.dot,
            v.pulse ? "animate-pulse" : "",
          ].join(" ")}
        />
      )}
      {v.label}
    </span>
  );
}

export default WhatsAppStatusBadge;
