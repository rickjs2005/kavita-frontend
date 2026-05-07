"use client";

// Editor de funcionalidades por modelo. Lista compacta — cada item é
// uma linha (título single-line + textarea curta). Densidade SaaS,
// sem cards inflados.

import React, { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type TextItem = { title?: string; text?: string };
type Toast = { type: "success" | "error" | "info"; text: string } | null;

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

function normalizeItems(v: unknown): TextItem[] {
  if (!Array.isArray(v)) return [];
  const out: TextItem[] = [];
  for (const x of v) {
    if (!x) continue;
    const obj = x as { title?: unknown; text?: unknown };
    const title = typeof obj?.title === "string" ? obj.title : "";
    const text = typeof obj?.text === "string" ? obj.text : "";
    if (title.trim() || text.trim()) out.push({ title, text });
  }
  return out;
}

type Props = {
  modelKey: string;
  initialTitle?: string | null;
  initialItems?: TextItem[] | null;
  onSaved?: (payload: {
    features_title: string | null;
    features_items_json: TextItem[];
  }) => void;
};

export default function DroneModelFeaturesEditor({
  modelKey,
  initialTitle,
  initialItems,
  onSaved,
}: Props) {
  const [toast, setToast] = useState<Toast>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState<string>(
    initialTitle?.trim() || "Funcionalidades",
  );
  const [items, setItems] = useState<TextItem[]>(normalizeItems(initialItems));

  useEffect(() => {
    setTitle(initialTitle?.trim() || "Funcionalidades");
    setItems(normalizeItems(initialItems));
    setToast(null);
  }, [initialTitle, initialItems, modelKey]);

  function addItem() {
    setItems((prev) => [...prev, { title: "", text: "" }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateItem(idx: number, patch: Partial<TextItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function moveItem(idx: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  async function save() {
    if (!modelKey) return;
    setSaving(true);
    setToast(null);
    try {
      const payload = {
        features_title: title.trim() || null,
        features_items_json: items
          .map((it) => ({
            title: (it.title || "").trim() || undefined,
            text: (it.text || "").trim() || undefined,
          }))
          .filter((it) => it.title || it.text),
      };
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
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-9 flex-1 min-w-[200px] rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/30"
          placeholder="Título da seção"
        />
        <span className="text-[11px] text-slate-400">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={addItem}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Item
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

      {toast ? (
        <div
          className={cx(
            "rounded-lg border px-3 py-2 text-xs",
            toast.type === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : "border-rose-400/30 bg-rose-500/10 text-rose-200",
          )}
        >
          {toast.text}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
          <p className="text-sm font-bold text-slate-100">
            Nenhuma funcionalidade ainda.
          </p>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20"
          >
            <Plus className="h-3 w-3" aria-hidden />
            Adicionar primeira
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map((it, idx) => (
            <div
              key={idx}
              className="group rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-white/15"
            >
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-0.5 pt-1.5">
                  <span className="text-[10px] font-bold text-slate-500 tabular-nums">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="flex-1 grid gap-1.5">
                  <input
                    value={it.title || ""}
                    onChange={(e) =>
                      updateItem(idx, { title: e.target.value })
                    }
                    className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-[13px] font-bold text-white outline-none placeholder:text-slate-500 hover:border-white/10 focus:border-emerald-400/40 focus:bg-black/30"
                    placeholder="Título da funcionalidade (Ex: Radar inteligente)"
                  />
                  <textarea
                    value={it.text || ""}
                    onChange={(e) =>
                      updateItem(idx, { text: e.target.value })
                    }
                    rows={2}
                    className="w-full resize-y rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[12.5px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 hover:border-white/10 focus:border-emerald-400/40 focus:bg-black/30"
                    placeholder="Descrição curta..."
                  />
                </div>
                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => moveItem(idx, -1)}
                    disabled={idx === 0}
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-[10px] text-slate-500 hover:bg-white/5 hover:text-slate-200 disabled:opacity-30"
                    title="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(idx, 1)}
                    disabled={idx === items.length - 1}
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-[10px] text-slate-500 hover:bg-white/5 hover:text-slate-200 disabled:opacity-30"
                    title="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="inline-flex h-6 w-6 items-center justify-center rounded text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
