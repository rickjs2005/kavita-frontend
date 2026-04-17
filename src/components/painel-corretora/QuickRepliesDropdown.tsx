"use client";

// src/components/painel-corretora/QuickRepliesDropdown.tsx
//
// Dropdown ao lado do botão WhatsApp — clica, escolhe template,
// abre uma nova aba do WhatsApp com a mensagem renderizada. Dois
// cliques: dropdown + template. Nenhum flow de confirmação extra.
//
// Os templates default vêm de lib/quickReplies.ts. Quando a tabela
// `corretora_quick_replies` existir (sprint futura), este componente
// aceitará uma prop `templates` vinda do servidor — até lá consome
// só os defaults.

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  DEFAULT_QUICK_REPLIES,
  renderQuickReply,
  buildWhatsAppUrl,
  type QuickReplyContext,
  type QuickReplyTemplate,
} from "@/lib/quickReplies";

type Props = {
  lead: QuickReplyContext["lead"] & { telefone: string };
  corretoraNome: string;
  templates?: QuickReplyTemplate[];
};

export function QuickRepliesDropdown({
  lead,
  corretoraNome,
  templates = DEFAULT_QUICK_REPLIES,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha no click fora. Reutiliza padrão do NotificationsBell:
  // listener no document só quando o dropdown está visível.
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Fecha no Esc para quem usa teclado.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function handleSelect(tpl: QuickReplyTemplate) {
    const message = renderQuickReply(tpl, { lead, corretoraNome });
    const url = buildWhatsAppUrl(lead.telefone, message);
    if (!url) {
      toast.error("Número de telefone inválido.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-9 min-w-[100px] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-3 text-[12px] font-semibold text-emerald-200 transition-colors hover:border-emerald-400/50 hover:bg-emerald-500/15"
        title="Respostas prontas — abre o WhatsApp já com a mensagem"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0"
          aria-hidden
        >
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <span>Resposta rápida</span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M5 8l5 5 5-5H5z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-xl border border-white/10 bg-stone-900 shadow-2xl shadow-black/60 ring-1 ring-white/5"
        >
          <div className="border-b border-white/[0.05] px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
              Respostas prontas
            </p>
            <p className="mt-0.5 text-[10px] text-stone-400">
              Abre WhatsApp com mensagem personalizada.
            </p>
          </div>
          <ul className="divide-y divide-white/[0.04]">
            {templates.map((tpl) => (
              <li key={tpl.id}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelect(tpl)}
                  className="w-full px-3 py-2.5 text-left transition-colors hover:bg-emerald-500/10"
                >
                  <p className="text-[12px] font-semibold text-stone-100">
                    {tpl.label}
                  </p>
                  {tpl.hint && (
                    <p className="mt-0.5 text-[10px] leading-relaxed text-stone-400">
                      {tpl.hint}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
