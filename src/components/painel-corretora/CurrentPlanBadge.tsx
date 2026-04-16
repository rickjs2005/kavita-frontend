"use client";

// src/components/painel-corretora/CurrentPlanBadge.tsx
//
// Badge operacional do plano — mostra: nome, status, trial restante,
// uso de usuários, CTA de upgrade. Informativo, não decorativo.

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";

type PlanContext = {
  plan: { slug: string; name: string; price_cents: number };
  status: string;
  subscription?: {
    id: number;
    status: string;
    current_period_end: string | null;
    trial_ends_at: string | null;
  } | null;
  usage?: { users?: { used: number; limit: number | null } };
  capabilities?: Record<string, unknown>;
};

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / 86400000);
}

export function CurrentPlanBadge() {
  const [ctx, setCtx] = useState<PlanContext | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get<PlanContext>("/api/corretora/plan");
        setCtx(data);
      } catch {
        // silent
      }
    })();
  }, []);

  if (!ctx) return null;

  const isFree = ctx.plan.slug === "free";
  const isTrialing = ctx.subscription?.status === "trialing";
  const isExpired =
    ctx.subscription?.status === "expired" || ctx.status === "expired";

  const trialDays = daysUntil(ctx.subscription?.trial_ends_at);
  const periodDays = daysUntil(ctx.subscription?.current_period_end);

  const users = ctx.usage?.users;
  const showUsage =
    users && typeof users.limit === "number" && users.limit > 0;

  // Alerta de trial expirando (últimos 14 dias)
  const trialUrgent = isTrialing && trialDays !== null && trialDays <= 14;

  return (
    <div className="space-y-2">
      {/* Badge principal */}
      <Link
        href="/painel/corretora/planos"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
          isExpired
            ? "bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30"
            : isTrialing
              ? "bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/30"
              : isFree
                ? "bg-white/[0.04] text-stone-300 ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-amber-200"
                : "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40 hover:bg-amber-500/20"
        }`}
      >
        <span aria-hidden>
          {isExpired ? "⚠" : isTrialing ? "⏳" : isFree ? "☕" : "⭐"}
        </span>
        <span>
          Plano {ctx.plan.name}
          {isTrialing && " · Teste"}
          {isExpired && " · Expirado"}
        </span>
        {showUsage && (
          <span className="rounded-full bg-white/5 px-1.5 py-[1px] text-[9px] tracking-normal ring-1 ring-white/10">
            {users.used}/{users.limit}
          </span>
        )}
      </Link>

      {/* Alerta de trial expirando */}
      {trialUrgent && !isExpired && (
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2">
          <p className="text-[11px] font-medium text-amber-200">
            ⏳ Seu teste gratuito termina em{" "}
            <strong className="font-bold">
              {trialDays} {trialDays === 1 ? "dia" : "dias"}
            </strong>
            .{" "}
            <Link
              href="/painel/corretora/planos"
              className="font-semibold underline underline-offset-2 hover:text-amber-100"
            >
              Ver planos
            </Link>
          </p>
        </div>
      )}

      {/* Alerta de plano expirado */}
      {isExpired && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/[0.05] px-3 py-2">
          <p className="text-[11px] font-medium text-rose-200">
            ⚠ Seu período de teste expirou. Assine um plano para continuar
            usando a plataforma.{" "}
            <Link
              href="/painel/corretora/planos"
              className="font-semibold underline underline-offset-2 hover:text-rose-100"
            >
              Ver planos
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
