"use client";

import React, { useEffect, useMemo, useState } from "react";
import DroneModelSpecsEditor from "./DroneModelSpecsEditor";
import DroneModelFeaturesEditor from "./DroneModelFeaturesEditor";
import DroneModelBenefitsEditor from "./DroneModelBenefitsEditor";
import GalleryForm from "./GalleryForm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type DroneModelRow = {
  key: string;
  label: string;
  is_active?: 0 | 1;
  sort_order?: number;
};

type SpecsGroup = { title?: string; items?: string[] };
type TextItem = { title?: string; text?: string };

type ModelData = {
  specs_title?: string | null;
  specs_items_json?: SpecsGroup[] | null;

  features_title?: string | null;
  features_items_json?: TextItem[] | null;

  benefits_title?: string | null;
  benefits_items_json?: TextItem[] | null;

  // ✅ vem do models_json também (seleção de card/hero)
  current_hero_media_id?: number | null;
  current_card_media_id?: number | null;

  updated_at?: string;
};

type AdminModelAggregateResponse = {
  model?: { key: string; label: string } | null;
  data?: ModelData | null; // models_json[modelKey]
  gallery?: any[]; // galeria do modelo (array)
};

function isAuthError(res: Response) {
  return res.status === 401 || res.status === 403;
}

function redirectToLogin() {
  if (typeof window !== "undefined") window.location.assign("/admin/login");
}

async function readSafe(res: Response) {
  const txt = await res.text();
  try {
    return { txt, data: JSON.parse(txt) };
  } catch {
    return { txt, data: null as any };
  }
}

function extractItemsArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && Array.isArray(payload.items)) return payload.items as T[];
  if (payload && Array.isArray(payload.data)) return payload.data as T[];
  return [];
}

function fmtDateTime(v?: string) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-zinc-200 bg-zinc-50 text-zinc-600",
      ].join(" ")}
      title={active ? "Modelo ativo" : "Modelo inativo"}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-zinc-400",
        ].join(" ")}
      />
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function SectionShell({
  children,
  title,
  subtitle,
  right,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-white">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-white/60">{subtitle}</p> : null}
        </div>
        {right ? <div className="flex items-center gap-2">{right}</div> : null}
      </div>

      <div className="px-5 py-5">{children}</div>

      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
    </div>
  );
}

/**
 * ✅ Helper único pro admin:
 * - sempre manda cookies (credentials: include)
 * - redireciona no 401/403
 * - padroniza leitura de erro
 */
async function adminFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.headers || {}),
    },
  });

  if (isAuthError(res)) {
    redirectToLogin();
    throw new Error("AUTH");
  }

  const { data } = await readSafe(res);
  if (!res.ok) {
    throw new Error(data?.message || "Falha na requisição.");
  }

  return data as T;
}

export default function DroneModelContentPanel() {
  const [models, setModels] = useState<DroneModelRow[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const [selectedKey, setSelectedKey] = useState<string>("");

  const [loadingModel, setLoadingModel] = useState(false);
  const [modelLabel, setModelLabel] = useState<string>("");
  const [modelData, setModelData] = useState<ModelData | null>(null);

  const [msg, setMsg] = useState<string | null>(null);

  const selected = useMemo(
    () => models.find((m) => m.key === selectedKey) || null,
    [models, selectedKey]
  );

  const selectedIsActive = String(selected?.is_active ?? 1) === "1";
  const lastUpdate = fmtDateTime(modelData?.updated_at);

  async function loadModels(opts?: { keepSelection?: boolean }) {
    setLoadingModels(true);
    setMsg(null);

    try {
      const data = await adminFetchJson<any>("/api/admin/drones/models?includeInactive=1");
      const items = extractItemsArray<DroneModelRow>(data);

      const sorted = [...items].sort(
        (a, b) =>
          (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
          a.label.localeCompare(b.label)
      );

      setModels(sorted);

      const keep = opts?.keepSelection ?? true;
      if (!keep || !selectedKey || !sorted.some((x) => x.key === selectedKey)) {
        const firstActive = sorted.find((x) => String(x.is_active ?? 1) === "1") || sorted[0];
        if (firstActive?.key) setSelectedKey(firstActive.key);
      }
    } catch (e: any) {
      if (e?.message === "AUTH") return;
      setMsg(e?.message || "Falha ao carregar modelos.");
    } finally {
      setLoadingModels(false);
    }
  }

  async function loadSelectedModel() {
    if (!selectedKey) return;

    setLoadingModel(true);
    setMsg(null);

    try {
      const agg = await adminFetchJson<AdminModelAggregateResponse>(
        `/api/admin/drones/models/${selectedKey}`
      );

      const label = agg?.model?.label || selected?.label || selectedKey.toUpperCase();
      setModelLabel(label);

      setModelData((agg?.data ?? null) as any);
    } catch (e: any) {
      if (e?.message === "AUTH") return;
      setMsg(e?.message || "Falha ao carregar dados do modelo.");
      setModelData(null);
      setModelLabel("");
    } finally {
      setLoadingModel(false);
    }
  }

  /**
   * ✅ Salva seleção (CARD/HERO) no admin (do jeito mais seguro)
   * - Optimistic update em modelData (não em selectedKey!)
   * - Persiste via endpoint
   * - Recarrega aggregate como fonte da verdade
   */
  async function savePick(modelKey: string, target: "HERO" | "CARD", mediaId: number) {
    setMsg(null);

    // optimistic update (UI responde na hora)
    setModelData((prev) => {
      const base = prev || {};
      if (target === "HERO") return { ...base, current_hero_media_id: mediaId };
      return { ...base, current_card_media_id: mediaId };
    });

    try {
      const resp = await adminFetchJson<any>(
        `/api/admin/drones/models/${modelKey}/media-selection`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target, media_id: mediaId }),
        }
      );

      // se o backend devolver algo útil, aplica também (tolerante)
      const nextHero =
        resp?.current_hero_media_id ??
        resp?.data?.current_hero_media_id ??
        resp?.model?.current_hero_media_id;

      const nextCard =
        resp?.current_card_media_id ??
        resp?.data?.current_card_media_id ??
        resp?.model?.current_card_media_id;

      if (nextHero !== undefined || nextCard !== undefined) {
        setModelData((prev) => {
          const base = prev || {};
          return {
            ...base,
            ...(nextHero !== undefined ? { current_hero_media_id: Number(nextHero) } : null),
            ...(nextCard !== undefined ? { current_card_media_id: Number(nextCard) } : null),
          };
        });
      }

      // fonte da verdade
      await loadSelectedModel();
    } catch (e: any) {
      setMsg(e?.message || "Falha ao salvar seleção.");
      // garante consistência
      await loadSelectedModel().catch(() => {});
      throw e;
    }
  }

  useEffect(() => {
    loadModels({ keepSelection: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadSelectedModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0b1220] via-[#0b1220] to-[#070b13] p-5 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="text-xs text-white/50">
                Admin <span className="mx-1">/</span> Kavita Drones
              </div>

              <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">
                Modelos de Drones
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-white/60">
                Configure por modelo: <span className="text-white/80">especificações</span>,{" "}
                <span className="text-white/80">funcionalidades</span>,{" "}
                <span className="text-white/80">benefícios</span> e{" "}
                <span className="text-white/80">galeria</span>.
              </p>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <button
                type="button"
                onClick={() => loadModels({ keepSelection: true })}
                disabled={loadingModels}
                className={[
                  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium",
                  "border border-white/15 bg-white/5 text-white",
                  "hover:bg-white/10 active:scale-[0.99] transition",
                  "disabled:opacity-60 disabled:hover:bg-white/5",
                ].join(" ")}
              >
                {loadingModels ? "Atualizando..." : "Recarregar"}
              </button>

              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur">
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  className={[
                    "min-w-[260px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white",
                    "outline-none focus:ring-2 focus:ring-white/20",
                  ].join(" ")}
                >
                  {models.map((m) => (
                    <option key={m.key} value={m.key} className="text-zinc-900">
                      {m.label} ({m.key})
                    </option>
                  ))}
                </select>

                {selected ? <StatusPill active={selectedIsActive} /> : null}
              </div>
            </div>
          </div>

          <div className="mt-4">
            {msg ? (
              <div className="rounded-2xl border border-amber-200/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {msg}
              </div>
            ) : null}

            {loadingModel ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                Carregando dados do modelo...
              </div>
            ) : selectedKey ? (
              <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-white/70">
                  Editando: <b className="text-white">{modelLabel || selectedKey.toUpperCase()}</b>
                </div>
                {lastUpdate ? (
                  <div className="text-xs text-white/45">Última atualização: {lastUpdate}</div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {selectedKey ? (
        <div className="flex flex-col gap-5">
          <SectionShell title="Especificações" subtitle={`Por modelo: ${selectedKey.toUpperCase()}`}>
            <DroneModelSpecsEditor
              modelKey={selectedKey}
              initialTitle={modelData?.specs_title ?? "Especificações"}
              initialGroups={modelData?.specs_items_json ?? []}
              onSaved={(p) => setModelData((prev) => ({ ...(prev || {}), ...p }))}
            />
          </SectionShell>

          <SectionShell title="Funcionalidades" subtitle={`Por modelo: ${selectedKey.toUpperCase()}`}>
            <DroneModelFeaturesEditor
              modelKey={selectedKey}
              initialTitle={modelData?.features_title ?? "Funcionalidades"}
              initialItems={modelData?.features_items_json ?? []}
              onSaved={(p) => setModelData((prev) => ({ ...(prev || {}), ...p }))}
            />
          </SectionShell>

          <SectionShell title="Benefícios" subtitle={`Por modelo: ${selectedKey.toUpperCase()}`}>
            <DroneModelBenefitsEditor
              modelKey={selectedKey}
              initialTitle={modelData?.benefits_title ?? "Benefícios"}
              initialItems={modelData?.benefits_items_json ?? []}
              onSaved={(p) => setModelData((prev) => ({ ...(prev || {}), ...p }))}
            />
          </SectionShell>

          <SectionShell title="Galeria" subtitle={`Por modelo: ${selectedKey.toUpperCase()}`}>
            <GalleryForm
              modelKey={selectedKey}
              currentCardMediaId={modelData?.current_card_media_id ?? null}
              currentHeroMediaId={modelData?.current_hero_media_id ?? null}
              onPickForCard={async (item) => {
                await savePick(selectedKey, "CARD", item.id);
              }}
              onPickForHero={async (item) => {
                await savePick(selectedKey, "HERO", item.id);
              }}
            />
          </SectionShell>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
          Selecione um modelo para editar.
        </div>
      )}
    </div>
  );
}
