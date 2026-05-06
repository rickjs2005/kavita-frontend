"use client";

// src/components/admin/mercado-do-cafe/suporte/SupportThreads.tsx
//
// Admin tab "Suporte" — lista threads (uma por corretora) ordenadas
// por ultima mensagem. Click no thread abre painel lateral com
// historico + form de resposta.
//
// Endpoints:
//   GET  /api/admin/mercado-do-cafe/support/threads
//   GET  /api/admin/mercado-do-cafe/support/threads/:corretoraId
//   POST /api/admin/mercado-do-cafe/support/threads/:corretoraId/messages

import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import toast from "react-hot-toast";

type Thread = {
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

type Props = {
  onUnauthorized?: () => void;
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

export default function SupportThreads({ onUnauthorized }: Props) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ threads: Thread[] }>(
        "/api/admin/mercado-do-cafe/support/threads",
      );
      setThreads(Array.isArray(res?.threads) ? res.threads : []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized?.();
      }
      toast.error(
        err instanceof Error ? err.message : "Erro ao carregar threads.",
      );
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  const openThread = useCallback(
    async (thread: Thread) => {
      setActive(thread);
      setMessages([]);
      setMessagesLoading(true);
      try {
        const res = await apiClient.get<{ messages: Message[] }>(
          `/api/admin/mercado-do-cafe/support/threads/${thread.corretora_id}`,
        );
        setMessages(Array.isArray(res?.messages) ? res.messages : []);
        // Backend marca mensagens da corretora como lidas ao abrir;
        // refresca lista pra atualizar contadores.
        loadThreads();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Erro ao carregar mensagens.",
        );
      } finally {
        setMessagesLoading(false);
      }
    },
    [loadThreads],
  );

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const sendReply = async () => {
    if (!active) return;
    const body = reply.trim();
    if (body.length < 2) {
      toast.error("Resposta precisa ter ao menos 2 caracteres.");
      return;
    }
    setSending(true);
    try {
      await apiClient.post(
        `/api/admin/mercado-do-cafe/support/threads/${active.corretora_id}/messages`,
        { body },
      );
      setReply("");
      // Recarrega thread atual + lista para refletir novo estado.
      const res = await apiClient.get<{ messages: Message[] }>(
        `/api/admin/mercado-do-cafe/support/threads/${active.corretora_id}`,
      );
      setMessages(Array.isArray(res?.messages) ? res.messages : []);
      await loadThreads();
      toast.success("Resposta enviada.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar resposta.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      {/* ── Lista de threads (corretoras) ── */}
      <aside className="rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="border-b border-slate-800 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Conversas
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {threads.length} corretora{threads.length === 1 ? "" : "s"} com mensagens
          </p>
        </div>

        {loading && (
          <p className="py-8 text-center text-xs text-slate-500">
            Carregando…
          </p>
        )}

        {!loading && threads.length === 0 && (
          <p className="py-8 text-center text-xs text-slate-500">
            Nenhuma corretora enviou mensagem ainda.
          </p>
        )}

        {!loading && threads.length > 0 && (
          <ul className="divide-y divide-slate-800/60">
            {threads.map((t) => {
              const isActive = active?.corretora_id === t.corretora_id;
              const hasUnread = t.unread_from_corretora > 0;
              return (
                <li key={t.corretora_id}>
                  <button
                    type="button"
                    onClick={() => openThread(t)}
                    className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "bg-emerald-500/10"
                        : "hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-100">
                        {t.corretora_name}
                      </span>
                      {hasUnread && (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                          {t.unread_from_corretora}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-slate-400">
                      {t.last_message_sender_type === "admin" ? "Você: " : ""}
                      {t.last_message_body}
                    </p>
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500">
                      <span>
                        {[t.corretora_city, t.corretora_state]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </span>
                      <span>{formatTime(t.last_message_at)}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* ── Painel da conversa ativa ── */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/40">
        {!active ? (
          <div className="flex h-full min-h-[280px] items-center justify-center p-6 text-center">
            <p className="text-xs text-slate-500">
              Selecione uma corretora à esquerda para ver as mensagens e
              responder.
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <header className="border-b border-slate-800 px-4 py-3">
              <p className="text-sm font-semibold text-slate-100">
                {active.corretora_name}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {[active.corretora_city, active.corretora_state]
                  .filter(Boolean)
                  .join(", ") || "—"}
                {" · "}
                {active.total_messages} mensage{active.total_messages === 1 ? "m" : "ns"}
              </p>
            </header>

            <div
              ref={messagesRef}
              className="max-h-[480px] flex-1 space-y-3 overflow-y-auto p-4"
            >
              {messagesLoading && (
                <p className="py-8 text-center text-xs text-slate-500">
                  Carregando mensagens…
                </p>
              )}

              {!messagesLoading && messages.length === 0 && (
                <p className="py-8 text-center text-xs text-slate-500">
                  Sem mensagens ainda.
                </p>
              )}

              {!messagesLoading &&
                messages.map((m) => {
                  const fromAdmin = m.sender_type === "admin";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col gap-1 ${fromAdmin ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                          fromAdmin
                            ? "bg-emerald-500/15 text-slate-100 ring-1 ring-emerald-400/30"
                            : "bg-slate-800/80 text-slate-100 ring-1 ring-slate-700/60"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      </div>
                      <p className="px-1 text-[10px] font-medium text-slate-500">
                        <span className="font-semibold text-slate-400">
                          {fromAdmin
                            ? m.sender_name || "Você (Kavita)"
                            : m.sender_name || active.corretora_name}
                        </span>
                        {" · "}
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  );
                })}
            </div>

            <footer className="border-t border-slate-800 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <textarea
                  rows={2}
                  value={reply}
                  onChange={(e) => setReply(e.target.value.slice(0, 4000))}
                  disabled={sending}
                  placeholder={`Responder para ${active.corretora_name}…`}
                  className="flex-1 resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 [color-scheme:dark]"
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={sending || reply.trim().length < 2}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Enviando…" : "Enviar resposta"}
                </button>
              </div>
              <p className="mt-1 text-right text-[10px] text-slate-600 tabular-nums">
                {reply.length}/4000 · Ctrl+Enter envia
              </p>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}
