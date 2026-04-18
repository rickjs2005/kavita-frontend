"use client";

// src/app/admin/mercado-do-cafe/reconciliacao/ReconciliacaoClient.tsx
//
// Fase 6 — tela admin de reconciliação Asaas. Dois blocos:
//   1. Resumo de webhook_events (cards KPI)
//   2. Tabela de assinaturas filtráveis + tabela de eventos filtráveis
//
// Read-only. Retry manual de webhook e reconciliação proativa ficam
// para uma próxima iteração — primeiro dar visibilidade, depois ação.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type SummaryResponse = {
  webhook_events: {
    total: number;
    pending: number;
    failed: number;
    processed: number;
    last_event_at: string | null;
  };
};

type Subscription = {
  id: number;
  corretora_id: number;
  corretora_name: string;
  corretora_slug: string;
  corretora_city: string | null;
  corretora_state: string | null;
  plan_id: number;
  plan_slug: string;
  plan_name: string;
  status: string;
  payment_method: string | null;
  monthly_price_cents: number | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  canceled_at: string | null;
  provider: string | null;
  provider_subscription_id: string | null;
  provider_status: string | null;
  notes: string | null;
  created_at: string;
};

type WebhookEvent = {
  id: number;
  provider: string;
  provider_event_id: string;
  event_type: string;
  processed_at: string | null;
  processing_error: string | null;
  retry_count: number;
  created_at: string;
};

type SubFilter =
  | "all"
  | "overdue"
  | "pending_checkout"
  | "active_remote"
  | "manual";
type EventFilter = "all" | "failed" | "unprocessed" | "processed";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  } catch {
    return iso;
  }
}

function formatBrl(cents: number | null | undefined) {
  if (cents == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export default function ReconciliacaoClient() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [subFilter, setSubFilter] = useState<SubFilter>("all");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, subsRes, eventsRes] = await Promise.all([
        apiClient.get<SummaryResponse>(
          "/api/admin/monetization/reconciliation/summary",
        ),
        apiClient.get<Subscription[]>(
          `/api/admin/monetization/reconciliation/subscriptions${
            subFilter !== "all" ? `?payment_status=${subFilter}` : ""
          }`,
        ),
        apiClient.get<WebhookEvent[]>(
          `/api/admin/monetization/reconciliation/webhook-events?status=${eventFilter}`,
        ),
      ]);
      setSummary(summaryRes);
      setSubs(subsRes ?? []);
      setEvents(eventsRes ?? []);
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao carregar reconciliação.").message);
    } finally {
      setLoading(false);
    }
  }, [subFilter, eventFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative min-h-screen w-full bg-slate-950 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
              Monetização
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-50 md:text-3xl">
              Reconciliação Asaas
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Status das assinaturas, últimos webhooks recebidos e eventos com
              erro.
            </p>
          </div>
          <Link
            href="/admin/mercado-do-cafe"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-amber-500/40 hover:text-amber-200"
          >
            ← Voltar
          </Link>
        </div>

        {/* ─── KPIs do webhook ──────────────────────────────────────── */}
        {summary && (
          <div className="mb-6 grid gap-3 sm:grid-cols-4">
            <KpiCard
              kicker="Total"
              value={summary.webhook_events.total}
              tone="neutral"
            />
            <KpiCard
              kicker="Processados"
              value={summary.webhook_events.processed}
              tone="emerald"
            />
            <KpiCard
              kicker="Pendentes"
              value={summary.webhook_events.pending}
              tone="amber"
            />
            <KpiCard
              kicker="Com erro"
              value={summary.webhook_events.failed}
              tone="rose"
            />
          </div>
        )}

        {summary?.webhook_events?.last_event_at && (
          <p className="mb-6 text-[11px] text-slate-500">
            Último evento recebido: {formatDate(summary.webhook_events.last_event_at)}
          </p>
        )}

        {/* ─── Assinaturas ──────────────────────────────────────────── */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-50">
                Assinaturas
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Estado atual de cada assinatura. Use o filtro para focar em
                problemas.
              </p>
            </div>
            <FilterChips
              options={[
                { value: "all", label: "Todas" },
                { value: "overdue", label: "Vencidas" },
                { value: "pending_checkout", label: "Aguardando pagamento" },
                { value: "active_remote", label: "Ativas (gateway)" },
                { value: "manual", label: "Manuais" },
              ]}
              value={subFilter}
              onChange={(v) => setSubFilter(v as SubFilter)}
            />
          </div>
          {loading ? (
            <SkeletonRows />
          ) : subs.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-slate-500">
              Nenhuma assinatura neste filtro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[12px]">
                <thead className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <tr className="border-b border-slate-800">
                    <th className="py-2 text-left">Corretora</th>
                    <th className="py-2 text-left">Plano</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Gateway</th>
                    <th className="py-2 text-right">Preço</th>
                    <th className="py-2 text-right">Próx. vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-slate-800/60 align-top"
                    >
                      <td className="py-2 pr-3">
                        <Link
                          href={`/admin/mercado-do-cafe/corretora/${s.corretora_id}`}
                          className="font-semibold text-slate-100 hover:text-amber-200"
                        >
                          {s.corretora_name}
                        </Link>
                        <p className="text-[10px] text-slate-500">
                          {[s.corretora_city, s.corretora_state]
                            .filter(Boolean)
                            .join(" / ") || "—"}
                        </p>
                      </td>
                      <td className="py-2 pr-3 text-slate-200">{s.plan_name}</td>
                      <td className="py-2 pr-3">
                        <StatusPill status={s.status} />
                      </td>
                      <td className="py-2 pr-3">
                        {s.provider ? (
                          <>
                            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-300">
                              {s.provider}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">
                              {s.provider_status ?? "sem status remoto"}
                            </p>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            manual
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-100">
                        {formatBrl(s.monthly_price_cents)}
                      </td>
                      <td className="py-2 text-right text-[11px] text-slate-400">
                        {formatDate(s.current_period_end)}
                        {s.trial_ends_at && (
                          <span className="mt-0.5 block text-[10px] text-amber-300/80">
                            trial até {formatDate(s.trial_ends_at)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ─── Webhook events ──────────────────────────────────────── */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-50">
                Webhook events
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Eventos brutos recebidos do Asaas. Falhas persistem com mensagem
                para investigação.
              </p>
            </div>
            <FilterChips
              options={[
                { value: "all", label: "Todos" },
                { value: "processed", label: "Processados" },
                { value: "unprocessed", label: "Não processados" },
                { value: "failed", label: "Com erro" },
              ]}
              value={eventFilter}
              onChange={(v) => setEventFilter(v as EventFilter)}
            />
          </div>
          {loading ? (
            <SkeletonRows />
          ) : events.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-slate-500">
              Nenhum evento neste filtro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[12px]">
                <thead className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  <tr className="border-b border-slate-800">
                    <th className="py-2 text-left">Tipo</th>
                    <th className="py-2 text-left">Provider</th>
                    <th className="py-2 text-left">Status</th>
                    <th className="py-2 text-left">Recebido em</th>
                    <th className="py-2 text-left">Processado em</th>
                    <th className="py-2 text-right">Retries</th>
                    <th className="py-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-slate-800/60 align-top"
                    >
                      <td className="py-2 pr-3">
                        <p className="font-mono text-[11px] text-slate-100">
                          {e.event_type}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          #{e.provider_event_id}
                        </p>
                      </td>
                      <td className="py-2 pr-3 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-300">
                        {e.provider}
                      </td>
                      <td className="py-2 pr-3">
                        {e.processing_error ? (
                          <span
                            className="inline-flex rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-200 ring-1 ring-rose-400/30"
                            title={e.processing_error}
                          >
                            erro
                          </span>
                        ) : e.processed_at ? (
                          <span className="inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 ring-1 ring-emerald-400/30">
                            processado
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200 ring-1 ring-amber-400/30">
                            pendente
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-[11px] text-slate-400">
                        {formatDate(e.created_at)}
                      </td>
                      <td className="py-2 pr-3 text-[11px] text-slate-400">
                        {formatDate(e.processed_at)}
                      </td>
                      <td className="py-2 text-right tabular-nums text-slate-400">
                        {e.retry_count}
                      </td>
                      <td className="py-2 text-right">
                        {(e.processing_error || !e.processed_at) && (
                          <RetryButton eventId={e.id} onDone={load} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {events.some((e) => e.processing_error) && (
            <p className="mt-3 text-[11px] text-rose-300/80">
              Passe o mouse sobre o badge &quot;erro&quot; para ver a mensagem
              completa.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  kicker,
  value,
  tone,
}: {
  kicker: string;
  value: number;
  tone: "neutral" | "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "ring-emerald-500/30 text-emerald-200"
      : tone === "amber"
        ? "ring-amber-500/30 text-amber-200"
        : tone === "rose"
          ? "ring-rose-500/30 text-rose-200"
          : "ring-slate-700 text-slate-100";
  return (
    <div
      className={`rounded-2xl bg-slate-900/60 p-4 ring-1 ${toneClass.split(" ")[0]}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {kicker}
      </p>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${toneClass.split(" ")[1]}`}>
        {value}
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: {
      label: "Ativa",
      cls: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
    },
    trialing: {
      label: "Trial",
      cls: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    },
    past_due: {
      label: "Vencida",
      cls: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
    },
    canceled: {
      label: "Cancelada",
      cls: "bg-slate-700/40 text-slate-300 ring-slate-600",
    },
    expired: {
      label: "Expirada",
      cls: "bg-slate-700/40 text-slate-400 ring-slate-600",
    },
  };
  const info = map[status] ?? {
    label: status,
    cls: "bg-slate-700/40 text-slate-300 ring-slate-600",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ring-1 ${info.cls}`}
    >
      {info.label}
    </span>
  );
}

function FilterChips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              active
                ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40"
                : "bg-slate-800 text-slate-400 ring-1 ring-slate-700 hover:text-slate-100"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ETAPA 1.3 — botão de retry manual. Chama
// POST /reconciliation/webhook-events/:id/retry; em sucesso recarrega
// a tabela pra refletir novo status.
function RetryButton({
  eventId,
  onDone,
}: {
  eventId: number;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const retry = async () => {
    if (loading) return;
    if (!confirm("Reprocessar este evento? A ação é idempotente.")) return;
    setLoading(true);
    try {
      const res = await apiClient.post<{
        applied: { applied: boolean; reason?: string };
        message?: string;
      }>(`/api/admin/monetization/reconciliation/webhook-events/${eventId}/retry`);
      toast.success(res?.message ?? "Evento reprocessado.");
      onDone();
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao reprocessar.").message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={retry}
      disabled={loading}
      className="inline-flex items-center rounded-lg border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-amber-100 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
    >
      {loading ? "..." : "↻ Retry"}
    </button>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-10 animate-pulse rounded-lg bg-slate-800/50"
        />
      ))}
    </div>
  );
}
