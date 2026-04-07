// src/components/mercado-do-cafe/CorretoraContactChannels.tsx
"use client";

import type { PublicCorretora } from "@/types/corretora";

type Channel = {
  key: string;
  label: string;
  icon: string;
  href: string;
  actionLabel: string;
};

function buildChannels(c: PublicCorretora): Channel[] {
  const channels: Channel[] = [];

  if (c.whatsapp) {
    const num = c.whatsapp.replace(/\D/g, "");
    channels.push({
      key: "whatsapp",
      label: c.whatsapp,
      icon: "📱",
      href: `https://wa.me/55${num}`,
      actionLabel: "Abrir WhatsApp",
    });
  }

  if (c.phone) {
    const num = c.phone.replace(/\D/g, "");
    channels.push({
      key: "phone",
      label: c.phone,
      icon: "📞",
      href: `tel:+55${num}`,
      actionLabel: "Ligar",
    });
  }

  if (c.email) {
    channels.push({
      key: "email",
      label: c.email,
      icon: "📧",
      href: `mailto:${c.email}`,
      actionLabel: "Enviar e-mail",
    });
  }

  if (c.website) {
    const url = c.website.startsWith("http") ? c.website : `https://${c.website}`;
    channels.push({
      key: "website",
      label: c.website.replace(/^https?:\/\//, ""),
      icon: "🌐",
      href: url,
      actionLabel: "Acessar site",
    });
  }

  if (c.instagram) {
    const handle = c.instagram.startsWith("@") ? c.instagram : `@${c.instagram}`;
    const user = c.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "");
    channels.push({
      key: "instagram",
      label: handle,
      icon: "📷",
      href: c.instagram.startsWith("http") ? c.instagram : `https://instagram.com/${user}`,
      actionLabel: "Ver Instagram",
    });
  }

  if (c.facebook) {
    channels.push({
      key: "facebook",
      label: "Facebook",
      icon: "📘",
      href: c.facebook.startsWith("http") ? c.facebook : `https://facebook.com/${c.facebook}`,
      actionLabel: "Ver Facebook",
    });
  }

  return channels;
}

type Props = {
  corretora: PublicCorretora;
  variant?: "compact" | "full";
};

export function CorretoraContactChannels({ corretora, variant = "full" }: Props) {
  const channels = buildChannels(corretora);

  if (channels.length === 0) return null;

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        {channels.map((ch) => (
          <a
            key={ch.key}
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
            title={ch.actionLabel}
          >
            <span aria-hidden>{ch.icon}</span>
            {ch.label}
          </a>
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {channels.map((ch) => (
        <li key={ch.key}>
          <a
            href={ch.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-all hover:border-zinc-300 hover:shadow-sm"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-50 text-lg">
              {ch.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900 truncate">
                {ch.label}
              </p>
              <p className="text-xs text-zinc-500">{ch.actionLabel}</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-emerald-700">
              Abrir →
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
