"use client";

// src/components/painel-corretora/SupportMessages.tsx
//
// Conversa interna corretora <-> curadoria Kavita. Substitui o
// mailto: corretora envia mensagem aqui e ve a resposta no proprio
// painel, sem trocar de ferramenta.
//
// Sem polling em tempo real para manter simples — refetch acontece
// quando o usuario carrega a tela ou envia uma mensagem nova. Se
// virar gargalo, sobe pra polling/SSE depois.

import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";

type Message = {
  id: number;
  corretora_id: number;
  sender_type: "corretora" | "admin";
  sender_id: number | null;
  sender_name: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function SupportMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ messages: Message[] }>(
        "/api/corretora/support/messages",
      );
      setMessages(Array.isArray(res?.messages) ? res.messages : []);
    } catch (err) {
      toast.error(
        formatApiError(err, "Erro ao carregar mensagens.").message,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-scroll para a ultima mensagem quando lista atualizar — UX
  // de chat. Aplicado tambem apos enviar mensagem nova.
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const body = draft.trim();
    if (body.length < 2) {
      toast.error("Mensagem precisa ter ao menos 2 caracteres.");
      return;
    }
    setSending(true);
    try {
      await apiClient.post("/api/corretora/support/messages", { body });
      setDraft("");
      await load();
      toast.success("Mensagem enviada para a curadoria Kavita.");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao enviar mensagem.").message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-stone-900/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
            Fale com a Kavita
          </p>
          <p className="mt-1 text-[14px] font-semibold text-stone-50">
            Mensagens com a curadoria
          </p>
          <p className="mt-1 text-[12px] text-stone-400">
            Tudo que voce mandar aqui chega direto no painel admin. A
            resposta volta para esta tela — sem precisar trocar de canal.
          </p>
        </div>
      </div>

      {/* Lista de mensagens */}
      <div
        ref={listRef}
        className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-xl bg-stone-950/40 p-3 ring-1 ring-white/[0.04]"
      >
        {loading && (
          <p className="py-6 text-center text-[12px] text-stone-500">
            Carregando…
          </p>
        )}

        {!loading && messages.length === 0 && (
          <p className="py-6 text-center text-[12px] text-stone-500">
            Nenhuma mensagem ainda. Envie a primeira abaixo — pergunte
            sobre planos, dúvidas comerciais, sugestões ou problemas.
          </p>
        )}

        {!loading &&
          messages.map((m) => {
            const mine = m.sender_type === "corretora";
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    mine
                      ? "bg-amber-400/15 text-stone-100 ring-1 ring-amber-400/30"
                      : "bg-stone-800/80 text-stone-100 ring-1 ring-white/[0.06]"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
                <p className="px-1 text-[10px] font-medium text-stone-500">
                  <span className="font-semibold text-stone-400">
                    {mine
                      ? m.sender_name || "Você"
                      : m.sender_name || "Curadoria Kavita"}
                  </span>
                  {" · "}
                  {formatTime(m.created_at)}
                </p>
              </div>
            );
          })}
      </div>

      {/* Form de envio */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
          rows={2}
          disabled={sending}
          placeholder="Escreva sua mensagem para a curadoria…"
          className="flex-1 resize-none rounded-xl border border-white/10 bg-stone-950 px-3 py-2 text-[13px] text-stone-100 placeholder:text-stone-500 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/25 disabled:opacity-60 [color-scheme:dark]"
          onKeyDown={(e) => {
            // Ctrl+Enter / Cmd+Enter envia. Apenas Enter quebra linha
            // — convencional em chat web.
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || draft.trim().length < 2}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 text-[12px] font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Enviando…" : "Enviar"}
        </button>
      </div>
      <p className="mt-2 text-right text-[10px] text-stone-600 tabular-nums">
        {draft.length}/4000 · Ctrl+Enter envia
      </p>
    </section>
  );
}

export default SupportMessages;
