// src/components/admin/mercado-do-cafe/planos/PlansAdmin.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";

type Capabilities = {
  max_users?: number;
  leads_export?: boolean;
  regional_highlight?: boolean;
  advanced_reports?: boolean;
};

type Plan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  billing_cycle: "monthly" | "yearly";
  capabilities: Capabilities;
  sort_order: number;
  is_public: boolean;
  is_active: boolean;
};

type Props = {
  onUnauthorized?: () => void;
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents || 0) / 100);
}

function emptyDraft(): Partial<Plan> {
  return {
    slug: "",
    name: "",
    description: "",
    price_cents: 0,
    billing_cycle: "monthly",
    capabilities: {
      max_users: 1,
      leads_export: false,
      regional_highlight: false,
      advanced_reports: false,
    },
    sort_order: 0,
    is_public: true,
    is_active: true,
  };
}

export default function PlansAdmin({ onUnauthorized }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<Plan> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ data: Plan[] }>(
        "/api/admin/monetization/plans",
      );
      setPlans(res?.data ?? []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized?.();
        return;
      }
      setError(
        err instanceof Error ? err.message : "Não foi possível carregar planos.",
      );
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const startNew = () => {
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const startEdit = (p: Plan) => {
    setEditingId(p.id);
    setDraft({ ...p });
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(null);
  };

  const updateField = <K extends keyof Plan>(key: K, value: Plan[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updateCapability = <K extends keyof Capabilities>(
    key: K,
    value: Capabilities[K],
  ) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            capabilities: { ...(prev.capabilities ?? {}), [key]: value },
          }
        : prev,
    );
  };

  const save = async () => {
    if (!draft) return;
    const payload = {
      ...draft,
      capabilities: draft.capabilities ?? {},
    };
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await apiClient.put(
          `/api/admin/monetization/plans/${editingId}`,
          payload,
        );
      } else {
        await apiClient.post("/api/admin/monetization/plans", payload);
      }
      setDraft(null);
      setEditingId(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized?.();
        return;
      }
      setError(err instanceof Error ? err.message : "Erro ao salvar plano.");
    } finally {
      setSaving(false);
    }
  };

  const orderedPlans = useMemo(
    () => [...plans].sort((a, b) => a.sort_order - b.sort_order),
    [plans],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-50">Planos SaaS</h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Defina capacidades (limites/feature flags) de cada plano das corretoras.
          </p>
        </div>
        <button
          type="button"
          onClick={startNew}
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
        >
          + Novo plano
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {error}
        </div>
      )}

      {loading ? (
        <ul className="grid gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li
              key={i}
              className="h-16 animate-pulse rounded-xl border border-slate-800 bg-slate-900/40"
            />
          ))}
        </ul>
      ) : orderedPlans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/30 p-6 text-center text-sm text-slate-400">
          Nenhum plano cadastrado. Clique em “Novo plano” para começar.
        </div>
      ) : (
        <ul className="grid gap-2">
          {orderedPlans.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 hover:border-emerald-500/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-50">
                      {p.name}
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
                      {p.slug}
                    </span>
                    {!p.is_active && (
                      <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-300">
                        inativo
                      </span>
                    )}
                    {!p.is_public && p.is_active && (
                      <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        oculto
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    {formatPrice(p.price_cents)} / {p.billing_cycle === "yearly" ? "ano" : "mês"}
                    {" · "}
                    max_users: {p.capabilities?.max_users ?? 1}
                    {p.capabilities?.leads_export && " · export"}
                    {p.capabilities?.regional_highlight && " · highlight"}
                    {p.capabilities?.advanced_reports && " · reports"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-[11px] font-medium text-slate-100 hover:bg-slate-700"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {draft && (
        <div className="rounded-2xl border border-emerald-500/30 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-emerald-200">
            {editingId ? "Editar plano" : "Novo plano"}
          </h4>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Slug (único)">
              <input
                value={draft.slug ?? ""}
                onChange={(e) =>
                  updateField("slug", e.target.value as Plan["slug"])
                }
                disabled={Boolean(editingId)}
                placeholder="free / pro / premium"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 disabled:opacity-60"
              />
            </Field>
            <Field label="Nome">
              <input
                value={draft.name ?? ""}
                onChange={(e) =>
                  updateField("name", e.target.value as Plan["name"])
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              />
            </Field>
            <Field label="Descrição">
              <input
                value={draft.description ?? ""}
                onChange={(e) =>
                  updateField(
                    "description",
                    e.target.value as Plan["description"],
                  )
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              />
            </Field>
            <Field label="Ciclo">
              <select
                value={draft.billing_cycle ?? "monthly"}
                onChange={(e) =>
                  updateField(
                    "billing_cycle",
                    e.target.value as Plan["billing_cycle"],
                  )
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              >
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </Field>
            <Field label="Preço (centavos)">
              <input
                type="number"
                min={0}
                value={draft.price_cents ?? 0}
                onChange={(e) =>
                  updateField(
                    "price_cents",
                    Number(e.target.value) as Plan["price_cents"],
                  )
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              />
            </Field>
            <Field label="Ordem de exibição">
              <input
                type="number"
                value={draft.sort_order ?? 0}
                onChange={(e) =>
                  updateField(
                    "sort_order",
                    Number(e.target.value) as Plan["sort_order"],
                  )
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
              />
            </Field>
          </div>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Capacidades
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <Field label="max_users (0 = ilimitado)">
                <input
                  type="number"
                  min={0}
                  value={draft.capabilities?.max_users ?? 1}
                  onChange={(e) =>
                    updateCapability("max_users", Number(e.target.value))
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100"
                />
              </Field>
              <CapabilityToggle
                label="Export CSV de leads"
                checked={Boolean(draft.capabilities?.leads_export)}
                onChange={(v) => updateCapability("leads_export", v)}
              />
              <CapabilityToggle
                label="Destaque regional"
                checked={Boolean(draft.capabilities?.regional_highlight)}
                onChange={(v) => updateCapability("regional_highlight", v)}
              />
              <CapabilityToggle
                label="Relatórios avançados"
                checked={Boolean(draft.capabilities?.advanced_reports)}
                onChange={(v) => updateCapability("advanced_reports", v)}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <CapabilityToggle
              label="Público (aparece na pricing)"
              checked={Boolean(draft.is_public)}
              onChange={(v) => updateField("is_public", v as Plan["is_public"])}
            />
            <CapabilityToggle
              label="Ativo"
              checked={Boolean(draft.is_active)}
              onChange={(v) => updateField("is_active", v as Plan["is_active"])}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={saving}
              className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !draft.name || !draft.slug}
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Salvando…" : editingId ? "Salvar" : "Criar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function CapabilityToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
      />
      <span className="text-xs text-slate-200">{label}</span>
    </label>
  );
}
