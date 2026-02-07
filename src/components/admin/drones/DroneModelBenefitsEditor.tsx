"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type TextItem = { title?: string; text?: string };

type Toast = { type: "success" | "error" | "info"; text: string } | null;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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

function normalizeItems(v: any): TextItem[] {
  if (!Array.isArray(v)) return [];
  const out: TextItem[] = [];
  for (const x of v) {
    if (!x) continue;
    const title = typeof x?.title === "string" ? x.title : "";
    const text = typeof x?.text === "string" ? x.text : "";
    if (title.trim() || text.trim()) out.push({ title, text });
  }
  return out;
}

function ModelPill({ modelKey }: { modelKey: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
      <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
      Modelo: <b className="text-white">{modelKey.toUpperCase()}</b>
    </span>
  );
}

function ToastView({ toast }: { toast: Toast }) {
  if (!toast) return null;

  const cls =
    toast.type === "success"
      ? "border-emerald-200/20 bg-emerald-500/10 text-emerald-100"
      : toast.type === "error"
      ? "border-amber-200/20 bg-amber-500/10 text-amber-100"
      : "border-white/10 bg-white/5 text-white/80";

  return <div className={cx("rounded-2xl border px-4 py-3 text-sm", cls)}>{toast.text}</div>;
}

type Props = {
  modelKey: string;
  initialTitle?: string | null;
  initialItems?: TextItem[] | null;
  onSaved?: (payload: { benefits_title: string | null; benefits_items_json: TextItem[] }) => void;
};

export default function DroneModelBenefitsEditor({
  modelKey,
  initialTitle,
  initialItems,
  onSaved,
}: Props) {
  const [toast, setToast] = useState<Toast>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState<string>(initialTitle?.trim() || "Benefícios");
  const [items, setItems] = useState<TextItem[]>(normalizeItems(initialItems));

  useEffect(() => {
    setTitle(initialTitle?.trim() || "Benefícios");
    setItems(normalizeItems(initialItems));
    setToast(null);
  }, [initialTitle, initialItems, modelKey]);

  const canSave = useMemo(() => Boolean(modelKey), [modelKey]);

  function addItem() {
    setItems((prev) => [...prev, { title: "", text: "" }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, patch: Partial<TextItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function sanitizePayload() {
    const cleanTitle = title.trim() ? title.trim() : null;

    const cleanItems: TextItem[] = items
      .map((it) => ({
        title: (it.title || "").trim() || undefined,
        text: (it.text || "").trim() || undefined,
      }))
      .filter((it) => (it.title && it.title.trim()) || (it.text && it.text.trim()));

    return { benefits_title: cleanTitle, benefits_items_json: cleanItems };
  }

  async function save() {
    if (!canSave) return;

    setSaving(true);
    setToast(null);

    try {
      const payload = sanitizePayload();

      const res = await fetch(`${API_BASE}/api/admin/drones/models/${modelKey}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (isAuthError(res)) return redirectToLogin();

      const { data } = await readSafe(res);
      if (!res.ok) {
        throw new Error(data?.message || "Erro ao salvar benefícios.");
      }

      setToast({ type: "success", text: "Benefícios salvos com sucesso." });
      onSaved?.(payload);
    } catch (e: any) {
      setToast({ type: "error", text: e?.message || "Falha ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <ModelPill modelKey={modelKey} />
          <span className="hidden text-xs text-white/40 md:inline">
            Cards curtos (título opcional + descrição).
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addItem}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 active:scale-[0.99] transition"
          >
            + Item
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving || !canSave}
            className={cx(
              "rounded-xl px-4 py-2 text-sm font-medium text-white transition active:scale-[0.99]",
              saving || !canSave
                ? "bg-white/10 text-white/50"
                : "bg-emerald-500 hover:bg-emerald-400"
            )}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <ToastView toast={toast} />

      <div className="space-y-1">
        <label className="text-xs font-medium text-white/60">Título da seção</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
          placeholder="Ex: Benefícios"
        />
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-white/60">
            Nenhum item ainda. Clique em <b className="text-white">+ Item</b>.
          </div>
        ) : (
          items.map((it, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_10px_30px_-25px_rgba(0,0,0,0.9)]"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                  Item {idx + 1}
                </span>

                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition"
                >
                  Remover
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/60">Título (opcional)</label>
                  <input
                    value={it.title || ""}
                    onChange={(e) => updateItem(idx, { title: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Ex: Economia de insumos"
                  />
                </div>

                <div className="space-y-1 lg:col-span-2">
                  <label className="text-xs font-medium text-white/60">Descrição</label>
                  <textarea
                    value={it.text || ""}
                    onChange={(e) => updateItem(idx, { text: e.target.value })}
                    className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Escreva o texto do item... (curto e objetivo)"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
