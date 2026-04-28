// src/components/mercado-do-cafe/CorretoraContactChannels.tsx
"use client";

// Lista de canais de contato da corretora. Dois variants:
//
//   - "compact": usado dentro do CorretoraCard na listagem. Cada canal
//     vira uma pill button pequena com ícone SVG.
//   - "full": usado na página de detalhe. Cada canal vira uma linha
//     grande com ícone destacado, rótulo principal, ação secundária
//     e um "Abrir →" animado. WhatsApp, quando presente, recebe um
//     tratamento primário em tom esmeralda (canal mais usado no agro).
//
// Design premium: paleta stone, hairline rings, ícones Lucide-style
// inline (NUNCA emoji), hover com feedback coeso com o resto do módulo.

import type { ReactElement } from "react";
import type { PublicCorretora } from "@/types/corretora";

// ─── Ícones SVG inline (Lucide-style, stroke 1.8) ─────────────────
// Reutilizados entre variants. Cor via currentColor no parent.

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<
  "whatsapp" | "phone" | "email" | "website" | "instagram" | "facebook",
  (size: number) => ReactElement
> = {
  whatsapp: (size) => (
    <svg width={size} height={size} {...iconProps}>
      <path d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21" />
      <path d="M9 10a.5.5 0 001 0V9a.5.5 0 00-1 0v1a5 5 0 005 5h1a.5.5 0 000-1h-1a.5.5 0 000 1" />
    </svg>
  ),
  phone: (size) => (
    <svg width={size} height={size} {...iconProps}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  ),
  email: (size) => (
    <svg width={size} height={size} {...iconProps}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  ),
  website: (size) => (
    <svg width={size} height={size} {...iconProps}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
    </svg>
  ),
  instagram: (size) => (
    <svg width={size} height={size} {...iconProps}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  facebook: (size) => (
    <svg width={size} height={size} {...iconProps}>
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
};

type ChannelKey = keyof typeof ICONS;

type Channel = {
  key: ChannelKey;
  label: string;
  detail: string;
  href: string;
  actionLabel: string;
};

function buildChannels(c: PublicCorretora): Channel[] {
  const channels: Channel[] = [];

  if (c.whatsapp) {
    const num = c.whatsapp.replace(/\D/g, "");
    channels.push({
      key: "whatsapp",
      label: "WhatsApp",
      detail: c.whatsapp,
      href: `https://wa.me/55${num}`,
      actionLabel: "Abrir conversa",
    });
  }

  if (c.phone) {
    channels.push({
      key: "phone",
      label: "Telefone",
      detail: c.phone,
      href: `tel:+55${c.phone.replace(/\D/g, "")}`,
      actionLabel: "Ligar agora",
    });
  }

  if (c.email) {
    channels.push({
      key: "email",
      label: "E-mail",
      detail: c.email,
      href: `mailto:${c.email}`,
      actionLabel: "Enviar mensagem",
    });
  }

  if (c.website) {
    const url = c.website.startsWith("http")
      ? c.website
      : `https://${c.website}`;
    channels.push({
      key: "website",
      label: "Site oficial",
      detail: c.website.replace(/^https?:\/\//, ""),
      href: url,
      actionLabel: "Visitar site",
    });
  }

  if (c.instagram) {
    const handle = c.instagram.startsWith("@")
      ? c.instagram
      : `@${c.instagram}`;
    const user = c.instagram
      .replace(/^@/, "")
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
    channels.push({
      key: "instagram",
      label: "Instagram",
      detail: handle,
      href: c.instagram.startsWith("http")
        ? c.instagram
        : `https://instagram.com/${user}`,
      actionLabel: "Ver perfil",
    });
  }

  if (c.facebook) {
    channels.push({
      key: "facebook",
      label: "Facebook",
      detail: "Perfil comercial",
      href: c.facebook.startsWith("http")
        ? c.facebook
        : `https://facebook.com/${c.facebook}`,
      actionLabel: "Ver página",
    });
  }

  return channels;
}

type Props = {
  corretora: PublicCorretora;
  variant?: "compact" | "full";
};

export function CorretoraContactChannels({
  corretora,
  variant = "full",
}: Props) {
  const channels = buildChannels(corretora);

  if (channels.length === 0) return null;

  // ─── Compact: usado nos cards da listagem ──────────────────────
  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {channels.map((ch) => (
          <a
            key={ch.key}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            title={ch.actionLabel}
            aria-label={`${ch.actionLabel} — ${corretora.name}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 transition-all hover:border-stone-900 hover:bg-stone-900 hover:text-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
          >
            {ICONS[ch.key](14)}
          </a>
        ))}
      </div>
    );
  }

  // ─── Full: usado na página de detalhe da corretora ─────────────
  //
  // Switchboard editorial: um único painel branco com hairlines finas
  // separando cada canal. Cada linha tem numeração 01–06 em mono-font
  // (truque editorial de Linear docs / Monocle), ícone em caixa sutil,
  // kicker uppercase com o tipo do canal, valor principal em peso
  // maior, e CTA com seta que desliza no hover. WhatsApp, quando
  // presente, é o canal primário — ganha um micro-ponto esmeralda
  // no número e um fundo stone-50 sutil. Sem cards empilhados,
  // sem shadows múltiplas, sem ring colorido. Minimalismo editorial.
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm">
      {/* Top highlight — amber catching light */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
      />
      <ul className="relative divide-y divide-white/[0.06]">
        {channels.map((ch, i) => {
          const isPrimary = ch.key === "whatsapp";
          const number = String(i + 1).padStart(2, "0");
          return (
            <li key={ch.key}>
              <a
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${ch.actionLabel} — ${corretora.name}`}
                className={`group flex items-center gap-3 px-4 py-3.5 transition-colors focus:outline-none focus-visible:bg-white/[0.06] sm:gap-4 sm:px-5 sm:py-4 md:gap-5 md:px-6 md:py-5 ${
                  isPrimary ? "bg-amber-400/[0.04]" : ""
                } hover:bg-white/[0.06]`}
              >
                {/* Number — editorial chapter mark. Oculto em telas <sm
                    pra liberar largura ao texto do canal. Em primary,
                    o micro-ponto amber migra pro kicker mobile. */}
                <span
                  aria-hidden
                  className="hidden shrink-0 items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500 sm:flex"
                >
                  {isPrimary && (
                    <span className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                  )}
                  {number}
                </span>

                {/* Icon box — dark glass, hover vira amber.
                    Mobile 36px (alvo bom), desktop 40px. */}
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] text-stone-300 ring-1 ring-white/10 transition-all group-hover:bg-amber-400 group-hover:text-stone-950 group-hover:ring-amber-300/50 sm:h-10 sm:w-10"
                >
                  {ICONS[ch.key](16)}
                </span>

                {/* Textos */}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                    {/* Micro-ponto amber no mobile pro canal primário
                        (compensa a numeração oculta). */}
                    {isPrimary && (
                      <span
                        aria-hidden
                        className="h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)] sm:hidden"
                      />
                    )}
                    <span>{ch.label}</span>
                    {isPrimary && (
                      <span className="text-amber-200">· Primário</span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] font-medium text-stone-100 sm:text-sm">
                    {ch.detail}
                  </p>
                </div>

                {/* CTA arrow */}
                <span
                  aria-hidden
                  className="shrink-0 text-stone-500 transition-all group-hover:translate-x-0.5 group-hover:text-amber-300"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
