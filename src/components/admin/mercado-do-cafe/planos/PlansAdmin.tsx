// src/components/admin/mercado-do-cafe/planos/PlansAdmin.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";

type Capabilities = {
  max_users?: number;
  // ETAPA 1.4 — null/undefined = ilimitado; número > 0 = cap mensal
  max_leads_per_month?: number | null;
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

type BroadcastPreview = {
  plan: {
    id: number;
    slug: string;
    name: string;
    capabilities_live: Capabilities;
  };
  affected_count: number;
  subscriptions: Array<{
    subscription_id: number;
    corretora_id: number;
    corretora_name: string;
    corretora_slug: string;
    corretora_city: string | null;
    corretora_state: string | null;
    status: string;
    has_snapshot: boolean;
    divergent_from_live: boolean;
  }>;
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Partial<Plan> | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  // Fase 5.4 — opt-in para propagar novas capabilities a assinaturas
  // ativas existentes. Padrão seguro é false: editar um plano NÃO
  // muda contratos vigentes a menos que admin marque explicitamente.
  const [applyToActive, setApplyToActive] = useState(false);
  const [preview, setPreview] = useState<BroadcastPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

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
    setApplyToActive(false);
    setSuccessMsg(null);
  };

  const startEdit = (p: Plan) => {
    setEditingId(p.id);
    setDraft({ ...p });
    setApplyToActive(false);
    setSuccessMsg(null);
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(null);
    setApplyToActive(false);
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

  const doSave = useCallback(
    async (confirmedApplyToActive: boolean) => {
      if (!draft) return;
      const payload: Record<string, unknown> = {
        ...draft,
        capabilities: draft.capabilities ?? {},
      };
      if (editingId && confirmedApplyToActive) {
        payload.apply_to_active_subscriptions = true;
      }
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      try {
        if (editingId) {
          const res = await apiClient.put<{
            data?: { broadcast?: { affected: number } | null };
            message?: string;
          }>(`/api/admin/monetization/plans/${editingId}`, payload);
          const affected = res?.data?.broadcast?.affected ?? null;
          if (confirmedApplyToActive && affected !== null) {
            setSuccessMsg(
              `Plano atualizado. ${affected} assinatura(s) receberam as novas capabilities.`,
            );
          } else {
            setSuccessMsg(
              "Plano atualizado. Assinaturas existentes continuam com a versão anterior.",
            );
          }
        } else {
          await apiClient.post("/api/admin/monetization/plans", payload);
          setSuccessMsg("Plano criado.");
        }
        setDraft(null);
        setEditingId(null);
        setApplyToActive(false);
        setPreview(null);
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
    },
    [draft, editingId, load, onUnauthorized],
  );

  const save = async () => {
    if (!draft) return;
    // Se admin não marcou broadcast, salva direto.
    if (!editingId || !applyToActive) {
      await doSave(false);
      return;
    }
    // Broadcast marcado — busca preview e abre modal de confirmação.
    // Só chama PUT depois que admin revisar lista de corretoras afetadas.
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await apiClient.get<{ data: BroadcastPreview }>(
        `/api/admin/monetization/plans/${editingId}/broadcast-preview`,
      );
      setPreview(res?.data ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized?.();
        return;
      }
      setPreviewError(
        err instanceof Error
          ? err.message
          : "Não foi possível calcular o impacto do broadcast.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmBroadcast = async () => {
    await doSave(true);
  };

  const closePreview = () => {
    setPreview(null);
    setPreviewError(null);
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

      {successMsg && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          {successMsg}
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
              <Field label="max_leads_per_month (vazio = ilimitado)">
                <input
                  type="number"
                  min={0}
                  value={draft.capabilities?.max_leads_per_month ?? ""}
                  onChange={(e) =>
                    updateCapability(
                      "max_leads_per_month",
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  placeholder="Ex: 50 no FREE"
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

          {editingId !== null && (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
              <label className="flex cursor-pointer items-start gap-2 text-xs font-semibold text-amber-100">
                <input
                  type="checkbox"
                  checked={applyToActive}
                  onChange={(e) => setApplyToActive(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-500/50 bg-slate-950 text-amber-400 focus:ring-amber-500"
                />
                Aplicar a assinaturas ativas existentes
              </label>
              <p className="mt-1 pl-6 text-[11px] text-amber-200/80">
                Por padrão, assinaturas ativas mantêm as capabilities que
                estavam no momento da contratação (snapshot). Marque para
                propagar as novas capabilities a todas as assinaturas ativas
                deste plano — ação auditada e irreversível.
              </p>
            </div>
          )}

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
              disabled={
                saving || previewLoading || !draft.name || !draft.slug
              }
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving
                ? "Salvando…"
                : previewLoading
                  ? "Calculando impacto…"
                  : editingId
                    ? applyToActive
                      ? "Revisar impacto…"
                      : "Salvar"
                    : "Criar"}
            </button>
          </div>
        </div>
      )}

      {preview && (
        <BroadcastPreviewModal
          preview={preview}
          error={previewError}
          saving={saving}
          onCancel={closePreview}
          onConfirm={confirmBroadcast}
        />
      )}
    </div>
  );
}

function BroadcastPreviewModal({
  preview,
  error,
  saving,
  onCancel,
  onConfirm,
}: {
  preview: BroadcastPreview;
  error: string | null;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { plan, affected_count, subscriptions } = preview;
  const hasAffected = affected_count > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="broadcast-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-amber-500/40 bg-slate-900 shadow-2xl">
        <header className="border-b border-slate-800 px-5 py-4">
          <h3
            id="broadcast-preview-title"
            className="text-base font-semibold text-amber-100"
          >
            Confirmar propagação de capabilities
          </h3>
          <p className="mt-1 text-[11px] text-slate-400">
            Plano{" "}
            <span className="font-semibold text-slate-200">{plan.name}</span>{" "}
            (<span className="text-slate-300">{plan.slug}</span>) — revise
            antes de aplicar.
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-3">
            <p className="text-xs font-semibold text-amber-100">
              Impacto:{" "}
              <span className="text-lg font-bold">{affected_count}</span>{" "}
              assinatura(s) ativa(s) receberão as novas capabilities deste
              plano.
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-200/80">
              Esta ação sobrescreve o snapshot de capabilities congelado no
              momento da contratação. É auditada e não pode ser desfeita
              automaticamente — se precisar reverter, edite o plano de volta
              e broadcasteie novamente.
            </p>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Capabilities que serão propagadas
            </p>
            <ul className="mt-2 grid gap-1 text-[11px] text-slate-300 sm:grid-cols-2">
              <li>
                max_users:{" "}
                <span className="text-slate-100">
                  {plan.capabilities_live.max_users ?? 1}
                </span>
              </li>
              <li>
                leads_export:{" "}
                <span className="text-slate-100">
                  {plan.capabilities_live.leads_export ? "sim" : "não"}
                </span>
              </li>
              <li>
                regional_highlight:{" "}
                <span className="text-slate-100">
                  {plan.capabilities_live.regional_highlight ? "sim" : "não"}
                </span>
              </li>
              <li>
                advanced_reports:{" "}
                <span className="text-slate-100">
                  {plan.capabilities_live.advanced_reports ? "sim" : "não"}
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Corretoras afetadas
            </p>
            {!hasAffected ? (
              <p className="mt-2 rounded-lg border border-dashed border-slate-700 bg-slate-900/40 px-3 py-3 text-xs text-slate-400">
                Nenhuma assinatura ativa no momento — o broadcast não terá
                efeito prático. Você ainda pode confirmar para atualizar o
                plano.
              </p>
            ) : (
              <ul className="mt-2 grid max-h-64 gap-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/40 p-2">
                {subscriptions.map((s) => (
                  <li
                    key={s.subscription_id}
                    className="flex items-center justify-between gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-2 py-1.5 text-[11px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-100">
                        {s.corretora_name}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        {[s.corretora_city, s.corretora_state]
                          .filter(Boolean)
                          .join(" / ") || "sem cidade"}
                        {" · "}
                        {s.status}
                      </p>
                    </div>
                    {s.divergent_from_live && (
                      <span className="shrink-0 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-200">
                        snapshot divergente
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="rounded-md bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {saving
              ? "Aplicando…"
              : `Confirmar e aplicar a ${affected_count} assinatura(s)`}
          </button>
        </footer>
      </div>
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
