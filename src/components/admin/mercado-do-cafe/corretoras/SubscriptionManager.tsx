// src/components/admin/mercado-do-cafe/corretoras/SubscriptionManager.tsx
//
// Bloco inline de gestão de assinatura de uma corretora no admin.
// Mostra plano atual + status + trial + pagamento + vencimento.
// Permite editar direto no painel (PUT /api/admin/monetization/corretoras/:id/subscription).

"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import toast from "react-hot-toast";

type Subscription = {
  id: number;
  plan_id: number;
  plan_slug: string;
  plan_name: string;
  status: string;
  payment_method: string | null;
  monthly_price_cents: number | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  notes: string | null;
};

type Plan = {
  id: number;
  slug: string;
  name: string;
  price_cents: number;
  is_active: boolean;
};

type Props = {
  corretoraId: number;
  onUnauthorized?: () => void;
};

const STATUS_OPTIONS = [
  { value: "trialing", label: "Em teste" },
  { value: "active", label: "Ativa" },
  { value: "past_due", label: "Inadimplente" },
  { value: "canceled", label: "Cancelada" },
  { value: "expired", label: "Expirada" },
];

const PAYMENT_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "pix", label: "PIX" },
  { value: "boleto", label: "Boleto" },
  { value: "cartao", label: "Cartão" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatPrice(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

const inputClass =
  "h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 [color-scheme:dark]";
const labelClass =
  "mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400";

export function SubscriptionManager({ corretoraId, onUnauthorized }: Props) {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // Draft state
  const [planId, setPlanId] = useState<number>(0);
  const [status, setStatus] = useState("trialing");
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, plansRes] = await Promise.all([
        apiClient.get<{ current: Subscription | null }>(
          `/api/admin/monetization/corretoras/${corretoraId}/subscription`,
        ).catch(() => ({ current: null })),
        apiClient.get<Plan[]>("/api/admin/monetization/plans").catch(() => []),
      ]);
      const currentSub = subRes?.current ?? null;
      setSub(currentSub);
      setPlans(Array.isArray(plansRes) ? plansRes : []);
      if (currentSub) {
        setPlanId(currentSub.plan_id);
        setStatus(currentSub.status);
        setPaymentMethod(currentSub.payment_method ?? "manual");
        setMonthlyPrice(
          currentSub.monthly_price_cents != null
            ? String(currentSub.monthly_price_cents / 100)
            : "",
        );
        setTrialEndsAt(currentSub.trial_ends_at?.slice(0, 10) ?? "");
        setPeriodEnd(currentSub.current_period_end?.slice(0, 10) ?? "");
        setNotes(currentSub.notes ?? "");
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized?.();
      }
    } finally {
      setLoading(false);
    }
  }, [corretoraId, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const assign = async () => {
    if (!planId) {
      toast.error("Selecione um plano.");
      return;
    }
    setSaving(true);
    try {
      const trialEnd = new Date();
      trialEnd.setMonth(trialEnd.getMonth() + 3);
      await apiClient.post(
        `/api/admin/monetization/corretoras/${corretoraId}/subscription`,
        {
          plan_id: planId,
          status: "trialing",
          payment_method: "manual",
          monthly_price_cents: 0,
          trial_ends_at: trialEnd.toISOString(),
        },
      );
      toast.success("Plano atribuído.");
      setEditing(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atribuir.");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiClient.put(
        `/api/admin/monetization/corretoras/${corretoraId}/subscription`,
        {
          plan_id: planId,
          status,
          payment_method: paymentMethod,
          monthly_price_cents: monthlyPrice
            ? Math.round(Number(monthlyPrice) * 100)
            : null,
          trial_ends_at: trialEndsAt || null,
          current_period_end: periodEnd || null,
          notes: notes.trim() || null,
        },
      );
      toast.success("Assinatura atualizada.");
      setEditing(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs text-slate-500">Carregando plano...</p>
      </div>
    );
  }

  // Sem subscription — mostrar botão de atribuir
  if (!sub) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
          Plano e assinatura
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Nenhum plano atribuído. Atribua um plano para ativar funcionalidades.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <select
            value={planId}
            onChange={(e) => setPlanId(Number(e.target.value))}
            className={inputClass}
          >
            <option value={0}>Selecionar plano...</option>
            {plans
              .filter((p) => p.is_active)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatPrice(p.price_cents)}/mês
                </option>
              ))}
          </select>
          <button
            type="button"
            onClick={assign}
            disabled={saving || !planId}
            className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {saving ? "..." : "Atribuir com 3 meses grátis"}
          </button>
        </div>
      </div>
    );
  }

  // Com subscription — mostrar resumo ou form de edição
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
          Plano e assinatura
        </p>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-[10px] font-semibold text-slate-400 hover:text-emerald-300"
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
      </div>

      {!editing ? (
        // ── Resumo ──
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem label="Plano" value={sub.plan_name} highlight />
          <SummaryItem
            label="Status"
            value={STATUS_OPTIONS.find((o) => o.value === sub.status)?.label ?? sub.status}
            highlight={sub.status === "trialing" || sub.status === "active"}
          />
          <SummaryItem
            label="Pagamento"
            value={PAYMENT_OPTIONS.find((o) => o.value === sub.payment_method)?.label ?? sub.payment_method ?? "—"}
          />
          <SummaryItem
            label="Valor mensal"
            value={formatPrice(sub.monthly_price_cents)}
          />
          <SummaryItem
            label="Trial até"
            value={formatDate(sub.trial_ends_at)}
          />
          <SummaryItem
            label="Vencimento"
            value={formatDate(sub.current_period_end)}
          />
          {sub.notes && (
            <div className="sm:col-span-2 lg:col-span-4">
              <SummaryItem label="Observação" value={sub.notes} />
            </div>
          )}
        </div>
      ) : (
        // ── Formulário de edição ──
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Plano</label>
              <select value={planId} onChange={(e) => setPlanId(Number(e.target.value))} className={inputClass}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Forma de pagamento</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                {PAYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Valor mensal (R$)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                className={inputClass}
                placeholder="Ex: 149"
              />
            </div>
            <div>
              <label className={labelClass}>Trial até</label>
              <input
                type="date"
                value={trialEndsAt}
                onChange={(e) => setTrialEndsAt(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Vencimento</label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Observação interna</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} h-auto py-2`}
              placeholder="Ex: Combinou PIX mensal a partir de julho..."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-medium ${highlight ? "text-emerald-200" : "text-slate-200"}`}>
        {value}
      </p>
    </div>
  );
}
