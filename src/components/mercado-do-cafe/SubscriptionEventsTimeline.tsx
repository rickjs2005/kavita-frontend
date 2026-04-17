"use client";

// src/components/mercado-do-cafe/SubscriptionEventsTimeline.tsx
//
// Timeline de eventos de assinatura (Sprint 4). Consome dois
// endpoints conforme o caller: o admin passa endpoint do admin e
// variant="admin"; o painel da corretora passa /plan/events com
// variant="panel". A única diferença é o chrome (admin é slate,
// panel é dark+amber) — o conteúdo e a lógica são idênticos.
//
// Eventos aparecem em ordem cronológica decrescente, com ícone por
// tipo, snapshot do plano entre origem/destino e badge do ator
// (sistema, admin, corretora_user).

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type SubscriptionEvent = {
  id: number;
  corretora_id: number;
  subscription_id: number | null;
  event_type: string;
  from_plan_id: number | null;
  to_plan_id: number | null;
  from_plan_slug: string | null;
  from_plan_name: string | null;
  to_plan_slug: string | null;
  to_plan_name: string | null;
  from_status: string | null;
  to_status: string | null;
  plan_snapshot: Record<string, unknown> | null;
  meta: Record<string, unknown> | null;
  actor_type: string | null;
  actor_id: number | null;
  created_at: string;
};

type Props = {
  endpoint: string;
  variant?: "admin" | "panel";
  title?: string;
  subtitle?: string;
};

function eventLabel(type: string): string {
  switch (type) {
    case "assigned":
      return "Plano atribuído";
    case "upgraded":
      return "Upgrade";
    case "downgraded":
      return "Downgrade";
    case "renewed":
      return "Renovado";
    case "expired":
      return "Expirou";
    case "canceled":
      return "Cancelado";
    case "payment_succeeded":
      return "Pagamento confirmado";
    case "payment_failed":
      return "Pagamento falhou";
    case "status_changed":
      return "Status alterado";
    default:
      return type;
  }
}

function eventTone(
  type: string,
): "emerald" | "rose" | "amber" | "slate" | "sky" {
  if (["assigned", "upgraded", "payment_succeeded", "renewed"].includes(type))
    return "emerald";
  if (["expired", "canceled", "payment_failed"].includes(type)) return "rose";
  if (["downgraded", "status_changed"].includes(type)) return "amber";
  return "slate";
}

function actorLabel(actorType: string | null): string {
  switch (actorType) {
    case "admin":
      return "Admin";
    case "corretora_user":
      return "Corretora";
    case "system":
      return "Sistema";
    case "provider":
      return "Gateway";
    default:
      return actorType || "—";
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Estilos por variante — chrome admin (slate neutro) vs chrome painel
// (dark + amber). O interior da linha muda de cor da bullet e do
// texto de meta para bater com o tema.
const ADMIN_STYLES = {
  container: "rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6",
  title: "text-sm font-semibold text-slate-100 sm:text-base",
  subtitle: "mt-0.5 text-[11px] text-slate-400",
  metaKey: "font-mono text-slate-500",
  metaValue: "text-slate-300",
  refresh:
    "rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-60",
  list: "relative space-y-3 border-l border-slate-800 pl-4",
  ring: "ring-2 ring-slate-900",
  emptyText: "text-slate-500",
};

const PANEL_STYLES = {
  container:
    "rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08] shadow-xl shadow-black/30 backdrop-blur-sm sm:p-6",
  title: "text-sm font-semibold text-stone-100 sm:text-base",
  subtitle: "mt-0.5 text-[11px] text-stone-400",
  metaKey: "font-mono text-stone-500",
  metaValue: "text-stone-300",
  refresh:
    "rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-stone-100 disabled:opacity-60",
  list: "relative space-y-3 border-l border-white/10 pl-4",
  ring: "ring-2 ring-stone-950",
  emptyText: "text-stone-400",
};

const TONE_STYLES = {
  emerald: {
    pill: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
    bullet: "bg-emerald-400",
  },
  rose: {
    pill: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
    bullet: "bg-rose-400",
  },
  amber: {
    pill: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
    bullet: "bg-amber-400",
  },
  slate: {
    pill: "bg-slate-500/10 text-slate-300 ring-slate-500/30",
    bullet: "bg-slate-400",
  },
  sky: {
    pill: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
    bullet: "bg-sky-400",
  },
} as const;

export default function SubscriptionEventsTimeline({
  endpoint,
  variant = "admin",
  title = "Eventos de assinatura",
  subtitle = "Timeline de plano, upgrade, downgrade e expiração (últimos 50).",
}: Props) {
  const [items, setItems] = useState<SubscriptionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const S = variant === "panel" ? PANEL_STYLES : ADMIN_STYLES;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<SubscriptionEvent[]>(endpoint);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = formatApiError(err, "Erro ao carregar eventos.").message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section aria-label={title} className={S.container}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className={S.title}>{title}</h2>
          <p className={S.subtitle}>{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className={S.refresh}
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </header>

      {loading && items.length === 0 ? (
        <p className={`py-6 text-center text-xs ${S.emptyText}`}>
          Carregando eventos…
        </p>
      ) : error ? (
        <p className="py-6 text-center text-xs text-rose-300">{error}</p>
      ) : items.length === 0 ? (
        <p className={`py-6 text-center text-xs ${S.emptyText}`}>
          Nenhum evento registrado ainda.
        </p>
      ) : (
        <ol className={S.list}>
          {items.map((item) => {
            const tone = eventTone(item.event_type);
            const label = eventLabel(item.event_type);
            const planLabel =
              item.to_plan_name ||
              (item.plan_snapshot?.name as string | undefined) ||
              item.to_plan_slug ||
              "—";
            const fromLabel = item.from_plan_name || item.from_plan_slug;
            return (
              <li key={item.id} className="relative">
                <span
                  aria-hidden
                  className={`absolute -left-[22px] top-1 h-3 w-3 rounded-full ${TONE_STYLES[tone].bullet} ${S.ring}`}
                />
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ring-1 ${TONE_STYLES[tone].pill}`}
                  >
                    {label}
                  </span>
                  <span className={`text-[11px] ${S.metaKey}`}>por</span>
                  <span className={`text-[11px] font-semibold ${S.metaValue}`}>
                    {actorLabel(item.actor_type)}
                  </span>
                  <span
                    className={`ml-auto text-[10px] tabular-nums ${S.metaKey}`}
                    title={item.created_at}
                  >
                    {formatDateTime(item.created_at)}
                  </span>
                </div>

                <p className={`mt-1 text-[13px] ${S.metaValue}`}>
                  {fromLabel ? (
                    <>
                      <span className={S.metaKey}>{fromLabel}</span>
                      <span aria-hidden className="mx-1.5">
                        →
                      </span>
                    </>
                  ) : null}
                  <span className="font-semibold">{planLabel}</span>
                  {item.to_status && (
                    <>
                      <span aria-hidden className="mx-1.5">
                        ·
                      </span>
                      <span className={`text-[11px] ${S.metaKey}`}>
                        {item.to_status}
                      </span>
                    </>
                  )}
                </p>

                {item.meta && Object.keys(item.meta).length > 0 && (
                  <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                    {Object.entries(item.meta)
                      .filter(
                        ([, v]) =>
                          v === null ||
                          ["string", "number", "boolean"].includes(typeof v),
                      )
                      .map(([k, v]) => (
                        <div
                          key={k}
                          className="inline-flex items-baseline gap-1"
                        >
                          <dt className={S.metaKey}>{k}:</dt>
                          <dd className={S.metaValue}>{String(v)}</dd>
                        </div>
                      ))}
                  </dl>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
