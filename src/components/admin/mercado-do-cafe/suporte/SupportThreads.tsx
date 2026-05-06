"use client";

// src/components/admin/mercado-do-cafe/suporte/SupportThreads.tsx
//
// Admin tab "Suporte" — orquestra a lista de conversas
// (ConversationCard) e o painel de mensagens + footer (ReplyFooter).
//
// Mobile (<lg): apresenta UM dos dois (lista OU thread) com botao de
// voltar. Reduz fricao de viewport e segue padrao chat web em
// telas pequenas.
//
// Desktop (≥lg): layout split tradicional (lista 360px + painel).
//
// Endpoints:
//   GET  /api/admin/mercado-do-cafe/support/threads
//   GET  /api/admin/mercado-do-cafe/support/threads/:corretoraId
//   POST /api/admin/mercado-do-cafe/support/threads/:corretoraId/messages

import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import toast from "react-hot-toast";
import { ChevronLeft } from "lucide-react";
import ConversationCard, {
  type ConversationItem,
} from "./ConversationCard";
import ReplyFooter from "./ReplyFooter";

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
  const [threads, setThreads] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ threads: ConversationItem[] }>(
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
    async (thread: ConversationItem) => {
      setActive(thread);
      setMessages([]);
      setMessagesLoading(true);
      try {
        const res = await apiClient.get<{ messages: Message[] }>(
          `/api/admin/mercado-do-cafe/support/threads/${thread.corretora_id}`,
        );
        setMessages(Array.isArray(res?.messages) ? res.messages : []);
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

  const sendReply = useCallback(
    async (body: string) => {
      if (!active) return;
      setSending(true);
      try {
        await apiClient.post(
          `/api/admin/mercado-do-cafe/support/threads/${active.corretora_id}/messages`,
          { body },
        );
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
    },
    [active, loadThreads],
  );

  // Mobile: lista OU thread (controle por presenca de active).
  // Desktop: ambos visiveis.
  const showListOnMobile = !active;
  const showThreadOnMobile = !!active;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
      {/* ── Lista de threads ── */}
      <aside
        className={`rounded-xl border border-slate-800 bg-slate-900/40 ${
          showListOnMobile ? "block" : "hidden lg:block"
        }`}
      >
        <div className="border-b border-slate-800 p-3">
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
            {threads.map((t) => (
              <li key={t.corretora_id}>
                <ConversationCard
                  thread={t}
                  active={active?.corretora_id === t.corretora_id}
                  onOpen={openThread}
                />
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ── Painel da conversa ativa ──
          IMPORTANTE: o display tem que ser `flex flex-col` quando
          visivel (em qualquer breakpoint), porque o ReplyFooter
          sticky e os messages com flex-1 dependem disso. Antes eu
          tinha `flex flex-col` na base e sobrescrevia com `block`
          em mobile — bug. Agora controlo display so via toggle. */}
      <section
        className={`min-h-[60vh] flex-col rounded-xl border border-slate-800 bg-slate-900/40 ${
          showThreadOnMobile ? "flex" : "hidden lg:flex"
        }`}
      >
        {!active ? (
          <div className="flex h-full min-h-[280px] items-center justify-center p-6 text-center">
            <p className="text-xs text-slate-500">
              Selecione uma corretora à esquerda para ver as mensagens e
              responder.
            </p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-2 border-b border-slate-800 p-3">
              {/* Botao voltar — so aparece em mobile (<lg). Permite
                  retornar pra lista quando viewport e estreito. */}
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="Voltar para lista de conversas"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors duration-200 hover:bg-slate-800 hover:text-slate-100 lg:hidden"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-100">
                  {active.corretora_name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {[active.corretora_city, active.corretora_state]
                    .filter(Boolean)
                    .join(", ") || "—"}
                  {" · "}
                  {active.total_messages} mensage
                  {active.total_messages === 1 ? "m" : "ns"}
                </p>
              </div>
            </header>

            <div
              ref={messagesRef}
              className="max-h-[60vh] flex-1 space-y-3 overflow-y-auto p-3"
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
                      className={`flex flex-col gap-1 ${
                        fromAdmin ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                          fromAdmin
                            ? "bg-emerald-500/15 text-slate-100 ring-1 ring-emerald-400/30"
                            : "bg-slate-800/80 text-slate-100 ring-1 ring-slate-700/60"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {m.body}
                        </p>
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

            <ReplyFooter
              recipientName={active.corretora_name}
              onSend={sendReply}
              sending={sending}
            />
          </>
        )}
      </section>

    </div>
  );
}
