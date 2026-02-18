"use client";

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type SpecsGroup = { title?: string; items?: string[] };

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

function normalizeGroups(v: any): SpecsGroup[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((g) => ({
      title: typeof g?.title === "string" ? g.title : "",
      items: Array.isArray(g?.items) ? g.items.filter((x: any) => typeof x === "string") : [],
    }))
    .filter((g) => (g.title && g.title.trim()) || (g.items && g.items.length));
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
  initialGroups?: SpecsGroup[] | null;
  onSaved?: (payload: { specs_title: string | null; specs_items_json: SpecsGroup[] }) => void;
};

export default function DroneModelSpecsEditor({
  modelKey,
  initialTitle,
  initialGroups,
  onSaved,
}: Props) {
  const [toast, setToast] = useState<Toast>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState<string>(initialTitle?.trim() || "Especificações");
  const [groups, setGroups] = useState<SpecsGroup[]>(normalizeGroups(initialGroups));

  useEffect(() => {
    setTitle(initialTitle?.trim() || "Especificações");
    setGroups(normalizeGroups(initialGroups));
    setToast(null);
  }, [initialTitle, initialGroups, modelKey]);

  const canSave = useMemo(() => Boolean(modelKey), [modelKey]);

  function addGroup() {
    setGroups((prev) => [...prev, { title: "Aeronave", items: [""] }]);
  }

  function removeGroup(idx: number) {
    setGroups((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateGroupTitle(idx: number, v: string) {
    setGroups((prev) => prev.map((g, i) => (i === idx ? { ...g, title: v } : g)));
  }

  function addItem(groupIdx: number) {
    setGroups((prev) =>
      prev.map((g, i) => (i === groupIdx ? { ...g, items: [...(g.items || []), ""] } : g))
    );
  }

  function removeItem(groupIdx: number, itemIdx: number) {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === groupIdx ? { ...g, items: (g.items || []).filter((_, j) => j !== itemIdx) } : g
      )
    );
  }

  function updateItem(groupIdx: number, itemIdx: number, v: string) {
    setGroups((prev) =>
      prev.map((g, i) => {
        if (i !== groupIdx) return g;
        const items = [...(g.items || [])];
        items[itemIdx] = v;
        return { ...g, items };
      })
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
        throw new Error(data?.message || "Erro ao salvar especificações.");
      }

      setToast({ type: "success", text: "Especificações salvas com sucesso." });
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
            Organize em grupos (ex: Aeronave, Bateria, RTK…)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addGroup}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 active:scale-[0.99] transition"
          >
            + Grupo
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
          placeholder="Ex: Especificações"
        />
      </div>

      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-sm text-white/60">
            Nenhum grupo ainda. Clique em <b className="text-white">+ Grupo</b>.
          </div>
        ) : (
          groups.map((g, gi) => (
            <div
              key={gi}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_10px_30px_-25px_rgba(0,0,0,0.9)]"
            >
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <span className="w-fit rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
                  Grupo {gi + 1}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => addItem(gi)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition"
                  >
                    + Item
                  </button>

                  <button
                    type="button"
                    onClick={() => removeGroup(gi)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10 transition"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-white/60">Título do grupo</label>
                  <input
                    value={g.title || ""}
                    onChange={(e) => updateGroupTitle(gi, e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Ex: Aeronave"
                  />
                </div>

                <div className="space-y-2">
                  {(g.items || []).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-4 text-sm text-white/55">
                      Sem itens neste grupo. Clique em <b className="text-white">+ Item</b>.
                    </div>
                  ) : (
                    (g.items || []).map((it, ii) => (
                      <div key={ii} className="flex items-start gap-2">
                        <div className="flex-1">
                          <input
                            value={it || ""}
                            onChange={(e) => updateItem(gi, ii, e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-white/20"
                            placeholder="Ex: Peso: 26 kg (pulverização sem bateria)"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(gi, ii)}
                          className="mt-[2px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition"
                          title="Remover item"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
