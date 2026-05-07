"use client";

// Workspace 3-painéis para gestão de modelos DJI Agras.
//
// Layout (desktop ≥ lg):
//   ┌ Lista modelos (240px) ┬ Editor central (flex) ┬ Preview status (300px) ┐
//   │ T25P                  │ Sub-tabs:             │ Hero ativo             │
//   │ T70P                  │ Specs · Features ·    │ Card ativo             │
//   │ T100                  │ Benefits · Galeria    │ Última edição          │
//   │ + Novo modelo         │                       │ Link público           │
//   └───────────────────────┴───────────────────────┴────────────────────────┘
//
// Mobile/tablet: lista vira <select>, editor full-width, preview some
// (info essencial migrada para um banner compacto sobre o editor).

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Layers,
  PlayCircle,
  Sparkles,
  Star,
} from "lucide-react";

import DroneModelSpecsEditor from "./DroneModelSpecsEditor";
import DroneModelFeaturesEditor from "./DroneModelFeaturesEditor";
import DroneModelBenefitsEditor from "./DroneModelBenefitsEditor";
import GalleryForm from "./GalleryForm";

import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { formatDateTime } from "@/utils/formatters";
import { absUrl } from "@/utils/absUrl";

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
  current_hero_media_id?: number | null;
  current_card_media_id?: number | null;
  updated_at?: string;
};

type GalleryRow = {
  id: number;
  media_type: "IMAGE" | "VIDEO";
  media_path: string;
  is_active?: 0 | 1;
};

type AdminModelAggregateResponse = {
  model?: { key: string; label: string; is_active?: 0 | 1 } | null;
  data?: ModelData | null;
  gallery?: GalleryRow[];
};

type EditorTabId = "specs" | "features" | "benefits" | "gallery";

const EDITOR_TABS: Array<{
  id: EditorTabId;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}> = [
  { id: "specs", label: "Specs", icon: Layers },
  { id: "features", label: "Funcionalidades", icon: Sparkles },
  { id: "benefits", label: "Benefícios", icon: Star },
  { id: "gallery", label: "Galeria", icon: ImageIcon },
];

function extractItemsArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const obj = payload as { items?: unknown; data?: unknown } | null;
  if (obj && Array.isArray(obj.items)) return obj.items as T[];
  if (obj && Array.isArray(obj.data)) return obj.data as T[];
  return [];
}

function fmtDateTime(v?: string) {
  return formatDateTime(v) || null;
}

export default function DroneModelContentPanel() {
  const [models, setModels] = useState<DroneModelRow[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const [selectedKey, setSelectedKey] = useState<string>("");
  const [loadingModel, setLoadingModel] = useState(false);
  const [modelData, setModelData] = useState<ModelData | null>(null);
  const [gallery, setGallery] = useState<GalleryRow[]>([]);
  const [editorTab, setEditorTab] = useState<EditorTabId>("specs");

  const [msg, setMsg] = useState<string | null>(null);

  const selected = useMemo(
    () => models.find((m) => m.key === selectedKey) || null,
    [models, selectedKey],
  );
  const selectedIsActive = String(selected?.is_active ?? 1) === "1";
  const lastUpdate = fmtDateTime(modelData?.updated_at);

  // Counts para a lista esquerda — ajuda admin a ver quais modelos
  // ainda precisam de configuração.
  const counts = useMemo(() => {
    const specsGroups = modelData?.specs_items_json?.length ?? 0;
    const features = modelData?.features_items_json?.length ?? 0;
    const benefits = modelData?.benefits_items_json?.length ?? 0;
    const galleryItems = gallery.length;
    return { specsGroups, features, benefits, galleryItems };
  }, [modelData, gallery]);

  const heroItem = useMemo(
    () =>
      modelData?.current_hero_media_id
        ? gallery.find((g) => g.id === modelData?.current_hero_media_id) ||
          null
        : null,
    [modelData, gallery],
  );
  const cardItem = useMemo(
    () =>
      modelData?.current_card_media_id
        ? gallery.find((g) => g.id === modelData?.current_card_media_id) ||
          null
        : null,
    [modelData, gallery],
  );

  async function loadModels(opts?: { keepSelection?: boolean }) {
    setLoadingModels(true);
    setMsg(null);
    try {
      const data = await apiClient.get(
        "/api/admin/drones/models?includeInactive=1",
      );
      const items = extractItemsArray<DroneModelRow>(data);
      const sorted = [...items].sort(
        (a, b) =>
          (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
          a.label.localeCompare(b.label),
      );
      setModels(sorted);

      const keep = opts?.keepSelection ?? true;
      if (!keep || !selectedKey || !sorted.some((x) => x.key === selectedKey)) {
        const firstActive =
          sorted.find((x) => String(x.is_active ?? 1) === "1") || sorted[0];
        if (firstActive?.key) setSelectedKey(firstActive.key);
      }
    } catch (err) {
      const ui = formatApiError(err, "Falha ao carregar modelos.");
      setMsg(ui.message);
    } finally {
      setLoadingModels(false);
    }
  }

  async function loadSelectedModel() {
    if (!selectedKey) return;
    setLoadingModel(true);
    setMsg(null);
    try {
      const agg = await apiClient.get<AdminModelAggregateResponse>(
        `/api/admin/drones/models/${selectedKey}`,
      );
      setModelData((agg?.data ?? null) as ModelData | null);
      setGallery(Array.isArray(agg?.gallery) ? agg.gallery : []);
    } catch (err) {
      const ui = formatApiError(err, "Falha ao carregar dados do modelo.");
      setMsg(ui.message);
      setModelData(null);
      setGallery([]);
    } finally {
      setLoadingModel(false);
    }
  }

  async function savePick(
    modelKey: string,
    target: "HERO" | "CARD",
    mediaId: number,
  ) {
    setMsg(null);
    setModelData((prev) => {
      const base = prev || {};
      if (target === "HERO") return { ...base, current_hero_media_id: mediaId };
      return { ...base, current_card_media_id: mediaId };
    });
    try {
      await apiClient.put(
        `/api/admin/drones/models/${modelKey}/media-selection`,
        { target, media_id: mediaId },
      );
      await loadSelectedModel();
    } catch (err) {
      const ui = formatApiError(err, "Falha ao salvar seleção.");
      setMsg(ui.message);
      await loadSelectedModel().catch(() => {});
      throw err;
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
    <div className="grid gap-4 lg:grid-cols-[240px_1fr_300px]">
      {/* ── PAINEL ESQUERDA: lista de modelos ───────────────────────── */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {/* Mobile: select compacto */}
        <div className="lg:hidden">
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-white"
          >
            {models.map((m) => (
              <option key={m.key} value={m.key} className="text-slate-900">
                {m.label} ({m.key})
              </option>
            ))}
          </select>
        </div>

        {/* Desktop: lista vertical */}
        <div className="hidden lg:block">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Modelos
            </p>
            <button
              type="button"
              onClick={() => loadModels({ keepSelection: true })}
              disabled={loadingModels}
              className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 hover:text-slate-200 disabled:opacity-50"
            >
              {loadingModels ? "..." : "Atualizar"}
            </button>
          </div>
          <div className="grid gap-1">
            {models.map((m) => {
              const active = m.key === selectedKey;
              const inactive = String(m.is_active ?? 1) === "0";
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSelectedKey(m.key)}
                  className={[
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-left transition",
                    active
                      ? "bg-emerald-500/15 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "inline-flex h-2 w-2 shrink-0 rounded-full",
                      inactive
                        ? "bg-slate-600"
                        : active
                          ? "bg-emerald-400"
                          : "bg-slate-500",
                    ].join(" ")}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold">
                      {m.label}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-slate-500">
                      {m.key.toUpperCase()}
                      {inactive ? " · inativo" : ""}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── PAINEL CENTRAL: editor ──────────────────────────────────── */}
      <main className="min-w-0">
        {/* Banner contextual com identidade do modelo */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
              DJI Agras · {selectedKey ? selectedKey.toUpperCase() : "—"}
            </p>
            <p className="mt-0.5 truncate text-base font-extrabold text-white">
              {selected?.label || "Selecione um modelo"}
            </p>
          </div>
          {selected ? (
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-bold uppercase tracking-[0.14em]",
                  selectedIsActive
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-400/30 bg-slate-500/10 text-slate-300",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    selectedIsActive ? "bg-emerald-400" : "bg-slate-500",
                  ].join(" ")}
                />
                {selectedIsActive ? "Ativo" : "Inativo"}
              </span>
              {lastUpdate ? <span>· edit. {lastUpdate}</span> : null}
            </div>
          ) : null}
        </div>

        {msg ? (
          <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            {msg}
          </div>
        ) : null}

        {/* Sub-tabs do editor */}
        <div className="mb-4 border-b border-white/8">
          <div className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide">
            {EDITOR_TABS.map((t) => {
              const isActive = t.id === editorTab;
              const Icon = t.icon;
              const count =
                t.id === "specs"
                  ? counts.specsGroups
                  : t.id === "features"
                    ? counts.features
                    : t.id === "benefits"
                      ? counts.benefits
                      : counts.galleryItems;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditorTab(t.id)}
                  className={[
                    "group relative inline-flex shrink-0 items-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold transition",
                    isActive ? "text-white" : "text-slate-400 hover:text-slate-100",
                  ].join(" ")}
                >
                  <Icon
                    className={[
                      "h-3.5 w-3.5",
                      isActive ? "text-emerald-300" : "text-slate-500",
                    ].join(" ")}
                    aria-hidden
                  />
                  {t.label}
                  {count > 0 ? (
                    <span
                      className={[
                        "ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold tabular-nums",
                        isActive
                          ? "bg-emerald-500 text-black"
                          : "bg-white/8 text-slate-300",
                      ].join(" ")}
                    >
                      {count}
                    </span>
                  ) : null}
                  <span
                    className={[
                      "absolute inset-x-1 -bottom-px h-[2px] rounded-full",
                      isActive ? "bg-emerald-400" : "bg-transparent",
                    ].join(" ")}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspace do editor */}
        {!selectedKey ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-sm text-slate-400">
            Selecione um modelo na lista à esquerda.
          </div>
        ) : loadingModel ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-6 text-sm text-slate-400">
            Carregando dados do modelo...
          </div>
        ) : (
          <>
            {editorTab === "specs" ? (
              <DroneModelSpecsEditor
                modelKey={selectedKey}
                initialTitle={modelData?.specs_title ?? "Especificações"}
                initialGroups={modelData?.specs_items_json ?? []}
                onSaved={(p) =>
                  setModelData((prev) => ({ ...(prev || {}), ...p }))
                }
              />
            ) : null}
            {editorTab === "features" ? (
              <DroneModelFeaturesEditor
                modelKey={selectedKey}
                initialTitle={modelData?.features_title ?? "Funcionalidades"}
                initialItems={modelData?.features_items_json ?? []}
                onSaved={(p) =>
                  setModelData((prev) => ({ ...(prev || {}), ...p }))
                }
              />
            ) : null}
            {editorTab === "benefits" ? (
              <DroneModelBenefitsEditor
                modelKey={selectedKey}
                initialTitle={modelData?.benefits_title ?? "Benefícios"}
                initialItems={modelData?.benefits_items_json ?? []}
                onSaved={(p) =>
                  setModelData((prev) => ({ ...(prev || {}), ...p }))
                }
              />
            ) : null}
            {editorTab === "gallery" ? (
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
            ) : null}
          </>
        )}
      </main>

      {/* ── PAINEL DIREITA: preview / status ────────────────────────── */}
      <aside className="hidden xl:block">
        <div className="lg:sticky lg:top-24 lg:self-start grid gap-3">
          <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Status do modelo
          </p>

          {/* Hero ativo */}
          <PreviewCard
            label="Hero"
            mediaItem={heroItem}
            empty="Nenhum hero selecionado"
            hint="Mídia destaque da página /drones/[id]"
          />

          {/* Card ativo */}
          <PreviewCard
            label="Card"
            mediaItem={cardItem}
            empty="Nenhum card selecionado"
            hint="Mídia que aparece nos cards de modelos da landing"
          />

          {/* Status do conteúdo */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Conteúdo configurado
            </p>
            <ul className="mt-2 grid gap-1.5 text-[12px]">
              <StatusLine
                ok={counts.specsGroups > 0}
                label="Specs"
                count={counts.specsGroups}
                unit={counts.specsGroups === 1 ? "grupo" : "grupos"}
              />
              <StatusLine
                ok={counts.features > 0}
                label="Funcionalidades"
                count={counts.features}
                unit="itens"
              />
              <StatusLine
                ok={counts.benefits > 0}
                label="Benefícios"
                count={counts.benefits}
                unit="itens"
              />
              <StatusLine
                ok={counts.galleryItems > 0}
                label="Galeria"
                count={counts.galleryItems}
                unit={counts.galleryItems === 1 ? "item" : "itens"}
              />
            </ul>
          </div>

          {/* Última atualização + link público */}
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Última edição
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-300">
              {lastUpdate || "—"}
            </p>
            {selectedKey ? (
              <a
                href={`/drones/${selectedKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/20"
              >
                <Eye className="h-3 w-3" aria-hidden />
                Ver pública
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}

function StatusLine({
  ok,
  label,
  count,
  unit,
}: {
  ok: boolean;
  label: string;
  count: number;
  unit: string;
}) {
  return (
    <li className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-slate-300">
        {ok ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
        ) : (
          <Circle className="h-3.5 w-3.5 text-slate-600" aria-hidden />
        )}
        {label}
      </span>
      <span
        className={[
          "tabular-nums",
          ok ? "text-slate-200" : "text-slate-500",
        ].join(" ")}
      >
        {count} {unit}
      </span>
    </li>
  );
}

function PreviewCard({
  label,
  mediaItem,
  empty,
  hint,
}: {
  label: string;
  mediaItem: GalleryRow | null;
  empty: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20">
      <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        <p className="text-[10px] text-slate-600" title={hint}>
          {mediaItem ? `#${mediaItem.id}` : "—"}
        </p>
      </div>
      <div className="aspect-video bg-black/40">
        {mediaItem ? (
          mediaItem.media_type === "VIDEO" ? (
            <div className="relative h-full w-full">
              <video
                className="h-full w-full object-cover"
                src={absUrl(mediaItem.media_path)}
                muted
                playsInline
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <PlayCircle className="h-8 w-8 text-white/80" aria-hidden />
              </div>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="h-full w-full object-cover"
              src={absUrl(mediaItem.media_path)}
              alt={`Preview ${label}`}
              loading="lazy"
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center">
            <ImageIcon className="h-5 w-5 text-slate-600" aria-hidden />
            <p className="text-[11px] font-bold text-slate-400">{empty}</p>
            <p className="text-[10px] text-slate-600">{hint}</p>
          </div>
        )}
      </div>
    </div>
  );
}
