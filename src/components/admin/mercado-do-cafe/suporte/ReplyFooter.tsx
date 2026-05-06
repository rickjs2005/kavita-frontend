"use client";

// ReplyFooter.tsx
//
// Footer compacto de resposta no painel admin de Suporte.
//
// Mobile: sticky bottom com backdrop-blur + bg-slate-950/95. Input
// h-12 com botao circular Send 40x40 ao lado direito, dentro do
// mesmo container. Reduz altura em ~40% versus o textarea + botao
// largo anterior.
//
// Desktop: layout horizontal com input + botao "Enviar resposta"
// preservado, para nao sobrescrever a UX desktop ja consolidada.
//
// Acessibilidade:
//   - aria-label no botao Send
//   - Ctrl/Cmd+Enter envia
//   - disabled state visivel
//
// Microinteracao opcional: vibrate(20) no tap do envio (mobile com
// Navigator.vibrate disponivel).

import { useState } from "react";
import { Send } from "lucide-react";

type Props = {
  recipientName: string;
  onSend: (body: string) => Promise<void>;
  sending?: boolean;
};

export default function ReplyFooter({
  recipientName,
  onSend,
  sending = false,
}: Props) {
  const [draft, setDraft] = useState("");

  const canSend = draft.trim().length >= 2 && !sending;

  const handleSend = async () => {
    if (!canSend) return;
    // Haptic feedback opcional — silencioso em browsers sem suporte.
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.(15);
      } catch {
        /* noop */
      }
    }
    const body = draft.trim();
    await onSend(body);
    setDraft("");
  };

  return (
    <footer
      className="sticky bottom-0 z-10 border-t border-slate-800 bg-slate-950/95 p-3 backdrop-blur"
      aria-label="Responder mensagem"
    >
      <div className="flex items-end gap-2">
        <label htmlFor="reply-input" className="sr-only">
          Resposta para {recipientName}
        </label>
        <input
          id="reply-input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
          disabled={sending}
          placeholder={`Responder ${recipientName}…`}
          className="h-12 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 text-sm text-slate-100 placeholder:text-slate-500 transition-colors duration-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 disabled:opacity-60 [color-scheme:dark]"
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
            if (e.key === "Enter" && !e.shiftKey) {
              // Mobile: Enter envia direto (textarea de 1 linha — nao
              // faz sentido quebrar linha aqui). Shift+Enter quebra.
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label={sending ? "Enviando resposta" : "Enviar resposta"}
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition-all duration-200 hover:bg-emerald-500 active:scale-95 active:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          <Send
            className={`h-5 w-5 transition-transform duration-200 ${
              sending ? "animate-pulse" : ""
            }`}
            aria-hidden
          />
        </button>
      </div>
      <p className="mt-1 px-1 text-right text-[10px] tabular-nums text-slate-600">
        {draft.length}/4000
      </p>
    </footer>
  );
}
