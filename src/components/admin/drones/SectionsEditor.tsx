"use client";

// Editor de seções editáveis da landing /drones (why/who/how/trust).
// Interface única: admin escolhe a seção (botões), edita title/subtitle
// e gerencia a lista de items (icon/title/text/badge). Salva via PUT
// upsert. Itens podem ser reordenados, adicionados e removidos.

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { ICON_KEYS } from "@/lib/drones/sectionIcons";

type SectionItem = {
  icon?: string | null;
  title?: string | null;
  text?: string | null;
  badge?: string | null;
};

type SectionDraft = {
  section_key: string;
  title: string;
  subtitle: string;
  items: SectionItem[];
  is_active: 0 | 1;
  sort_order: number;
};

const KNOWN_SECTIONS: Array<{ key: string; label: string; hint: string }> = [
  {
    key: "why",
    label: "Por que usar drones",
    hint: "Cards educativos sobre vantagens da pulverização aérea.",
  },
  {
    key: "who",
    label: "Para quem é",
    hint:
      "Segmentação de público (pequenas/grandes propriedades, prestadores). Use o campo Badge para indicar o modelo recomendado.",
  },
  {
    key: "how",
    label: "Como funciona",
    hint:
      "Etapas do fluxo. A numeração 01/02/... é gerada pela ordem dos itens.",
  },
  {
    key: "trust",
    label: "Por que escolher a Kavita",
    hint: "Pilares de confiança. Ícone é opcional nesta seção.",
  },
];

const EMPTY_DRAFT: SectionDraft = {
  section_key: "why",
  title: "",
  subtitle: "",
  items: [],
  is_active: 1,
  sort_order: 0,
};

export default function SectionsEditor() {
  const [activeKey, setActiveKey] = useState<string>("why");
  const [draft, setDraft] = useState<SectionDraft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [exists, setExists] = useState(false);

  async function load(key: string) {
    setLoading(true);
    setMsg(null);
    try {
      const res = await apiClient.get<{
        section_key: string;
        title: string | null;
        subtitle: string | null;
        items: SectionItem[];
        is_active: 0 | 1;
        sort_order: number;
        _exists?: boolean;
      }>(`/api/admin/drones/sections/${encodeURIComponent(key)}`);
      setDraft({
        section_key: key,
        title: res?.title || "",
        subtitle: res?.subtitle || "",
        items: Array.isArray(res?.items) ? res.items : [],
        is_active: (res?.is_active ?? 1) as 0 | 1,
        sort_order: res?.sort_order ?? 0,
      });
      setExists(Boolean(res?._exists));
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || "Erro ao carregar seção.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(activeKey);
  }, [activeKey]);

  function updateItem(idx: number, patch: Partial<SectionItem>) {
    const items = draft.items.slice();
    items[idx] = { ...items[idx], ...patch };
    setDraft({ ...draft, items });
  }

  function addItem() {
    setDraft({
      ...draft,
      items: [...draft.items, { icon: "Sparkles", title: "", text: "", badge: "" }],
    });
  }

  function removeItem(idx: number) {
    const items = draft.items.slice();
    items.splice(idx, 1);
    setDraft({ ...draft, items });
  }

  function moveItem(idx: number, dir: -1 | 1) {
    const items = draft.items.slice();
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    [items[idx], items[next]] = [items[next], items[idx]];
    setDraft({ ...draft, items });
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.put(`/api/admin/drones/sections/${activeKey}`, {
        section_key: activeKey,
        title: draft.title || null,
        subtitle: draft.subtitle || null,
        items: draft.items,
        sort_order: draft.sort_order,
        is_active: draft.is_active,
      });
      setMsg("Seção salva.");
      setExists(true);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || "Erro ao salvar seção.");
    } finally {
      setSaving(false);
    }
  }

  async function resetToFallback() {
    if (
      !window.confirm(
        "Remover esta seção? A landing pública volta a usar o conteúdo estático.",
      )
    )
      return;
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.del(`/api/admin/drones/sections/${activeKey}`);
      setMsg("Seção removida — landing usa fallback estático.");
      setExists(false);
      await load(activeKey);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMsg(e?.message || "Erro ao remover seção.");
    } finally {
      setSaving(false);
    }
  }

  const activeMeta = KNOWN_SECTIONS.find((s) => s.key === activeKey);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">
            Seções da landing
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Edite título, subtítulo e cards das seções institucionais.
            Quando salva, substitui o conteúdo estático no público.
          </p>
        </div>
      </div>

      {/* Seletor de seção */}
      <div className="mt-4 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
        {KNOWN_SECTIONS.map((s) => {
          const active = s.key === activeKey;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setActiveKey(s.key)}
              className={[
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                active
                  ? "border-emerald-400 bg-emerald-500 text-black"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
              ].join(" ")}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {activeMeta ? (
        <p className="mt-3 text-[11px] text-slate-400">{activeMeta.hint}</p>
      ) : null}

      {msg ? <p className="mt-3 text-sm text-slate-200">{msg}</p> : null}

      {loading ? (
        <p className="mt-4 text-slate-300">Carregando...</p>
      ) : (
        <>
          <div className="mt-5 grid gap-3">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Título da seção"
              maxLength={160}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <textarea
              value={draft.subtitle}
              onChange={(e) =>
                setDraft({ ...draft, subtitle: e.target.value })
              }
              placeholder="Subtítulo / descrição (opcional)"
              rows={2}
              maxLength={500}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <label className="flex items-center gap-2 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(draft.is_active)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    is_active: (e.target.checked ? 1 : 0) as 0 | 1,
                  })
                }
                className="h-4 w-4"
              />
              Seção ativa (se desmarcado, landing usa fallback estático)
            </label>
          </div>

          {/* Itens */}
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">
                Cards / itens
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-extrabold text-black hover:brightness-110"
              >
                + Adicionar item
              </button>
            </div>

            <div className="mt-3 grid gap-3">
              {draft.items.map((it, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-[160px_1fr_140px]">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Ícone
                      </label>
                      <select
                        value={it.icon || ""}
                        onChange={(e) =>
                          updateItem(idx, { icon: e.target.value || null })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100"
                      >
                        <option value="">— sem ícone —</option>
                        {ICON_KEYS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Título
                      </label>
                      <input
                        value={it.title || ""}
                        onChange={(e) =>
                          updateItem(idx, { title: e.target.value })
                        }
                        maxLength={160}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                        Badge (opcional)
                      </label>
                      <input
                        value={it.badge || ""}
                        onChange={(e) =>
                          updateItem(idx, { badge: e.target.value })
                        }
                        maxLength={60}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100"
                      />
                    </div>
                  </div>
                  <textarea
                    value={it.text || ""}
                    onChange={(e) =>
                      updateItem(idx, { text: e.target.value })
                    }
                    placeholder="Texto do card"
                    rows={3}
                    maxLength={1000}
                    className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-100"
                  />
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(idx, -1)}
                        disabled={idx === 0}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-200 disabled:opacity-40 hover:bg-white/10"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 1)}
                        disabled={idx === draft.items.length - 1}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-slate-200 disabled:opacity-40 hover:bg-white/10"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="rounded-full border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 text-[10px] font-bold text-rose-200 hover:bg-rose-500/25"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
              {!draft.items.length ? (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-400">
                  Nenhum item nesta seção. Use “Adicionar item” para criar.
                  Se salvar vazio, a landing usa o fallback estático.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
            {exists ? (
              <button
                type="button"
                onClick={resetToFallback}
                disabled={saving}
                className="rounded-full border border-rose-400/40 bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/25 disabled:opacity-60"
              >
                Voltar ao fallback estático
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">
                Esta seção ainda não foi customizada. Salve para sobrescrever
                o fallback.
              </span>
            )}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-extrabold text-black hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar seção"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
