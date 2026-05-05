"use client";

// src/app/painel/corretora/whatsapp/page.tsx
//
// Etapa 5 da reativação WhatsApp (ver kavita-backend/docs/whatsapp-reativacao.md §10).
// Inbox da corretora — duas listas em cards (não tabela), seguindo o
// design language do painel:
//   - Mensagens enviadas (whatsapp_messages) — filtro por lead_id /
//     contract_id via query string.
//   - Mensagens recebidas (whatsapp_inbound) — visível mas hoje vazia
//     enquanto o lookup contextual via sender_phone não está
//     implementado (sprint posterior).

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { formatDateTime } from "@/utils/formatters";
import {
  WhatsAppStatusBadge,
  type WhatsAppStatus,
} from "@/components/painel-corretora/WhatsAppStatusBadge";

type WhatsAppMessage = {
  id: number;
  lead_id: number | null;
  contract_id: number | null;
  corretora_id: number | null;
  recipient_phone: string;
  template_key: string | null;
  body: string | null;
  provider: "manual" | "api" | "stub";
  status: WhatsAppStatus;
  language_code: string;
  provider_message_id: string | null;
  error_message: string | null;
  retry_count: number;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  created_at: string;
  updated_at: string;
};

type WhatsAppInbound = {
  id: number;
  sender_phone: string;
  body: string | null;
  media_url: string | null;
  lead_id: number | null;
  contract_id: number | null;
  corretora_id: number | null;
  provider_message_id: string | null;
  received_at: string;
  handled_at: string | null;
  handled_by_user_id: number | null;
  created_at: string;
};

// O apiClient extrai automaticamente { ok, data, meta } -> data, então
// o tipo retornado é o próprio array (T[]), não o envelope completo.
function maskPhone(phone: string | null | undefined): string {
  const v = String(phone || "").trim();
  if (!v) return "—";
  if (v.length <= 8) return v;
  return `${v.slice(0, 4)}*****${v.slice(-4)}`;
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return formatDateTime(iso) || String(iso);
}

export default function WhatsappPage() {
  const sp = useSearchParams();
  const leadIdParam = sp.get("lead_id");
  const contractIdParam = sp.get("contract_id");

  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [inbound, setInbound] = useState<WhatsAppInbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(
    () => ({
      lead_id: leadIdParam ? Number(leadIdParam) : null,
      contract_id: contractIdParam ? Number(contractIdParam) : null,
    }),
    [leadIdParam, contractIdParam],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const queryMessages = new URLSearchParams();
        if (filters.lead_id) queryMessages.set("lead_id", String(filters.lead_id));
        if (filters.contract_id)
          queryMessages.set("contract_id", String(filters.contract_id));
        queryMessages.set("limit", "100");

        const [msgRes, inRes] = await Promise.all([
          apiClient.get<WhatsAppMessage[]>(
            `/api/corretora/whatsapp/messages?${queryMessages.toString()}`,
          ),
          apiClient.get<WhatsAppInbound[]>(
            `/api/corretora/whatsapp/inbound?limit=100`,
          ),
        ]);
        if (cancelled) return;
        setMessages(Array.isArray(msgRes) ? msgRes : []);
        setInbound(Array.isArray(inRes) ? inRes : []);
      } catch (err) {
        if (cancelled) return;
        setError(formatApiError(err, "Erro ao carregar mensagens.").message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filters.lead_id, filters.contract_id]);

  const hasFilter = Boolean(filters.lead_id || filters.contract_id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-100">WhatsApp</h1>
        <p className="mt-1 text-sm text-stone-400">
          Mensagens enviadas e recebidas pela corretora.
        </p>
        {hasFilter && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-stone-500">Filtrado por:</span>
            {filters.lead_id != null && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200 ring-1 ring-amber-400/30">
                Lead #{filters.lead_id}
              </span>
            )}
            {filters.contract_id != null && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200 ring-1 ring-emerald-400/30">
                Contrato #{filters.contract_id}
              </span>
            )}
            <a
              href="/painel/corretora/whatsapp"
              className="text-stone-400 hover:text-stone-200"
            >
              Limpar filtros →
            </a>
          </div>
        )}
      </header>

      {error && (
        <div className="mb-6 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/30">
          {error}
        </div>
      )}

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Enviadas {messages.length > 0 && (
            <span className="ml-1 text-stone-500 font-normal lowercase tracking-normal">
              · {messages.length}
            </span>
          )}
        </h2>

        {loading ? (
          <SkeletonList />
        ) : messages.length === 0 ? (
          <EmptyCard
            title="Nenhuma mensagem enviada"
            body={
              hasFilter
                ? "Não há mensagens para os filtros selecionados."
                : "Quando a corretora disparar uma mensagem (manual ou via templates aprovados), ela aparece aqui."
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {messages.map((m) => (
              <MessageCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
          Recebidas {inbound.length > 0 && (
            <span className="ml-1 text-stone-500 font-normal lowercase tracking-normal">
              · {inbound.length}
            </span>
          )}
        </h2>

        {loading ? (
          <SkeletonList />
        ) : inbound.length === 0 ? (
          <EmptyCard
            title="Nenhuma mensagem recebida"
            body="Mensagens que o produtor enviar pelo WhatsApp aparecem aqui assim que o webhook estiver ligado em produção."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {inbound.map((i) => (
              <InboundCard key={i.id} i={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MessageCard({ m }: { m: WhatsAppMessage }) {
  const ts = m.read_at || m.delivered_at || m.sent_at || m.failed_at || m.created_at;
  return (
    <article className="rounded-xl bg-stone-900 p-4 ring-1 ring-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <WhatsAppStatusBadge status={m.status} />
            <span className="text-[11px] text-stone-500 font-mono">
              #{m.id}
            </span>
          </div>
          <div className="mt-2 text-xs text-stone-500">
            Para <span className="text-stone-300">{maskPhone(m.recipient_phone)}</span>
            {m.template_key && (
              <>
                {" · "}
                <span className="text-stone-400 font-mono">
                  {m.template_key}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="text-[10px] text-stone-500 text-right shrink-0">
          {fmt(ts)}
        </div>
      </div>

      {m.body && (
        <p className="mt-3 whitespace-pre-line text-sm text-stone-200 line-clamp-6">
          {m.body}
        </p>
      )}

      {m.error_message && (
        <p className="mt-2 text-xs text-red-300/90 line-clamp-2">
          {m.error_message}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-500">
        <span>Provider: <span className="text-stone-400">{m.provider}</span></span>
        <span>Idioma: <span className="text-stone-400">{m.language_code}</span></span>
        {m.lead_id != null && (
          <span>Lead: <span className="text-stone-400">#{m.lead_id}</span></span>
        )}
        {m.contract_id != null && (
          <span>Contrato: <span className="text-stone-400">#{m.contract_id}</span></span>
        )}
        {m.retry_count > 0 && (
          <span>Tentativas: <span className="text-stone-400">{m.retry_count}</span></span>
        )}
      </div>
    </article>
  );
}

function InboundCard({ i }: { i: WhatsAppInbound }) {
  return (
    <article className="rounded-xl bg-stone-900 p-4 ring-1 ring-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-stone-500">
            De <span className="text-stone-300">{maskPhone(i.sender_phone)}</span>
          </div>
        </div>
        <div className="text-[10px] text-stone-500 text-right shrink-0">
          {fmt(i.received_at)}
        </div>
      </div>

      {i.body && (
        <p className="mt-3 whitespace-pre-line text-sm text-stone-200 line-clamp-6">
          {i.body}
        </p>
      )}

      {i.media_url && (
        <p className="mt-2 text-xs text-amber-200/80">
          Anexo de mídia: <span className="font-mono">{i.media_url}</span>
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-500">
        {i.lead_id != null && (
          <span>Lead: <span className="text-stone-400">#{i.lead_id}</span></span>
        )}
        {i.contract_id != null && (
          <span>Contrato: <span className="text-stone-400">#{i.contract_id}</span></span>
        )}
        {i.handled_at ? (
          <span className="text-emerald-300/80">Tratada em {fmt(i.handled_at)}</span>
        ) : (
          <span className="text-amber-200/80">Aguardando atendimento</span>
        )}
      </div>
    </article>
  );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-stone-900/60 p-6 ring-1 ring-white/[0.04]">
      <div className="text-sm font-semibold text-stone-200">{title}</div>
      <p className="mt-1 text-xs text-stone-400">{body}</p>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-xl bg-stone-900/40 ring-1 ring-white/[0.04]"
        />
      ))}
    </div>
  );
}
