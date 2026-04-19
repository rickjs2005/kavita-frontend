"use client";

// src/app/painel/corretora/planos/PlanosClient.tsx
//
// Tela interna de upgrade para corretora autenticada.
// Mostra plano atual + planos disponíveis + CTA de troca.
// NÃO redireciona para cadastro — age sobre a conta existente.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import SubscriptionEventsTimeline from "@/components/mercado-do-cafe/SubscriptionEventsTimeline";

type Plan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  billing_cycle: string;
  capabilities: Record<string, unknown>;
};

type PlanContext = {
  plan: { slug: string; name: string; price_cents: number };
  status: string;
  subscription?: {
    id: number;
    status: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
    // ETAPA 1.2 — checkout pendente que a corretora pode reabrir
    pending_checkout_url?: string | null;
    pending_checkout_at?: string | null;
    provider_status?: string | null;
  } | null;
  capabilities?: Record<string, unknown>;
};

function formatPrice(cents: number): string {
  if (cents === 0) return "Gratuito";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

// Labels + descrições curtas de cada feature. Descrições viram hint
// no hover e aparecem no callout de "feature bloqueada".
type FeatureMeta = {
  label: string;
  hint: string;
  // Formatador específico para capabilities numéricas. Se ausente, a
  // chave é tratada como boolean (✓/✕) e o número é mostrado cru.
  format?: (value: number) => string;
};

const FEATURE_META: Record<string, FeatureMeta> = {
  max_leads_per_month: {
    label: "Leads/mês",
    hint: "Quantos leads novos você pode receber neste plano por mês.",
    format: (n) => (n >= 9999 ? "Ilimitados" : `${n} por mês`),
  },
  max_users: {
    label: "Usuários na equipe",
    hint: "Quantas pessoas podem entrar no painel (owner + manager + sales + viewer).",
    format: (n) => (n === 1 ? "1 usuário" : `${n} usuários`),
  },
  leads_export: {
    label: "Exportar leads (CSV)",
    hint: "Baixar planilha com os leads recebidos no período.",
  },
  regional_highlight: {
    label: "Destaque regional",
    hint: "Aparecer em posição destacada na vitrine pública da Zona da Mata.",
  },
  advanced_reports: {
    label: "Relatórios avançados",
    hint: "SLA, conversão, origem dos leads e desempenho por cidade.",
  },
  quick_replies: {
    label: "Respostas rápidas personalizadas",
    hint: "Criar e editar seus próprios templates de WhatsApp.",
  },
  priority_support: {
    label: "Suporte prioritário",
    hint: "Atendimento direto pela curadoria Kavita nos dias úteis.",
  },
};

// Ordem de exibição em cada card (estável, não alfabética). Chaves
// não mapeadas aqui aparecem no fim na ordem do backend.
const FEATURE_ORDER: string[] = [
  "max_leads_per_month",
  "max_users",
  "leads_export",
  "quick_replies",
  "regional_highlight",
  "advanced_reports",
  "priority_support",
];

function formatCapability(key: string, value: unknown): {
  on: boolean;
  display: string | null;
} {
  const meta = FEATURE_META[key];
  if (typeof value === "number") {
    const on = value > 0;
    if (!on) return { on, display: null };
    return {
      on,
      display: meta?.format ? meta.format(value) : String(value),
    };
  }
  if (typeof value === "boolean") {
    return { on: value, display: null };
  }
  return { on: false, display: null };
}

export default function PlanosClient() {
  const [current, setCurrent] = useState<PlanContext | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<number | null>(null);
  // Estado do fluxo de cancelamento — modal + motivo + request in-flight.
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [canceling, setCanceling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ctx, available] = await Promise.all([
        apiClient.get<PlanContext>("/api/corretora/plan"),
        apiClient.get<Plan[]>("/api/corretora/plan/available"),
      ]);
      setCurrent(ctx);
      setPlans(Array.isArray(available) ? available : []);
    } catch {
      toast.error("Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCancelConfirm = async () => {
    setCanceling(true);
    try {
      const res = await apiClient.post<{ already_free?: boolean }>(
        "/api/corretora/plan/cancel",
        { reason: cancelReason.trim() || undefined },
      );
      if (res?.already_free) {
        toast("Você já estava no plano gratuito.", { icon: "ℹ️" });
      } else {
        toast.success("Plano cancelado. Você voltou ao plano gratuito.");
      }
      setCancelOpen(false);
      setCancelReason("");
      await load();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao cancelar plano.").message);
    } finally {
      setCanceling(false);
    }
  };

  const handleUpgrade = async (plan: Plan) => {
    setUpgrading(plan.id);
    try {
      // Fase 6 — plano pago: tenta checkout Asaas primeiro. Se gateway
      // indisponível (dev/sandbox sem credenciais), cai pro fluxo
      // manual. Plano gratuito (price_cents=0) pula direto pro manual
      // — não faz sentido gerar cobrança zerada.
      if (plan.price_cents > 0) {
        const checkout = await apiClient.post<{
          gateway_available: boolean;
          checkout_url?: string;
          provider?: string;
        }>("/api/corretora/plan/checkout", { plan_id: plan.id });

        if (checkout.gateway_available && checkout.checkout_url) {
          toast.success("Abrindo cobrança…");
          // Abre em nova aba para o produtor não perder a sessão no painel
          window.open(checkout.checkout_url, "_blank", "noopener,noreferrer");
          // Após o pagamento, o webhook do Asaas atualiza status. A UI
          // consulta /plan no next load — aqui só damos orientação.
          toast.success(
            "Depois de pagar, seu plano atualiza automaticamente em alguns minutos.",
            { duration: 8000 },
          );
          return;
        }
        // Gateway indisponível — informa, cai pro manual
        toast(
          "Pagamento automático indisponível. Um administrador vai confirmar seu upgrade.",
          { icon: "ℹ️", duration: 5000 },
        );
      }

      // Fluxo manual (FREE ou gateway off): troca o plano direto
      await apiClient.post("/api/corretora/plan/upgrade", {
        plan_id: plan.id,
      });
      toast.success("Plano atualizado com sucesso!");
      await load();
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao trocar plano.").message);
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-white/[0.04] bg-stone-900/50"
          />
        ))}
      </div>
    );
  }

  const currentSlug = current?.plan?.slug ?? "free";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
          Minha assinatura
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
          Gerenciar plano
        </h1>
        <p className="mt-1 text-sm text-stone-400">
          Sua conta já está ativa. Para mudar de plano, basta escolher abaixo —
          sem novo cadastro.
        </p>
      </div>

      {/* ETAPA 1.2 — checkout pendente. Aparece em destaque acima do
          plano atual quando a corretora iniciou cobrança mas não
          completou pagamento. Link clicável reabre o mesmo checkout
          no gateway; nenhuma cobrança duplicada é criada. Timestamp
          "há X horas" orienta; se > 24h, copy sugere gerar um novo. */}
      {current?.subscription?.pending_checkout_url && (
        <PendingCheckoutBanner
          url={current.subscription.pending_checkout_url}
          startedAt={current.subscription.pending_checkout_at ?? null}
        />
      )}

      {/* Plano atual — mostra card + botão "Cancelar assinatura" quando
          é plano pago. O cancelamento volta a corretora pro FREE, sem
          perder acesso nem leads. */}
      {current && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.03] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300">
                Plano atual
              </p>
              <p className="mt-1 text-lg font-bold text-stone-50">
                {current.plan.name}
                <span className="ml-2 text-sm font-medium text-stone-400">
                  {formatPrice(current.plan.price_cents)}
                  {current.plan.price_cents > 0 ? "/mês" : ""}
                </span>
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Status:{" "}
                <span
                  className={`font-semibold ${
                    current.subscription?.status === "trialing"
                      ? "text-amber-200"
                      : current.subscription?.status === "active"
                        ? "text-emerald-300"
                        : "text-rose-300"
                  }`}
                >
                  {current.subscription?.status === "trialing"
                    ? "Em teste"
                    : current.subscription?.status === "active"
                      ? "Ativa"
                      : current.subscription?.status === "expired"
                        ? "Expirada"
                        : current.status === "free_default"
                          ? "Sem assinatura"
                          : current.subscription?.status ?? "—"}
                </span>
              </p>
            </div>

            {/* Botão cancelar — aparece só se for plano pago (FREE não
                tem o que cancelar). Texto secundário pra não competir
                com o CTA primário de upgrade nos cards abaixo. */}
            {current.plan.price_cents > 0 && (
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="shrink-0 self-start text-xs font-semibold text-stone-400 underline-offset-4 transition-colors hover:text-rose-300 hover:underline sm:self-auto"
              >
                Cancelar assinatura
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmação — "zona de alerta" do cancelamento.
          Overlay full-screen bloqueia interação no resto; ESC/click fora
          fecha. Motivo é opcional (feedback valioso de churn). */}
      {cancelOpen && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar cancelamento"
          className="fixed inset-0 z-50 flex items-end justify-center bg-stone-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => !canceling && setCancelOpen(false)}
            className="absolute inset-0 cursor-default"
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-stone-900 ring-1 ring-white/[0.08] shadow-2xl shadow-black/60 sm:rounded-2xl">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/40 to-transparent"
            />
            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-stone-50">
                    Cancelar assinatura {current.plan.name}?
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-400">
                    Você vai voltar ao plano <strong className="text-stone-200">Gratuito</strong>.
                    Seus leads, notas e histórico continuam aqui, mas os
                    recursos pagos (exportação, destaque regional, usuários
                    extras) ficam indisponíveis.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="cancel-reason"
                  className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400"
                >
                  Motivo (opcional)
                </label>
                <p className="mt-1 text-[11px] text-stone-500">
                  Ajuda a gente a entender o que melhorar — totalmente confidencial.
                </p>
                <textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value.slice(0, 500))}
                  rows={3}
                  disabled={canceling}
                  placeholder="Ex: preço, período parado, falta de leads na região…"
                  className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-stone-950 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400/60 focus:outline-none focus:ring-1 focus:ring-amber-400/25 disabled:opacity-60 [color-scheme:dark]"
                />
                <p className="mt-1 text-right text-[10px] text-stone-600 tabular-nums">
                  {cancelReason.length}/500
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCancelOpen(false)}
                  disabled={canceling}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-stone-200 transition-colors hover:bg-white/[0.08] disabled:opacity-60"
                >
                  Manter assinatura
                </button>
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={canceling}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-rose-500/90 px-5 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition-colors hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60"
                >
                  {canceling ? "Cancelando…" : "Cancelar e voltar ao FREE"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Planos disponíveis */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.slug === currentSlug;
          const isFeatured = plan.slug === "pro";

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col overflow-hidden rounded-2xl p-5 ring-1 md:p-6 ${
                isCurrent
                  ? "bg-amber-400/[0.05] ring-amber-400/30"
                  : isFeatured
                    ? "bg-stone-900 ring-amber-400/20"
                    : "bg-stone-900 ring-white/[0.06]"
              }`}
            >
              {isCurrent && (
                <span className="absolute right-3 top-3 rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-200 ring-1 ring-amber-400/40">
                  Atual
                </span>
              )}
              {isFeatured && !isCurrent && (
                <span className="absolute right-3 top-3 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-300 ring-1 ring-emerald-500/30">
                  Recomendado
                </span>
              )}

              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                {plan.name}
              </p>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tabular-nums text-stone-50">
                  {formatPrice(plan.price_cents)}
                </span>
                {plan.price_cents > 0 && (
                  <span className="text-sm text-stone-400">/mês</span>
                )}
              </div>
              {plan.description && (
                <p className="mt-2 text-[12px] leading-relaxed text-stone-400">
                  {plan.description}
                </p>
              )}

              {/* Features — ordem estável (FEATURE_ORDER) + fallback
                  pro resto; quando o plano tem cap numérico, mostra o
                  limite legível ("500 por mês", "3 usuários"). Valores
                  off ou zero aparecem atenuados com "—". */}
              <ul className="mt-4 flex-1 space-y-2">
                {(() => {
                  const caps = plan.capabilities ?? {};
                  const known = FEATURE_ORDER.filter((k) =>
                    Object.prototype.hasOwnProperty.call(caps, k),
                  );
                  const extras = Object.keys(caps).filter(
                    (k) => !FEATURE_ORDER.includes(k) && FEATURE_META[k],
                  );
                  const orderedKeys = [...known, ...extras];
                  return orderedKeys.map((key) => {
                    const meta = FEATURE_META[key];
                    if (!meta) return null;
                    const { on, display } = formatCapability(
                      key,
                      caps[key],
                    );
                    return (
                      <li
                        key={key}
                        className="flex items-start gap-2 text-[12px]"
                        title={meta.hint}
                      >
                        <span
                          aria-hidden
                          className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            on
                              ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                              : "bg-white/[0.04] text-stone-600 ring-1 ring-white/[0.06]"
                          }`}
                        >
                          {on ? "✓" : "—"}
                        </span>
                        <span
                          className={`min-w-0 flex-1 ${
                            on
                              ? "text-stone-200"
                              : "text-stone-500 line-through decoration-stone-700"
                          }`}
                        >
                          <span className="font-medium">{meta.label}</span>
                          {display && (
                            <span className="ml-1 font-semibold text-amber-200/90">
                              · {display}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  });
                })()}
              </ul>

              {/* CTA */}
              <div className="mt-5">
                {isCurrent ? (
                  <span className="block w-full rounded-xl bg-white/[0.04] px-4 py-2.5 text-center text-[11px] font-semibold text-stone-400 ring-1 ring-white/[0.06]">
                    Plano atual
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={upgrading !== null}
                    onClick={() => handleUpgrade(plan)}
                    className={`block w-full rounded-xl px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      isFeatured
                        ? "bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 hover:from-amber-200 hover:to-amber-400"
                        : "bg-white/[0.05] text-amber-200 ring-1 ring-white/10 hover:bg-white/[0.08] hover:ring-amber-400/30"
                    }`}
                  >
                    {upgrading === plan.id
                      ? plan.price_cents > 0
                        ? "Gerando cobrança…"
                        : "Atualizando…"
                      : plan.price_cents === 0
                        ? "Usar gratuito"
                        : plan.price_cents > (current?.plan?.price_cents ?? 0)
                          ? "Assinar agora"
                          : "Mudar plano"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline — transparência sobre trial/upgrade/downgrade.
          Reutiliza o componente compartilhado (mesmo que o admin vê),
          só muda o chrome para o tema dark do painel. */}
      <SubscriptionEventsTimeline
        endpoint="/api/corretora/plan/events"
        variant="panel"
        title="Histórico da sua assinatura"
        subtitle="Trial, upgrades e renovações que aconteceram nesta corretora."
      />

      {/* Nota de segurança */}
      <p className="text-center text-[11px] text-stone-500">
        A troca de plano atualiza sua assinatura atual. Nenhuma corretora nova é
        criada.{" "}
        <Link
          href="/painel/corretora"
          className="font-semibold text-amber-300/70 hover:text-amber-200"
        >
          Voltar ao painel
        </Link>
      </p>
    </div>
  );
}

// ─── ETAPA 1.2 — Banner de checkout pendente ─────────────────────────
function PendingCheckoutBanner({
  url,
  startedAt,
}: {
  url: string;
  startedAt: string | null;
}) {
  const ageLabel = useMemo(() => {
    if (!startedAt) return null;
    try {
      const ms = Date.now() - new Date(startedAt).getTime();
      const hrs = Math.floor(ms / 3_600_000);
      if (hrs < 1) return "iniciado há menos de 1h";
      if (hrs < 24) return `iniciado há ${hrs}h`;
      const days = Math.floor(hrs / 24);
      return `iniciado há ${days}d`;
    } catch {
      return null;
    }
  }, [startedAt]);

  const isStale =
    startedAt &&
    Date.now() - new Date(startedAt).getTime() > 24 * 3_600_000;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-amber-500/[0.06] p-5 shadow-lg shadow-amber-500/10">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            Pagamento pendente
          </p>
          <p className="mt-1 text-[14px] font-semibold text-stone-50">
            Você iniciou uma cobrança e ainda não finalizou o pagamento.
          </p>
          <p className="mt-1 text-[12px] text-stone-300">
            Clique em <span className="font-semibold">Reabrir link</span>{" "}
            para concluir no mesmo gateway
            {ageLabel ? ` · ${ageLabel}` : ""}.
            {isStale &&
              " Se o link já expirou, escolha o plano novamente abaixo para gerar um novo."}
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400"
        >
          Reabrir link
          <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  );
}
