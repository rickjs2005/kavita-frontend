"use client";

// src/app/painel/corretora/planos/PlanosClient.tsx
//
// Tela interna de upgrade para corretora autenticada.
// Mostra plano atual + planos disponíveis + CTA de troca.
// NÃO redireciona para cadastro — age sobre a conta existente.

import { useCallback, useEffect, useState } from "react";
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

const FEATURE_LABELS: Record<string, string> = {
  max_users: "Usuários na equipe",
  leads_export: "Exportar leads (CSV)",
  regional_highlight: "Destaque regional",
  advanced_reports: "Relatórios avançados",
};

export default function PlanosClient() {
  const [current, setCurrent] = useState<PlanContext | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<number | null>(null);

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

  const handleUpgrade = async (planId: number) => {
    setUpgrading(planId);
    try {
      await apiClient.post("/api/corretora/plan/upgrade", {
        plan_id: planId,
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

      {/* Plano atual */}
      {current && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.03] p-5">
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

              {/* Features */}
              <ul className="mt-4 flex-1 space-y-2">
                {Object.entries(plan.capabilities ?? {}).map(([key, value]) => {
                  const label = FEATURE_LABELS[key];
                  if (!label) return null;
                  const isOn =
                    typeof value === "boolean"
                      ? value
                      : typeof value === "number" && value > 0;
                  return (
                    <li
                      key={key}
                      className="flex items-center gap-2 text-[12px]"
                    >
                      <span
                        className={`text-xs ${isOn ? "text-amber-300" : "text-stone-600"}`}
                      >
                        {isOn ? "✓" : "✕"}
                      </span>
                      <span
                        className={
                          isOn
                            ? "font-medium text-stone-200"
                            : "text-stone-500"
                        }
                      >
                        {label}
                        {typeof value === "number" && value > 0 && (
                          <span className="ml-1 text-stone-500">
                            · {value}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
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
                    onClick={() => handleUpgrade(plan.id)}
                    className={`block w-full rounded-xl px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.14em] transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      isFeatured
                        ? "bg-gradient-to-br from-amber-300 to-amber-500 text-stone-950 shadow-lg shadow-amber-500/30 hover:from-amber-200 hover:to-amber-400"
                        : "bg-white/[0.05] text-amber-200 ring-1 ring-white/10 hover:bg-white/[0.08] hover:ring-amber-400/30"
                    }`}
                  >
                    {upgrading === plan.id
                      ? "Atualizando..."
                      : plan.price_cents > current?.plan?.price_cents!
                        ? "Fazer upgrade"
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
