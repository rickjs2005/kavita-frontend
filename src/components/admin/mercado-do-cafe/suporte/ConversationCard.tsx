"use client";

// ConversationCard.tsx
//
// Card individual de uma conversa (corretora) na lista lateral do
// admin de Suporte. Mobile-first com:
//
//   - Avatar circular com inicial colorida (consistencia com identidade)
//   - Badge de status (verde para nao lido, slate para lido)
//   - Timestamp relativo (hoje, ontem, dd/mmm)
//   - Ultima mensagem em line-clamp-1
//   - Card ativo com ring-1 ring-emerald-500/40 + bg-slate-900
//
// Acessibilidade: aria-current="page" no card ativo, aria-label
// completo no botao para leitores de tela.

import { memo } from "react";

export type ConversationItem = {
  corretora_id: number;
  corretora_name: string;
  corretora_slug: string;
  corretora_city: string | null;
  corretora_state: string | null;
  unread_from_corretora: number;
  total_messages: number;
  last_message_at: string;
  last_message_body: string;
  last_message_sender_type: "corretora" | "admin";
};

type Props = {
  thread: ConversationItem;
  active: boolean;
  onOpen: (thread: ConversationItem) => void;
};

// Cores do avatar deterministicas a partir do nome — mantem
// consistencia entre re-renders e da variedade visual sem precisar
// de campo extra na corretora.
const AVATAR_PALETTE = [
  "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  "bg-rose-500/15 text-rose-300 ring-rose-400/30",
  "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30",
] as const;

function avatarFor(name: string): { initial: string; classes: string } {
  const trimmed = (name || "").trim();
  const initial = (trimmed[0] || "·").toUpperCase();
  let h = 0;
  for (let i = 0; i < trimmed.length; i++) h = (h * 31 + trimmed.charCodeAt(i)) >>> 0;
  return {
    initial,
    classes: AVATAR_PALETTE[h % AVATAR_PALETTE.length],
  };
}

// Timestamp humano: hoje hh:mm, ontem hh:mm, dd/mmm.
function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();
    const time = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (sameDay) return `Hoje ${time}`;
    if (isYesterday) return `Ontem ${time}`;
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function ConversationCardImpl({ thread, active, onOpen }: Props) {
  const hasUnread = thread.unread_from_corretora > 0;
  const avatar = avatarFor(thread.corretora_name);
  const fromAdmin = thread.last_message_sender_type === "admin";
  const location =
    [thread.corretora_city, thread.corretora_state]
      .filter(Boolean)
      .join(", ") || null;

  return (
    <button
      type="button"
      onClick={() => onOpen(thread)}
      aria-current={active ? "page" : undefined}
      aria-label={`Abrir conversa com ${thread.corretora_name}${
        hasUnread ? `, ${thread.unread_from_corretora} mensagens não lidas` : ""
      }`}
      className={`flex w-full items-start gap-3 p-3 text-left transition-colors duration-200 ${
        active
          ? "bg-slate-900 ring-1 ring-inset ring-emerald-500/40"
          : "hover:bg-slate-900/60 active:bg-slate-900/80"
      }`}
    >
      {/* Avatar */}
      <div
        aria-hidden
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${avatar.classes}`}
      >
        <span>{avatar.initial}</span>
        {/* Status dot — verde para nao lido, slate para lido. */}
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-slate-900 ${
            hasUnread ? "bg-emerald-400" : "bg-slate-600"
          }`}
        />
      </div>

      {/* Conteudo */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-sm ${
              hasUnread ? "font-semibold text-slate-50" : "font-medium text-slate-200"
            }`}
          >
            {thread.corretora_name}
          </span>
          <span
            className={`shrink-0 text-[10px] tabular-nums ${
              hasUnread ? "font-semibold text-emerald-300" : "text-slate-500"
            }`}
          >
            {formatRelative(thread.last_message_at)}
          </span>
        </div>

        <p
          className={`mt-0.5 line-clamp-1 text-[12px] ${
            hasUnread ? "text-slate-300" : "text-slate-500"
          }`}
        >
          {fromAdmin && (
            <span className="font-medium text-slate-400">Você: </span>
          )}
          {thread.last_message_body}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="truncate text-[10px] text-slate-500">
            {location || "—"}
          </span>
          {hasUnread && (
            <span
              aria-label={`${thread.unread_from_corretora} mensagens não lidas`}
              className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-white"
            >
              {thread.unread_from_corretora}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// memo evita re-render dos cards quando outras conversas atualizam
// — relevante quando a lista cresce ou em refetch frequente.
export default memo(ConversationCardImpl);
