"use client";

// Editor de especificações por modelo. Cards de grupo (Aeronave,
// Bateria, RTK...) com inputs compactos densidade SaaS premium.
// Cada grupo é um card autônomo com header próprio, contador de
// itens, botão "+ adicionar" no rodapé. Inputs single-line h-9 —
// nada de textarea inflado.

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, GripVertical, Layers, Plus, Save, Trash2, X } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type SpecsGroup = { title?: string; items?: string[] };

type Toast = { type: "success" | "error" | "info"; text: string } | null;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeGroups(v: unknown): SpecsGroup[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((g): SpecsGroup => {
      const obj = g as { title?: unknown; items?: unknown };
      return {
        title: typeof obj?.title === "string" ? obj.title : "",
        items: Array.isArray(obj?.items)
          ? (obj.items as unknown[]).filter(
              (x): x is string => typeof x === "string",
            )
          : [],
      };
    })
    .filter((g) => (g.title && g.title.trim()) || (g.items && g.items.length));
}

type Props = {
  modelKey: string;
  initialTitle?: string | null;
  initialGroups?: SpecsGroup[] | null;
  onSaved?: (payload: {
    specs_title: string | null;
    specs_items_json: SpecsGroup[];
  }) => void;
};

const SUGGESTED_GROUPS = [
  "Aeronave",
  "Pulverização",
  "Bateria",
  "RTK",
  "Radar",
  "Segurança",
];

export default function DroneModelSpecsEditor({
  modelKey,
  initialTitle,
  initialGroups,
  onSaved,
}: Props) {
  const [toast, setToast] = useState<Toast>(null);
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const [title, setTitle] = useState<string>(
    initialTitle?.trim() || "Especificações",
  );
  const [groups, setGroups] = useState<SpecsGroup[]>(
    normalizeGroups(initialGroups),
  );

  useEffect(() => {
    setTitle(initialTitle?.trim() || "Especificações");
    setGroups(normalizeGroups(initialGroups));
    setCollapsed({});
    setToast(null);
  }, [initialTitle, initialGroups, modelKey]);

  const totalItems = useMemo(
    () => groups.reduce((acc, g) => acc + (g.items?.length || 0), 0),
    [groups],
  );

  function addGroup(suggested?: string) {
    setGroups((prev) => [
      ...prev,
      { title: suggested ?? "Novo grupo", items: [""] },
    ]);
  }
  function removeGroup(idx: number) {
    setGroups((prev) => prev.filter((_, i) => i !== idx));
  }
  function moveGroup(idx: number, dir: -1 | 1) {
    setGroups((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }
  function updateGroupTitle(idx: number, v: string) {
    setGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, title: v } : g)));
  }
  function addItem(groupIdx: number) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx ? { ...g, items: [...(g.items || []), ""] } : g,
      ),
    );
  }
  function removeItem(groupIdx: number, itemIdx: number) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx
          ? { ...g, items: (g.items || []).filter((_, j) => j !== itemIdx) }
          : g,
      ),
    );
  }
  function updateItem(groupIdx: number, itemIdx: number, v: string) {
    setGroups((prev) =>
      prev.map((g, i) => {
        if (i !== groupIdx) return g;
        const items = [...(g.items || [])];
        items[itemIdx] = v;
        return { ...g, items };
      }),
    );
  }
  function moveItem(groupIdx: number, itemIdx: number, dir: -1 | 1) {
    setGroups((prev) =>
      prev.map((g, i) => {
        if (i !== groupIdx) return g;
        const items = [...(g.items || [])];
        const j = itemIdx + dir;
        if (j < 0 || j >= items.length) return g;
        [items[itemIdx], items[j]] = [items[j], items[itemIdx]];
        return { ...g, items };
      }),
    );
  }

  function sanitizePayload() {
    const cleanTitle = title.trim() ? title.trim() : null;
    const cleanGroups: SpecsGroup[] = groups
      .map((g) => ({
        title: (g.title || "").trim(),
        items: Array.isArray(g.items)
          ? g.items.map((x) => String(x || "").trim()).filter(Boolean)
          : [],
      }))
      .filter((g) => g.title || (g.items && g.items.length));
    return { specs_title: cleanTitle, specs_items_json: cleanGroups };
  }

  async function save() {
    if (!modelKey) return;
    setSaving(true);
    setToast(null);
    try {
      const payload = sanitizePayload();
      await apiClient.put(`/api/admin/drones/models/${modelKey}`, payload);
      setToast({ type: "success", text: "Salvo." });
      onSaved?.(payload);
    } catch (err) {
      const ui = formatApiError(err, "Falha ao salvar.");
      setToast({ type: "error", text: ui.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      {/* Toolbar compacta */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-9 flex-1 min-w-[200px] rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/30"
          placeholder="Título da seção (Ex: Especificações)"
        />
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Layers className="h-3.5 w-3.5" aria-hidden />
          <span>
            {groups.length} {groups.length === 1 ? "grupo" : "grupos"} ·{" "}
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => addGroup()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Grupo
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cx(
              "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-extrabold transition active:scale-[0.99]",
              saving
                ? "bg-emerald-500/30 text-emerald-200/60"
                : "bg-emerald-500 text-black hover:brightness-110",
            )}
          >
            <Save className="h-3.5 w-3.5" aria-hidden />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* Toast inline */}
      {toast ? (
        <div
          className={cx(
            "rounded-lg border px-3 py-2 text-xs",
            toast.type === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : toast.type === "error"
                ? "border-rose-400/30 bg-rose-500/10 text-rose-200"
                : "border-white/10 bg-white/5 text-slate-200",
          )}
        >
          {toast.text}
        </div>
      ) : null}

      {/* Estado vazio */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
          <p className="text-sm font-bold text-slate-100">
            Nenhum grupo de specs ainda.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Crie um grupo para começar — sugestão:
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {SUGGESTED_GROUPS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addGroup(s)}
                className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/20"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {groups.map((g, gi) => {
            const isCollapsed = Boolean(collapsed[gi]);
            const itemCount = g.items?.length ?? 0;
            return (
              <div
                key={gi}
                className="rounded-xl border border-white/10 bg-black/20 transition hover:border-white/15"
              >
                {/* Header do card */}
                <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsed((c) => ({ ...c, [gi]: !c[gi] }))
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    aria-label={isCollapsed ? "Expandir" : "Recolher"}
                  >
                    <ChevronDown
                      className={cx(
                        "h-4 w-4 transition",
                        isCollapsed ? "-rotate-90" : "",
                      )}
                      aria-hidden
                    />
                  </button>
                  <input
                    value={g.title || ""}
                    onChange={(e) => updateGroupTitle(gi, e.target.value)}
                    className="h-7 flex-1 rounded border border-transparent bg-transparent px-2 text-sm font-bold uppercase tracking-[0.04em] text-white outline-none placeholder:text-slate-500 hover:border-white/10 focus:border-emerald-400/40 focus:bg-black/30"
                    placeholder="Nome do grupo (Ex: Aeronave)"
                  />
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-300">
                    {itemCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveGroup(gi, -1)}
                    disabled={gi === 0}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-white/5 hover:text-slate-100 disabled:opacity-30"
                    title="Mover grupo para cima"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGroup(gi, 1)}
                    disabled={gi === groups.length - 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-white/5 hover:text-slate-100 disabled:opacity-30"
                    title="Mover grupo para baixo"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeGroup(gi)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200"
                    aria-label="Remover grupo"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>

                {/* Items do grupo */}
                {!isCollapsed && (
                  <div className="grid gap-1 p-2">
                    {(g.items || []).map((it, ii) => (
                      <div
                        key={ii}
                        className="group flex items-center gap-1 rounded transition hover:bg-white/[0.02]"
                      >
                        <GripVertical
                          className="h-4 w-4 shrink-0 cursor-grab text-slate-600 group-hover:text-slate-400"
                          aria-hidden
                        />
                        <input
                          value={it || ""}
                          onChange={(e) => updateItem(gi, ii, e.target.value)}
                          className="h-9 flex-1 rounded-md border border-transparent bg-transparent px-2 text-[13px] text-slate-100 outline-none placeholder:text-slate-600 hover:border-white/10 focus:border-emerald-400/40 focus:bg-black/40"
                          placeholder="Ex: Peso: 26 kg"
                        />
                        <button
                          type="button"
                          onClick={() => moveItem(gi, ii, -1)}
                          disabled={ii === 0}
                          className="inline-flex h-7 w-6 items-center justify-center rounded text-[11px] text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-white/5 hover:text-slate-200 disabled:opacity-0"
                          title="Mover para cima"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(gi, ii, 1)}
                          disabled={ii === itemCount - 1}
                          className="inline-flex h-7 w-6 items-center justify-center rounded text-[11px] text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-white/5 hover:text-slate-200 disabled:opacity-0"
                          title="Mover para baixo"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(gi, ii)}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-300"
                          aria-label="Remover item"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addItem(gi)}
                      className="mt-1 inline-flex h-8 items-center gap-1.5 self-start rounded-md border border-dashed border-white/10 bg-transparent px-2 text-[11px] font-semibold text-slate-400 hover:border-emerald-400/30 hover:bg-emerald-500/5 hover:text-emerald-200"
                    >
                      <Plus className="h-3 w-3" aria-hidden />
                      Adicionar item
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
