"use client";

// CRUD admin de FAQ do módulo Kavita Drones.
// Lista, cria, edita inline (question/answer/sort_order/is_active),
// ativa/desativa e exclui itens. Resultado vai direto para a landing
// pública via DronesFAQ.tsx.

import { useEffect, useMemo, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { DroneFaqItem } from "@/types/drones";

type FaqRow = Required<DroneFaqItem>;

type Draft = {
  question: string;
  answer: string;
  sort_order: number;
  is_active: 0 | 1;
};

const EMPTY_DRAFT: Draft = {
  question: "",
  answer: "",
  sort_order: 0,
  is_active: 1,
};

export default function FaqTable() {
  const [items, setItems] = useState<FaqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const isCreating = editingId === -1;

  const sorted = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id,
      ),
    [items],
  );

  async function load() {
    setMsg(null);
    setLoading(true);
    try {
      const res = await apiClient.get<{ items?: FaqRow[] }>(
        "/api/admin/drones/faq",
      );
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || "Erro ao carregar FAQ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditingId(-1);
    setDraft(EMPTY_DRAFT);
  }

  function startEdit(row: FaqRow) {
    setEditingId(row.id);
    setDraft({
      question: row.question,
      answer: row.answer,
      sort_order: row.sort_order ?? 0,
      is_active: (row.is_active ?? 1) as 0 | 1,
    });
  }

  function cancel() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  async function save() {
    if (!draft.question.trim() || !draft.answer.trim()) {
      setMsg("Pergunta e resposta são obrigatórias.");
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      if (isCreating) {
        await apiClient.post("/api/admin/drones/faq", draft);
        setMsg("Item criado.");
      } else if (editingId) {
        await apiClient.put(`/api/admin/drones/faq/${editingId}`, draft);
        setMsg("Item atualizado.");
      }
      cancel();
      await load();
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: FaqRow) {
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.put(`/api/admin/drones/faq/${row.id}`, {
        is_active: row.is_active ? 0 : 1,
      });
      await load();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMsg(e?.message || "Erro ao alternar status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Excluir este item de FAQ?")) return;
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.del(`/api/admin/drones/faq/${id}`);
      setMsg("Item excluído.");
      await load();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMsg(e?.message || "Erro ao excluir.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white">FAQ pública</h2>
          <p className="mt-1 text-xs text-slate-300">
            Perguntas frequentes exibidas na landing /drones. Apenas itens
            ativos aparecem no público; ordem segue o campo sort_order.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15"
          >
            Atualizar
          </button>
          {!isCreating && (
            <button
              type="button"
              onClick={startCreate}
              className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-extrabold text-black hover:brightness-110"
            >
              + Novo item
            </button>
          )}
        </div>
      </div>

      {msg ? <p className="mt-3 text-sm text-slate-200">{msg}</p> : null}

      {/* Editor de criação ou edição inline */}
      {(isCreating || editingId) && editingId !== null ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/5 p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
            {isCreating ? "Novo item de FAQ" : `Editando #${editingId}`}
          </h3>
          <div className="mt-3 grid gap-3">
            <input
              value={draft.question}
              onChange={(e) =>
                setDraft({ ...draft, question: e.target.value })
              }
              placeholder="Pergunta"
              maxLength={255}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
            <textarea
              value={draft.answer}
              onChange={(e) =>
                setDraft({ ...draft, answer: e.target.value })
              }
              placeholder="Resposta (até 5000 caracteres)"
              rows={6}
              maxLength={5000}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/40"
            />
            <div className="grid gap-3 sm:grid-cols-[140px_140px_1fr]">
              <label className="flex flex-col gap-1 text-xs text-slate-300">
                Ordem
                <input
                  type="number"
                  min={0}
                  value={draft.sort_order}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      sort_order: Number(e.target.value) || 0,
                    })
                  }
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-300">
                Status
                <select
                  value={draft.is_active}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      is_active: (Number(e.target.value) ? 1 : 0) as 0 | 1,
                    })
                  }
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-slate-100"
                >
                  <option value={1}>Ativo</option>
                  <option value={0}>Inativo</option>
                </select>
              </label>
              <div className="flex items-end justify-end gap-2">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={saving}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-extrabold text-black hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-4 text-slate-300">Carregando...</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {sorted.map((row) => (
            <div
              key={row.id}
              className={[
                "rounded-2xl border p-4 transition",
                row.is_active
                  ? "border-white/10 bg-black/30"
                  : "border-white/5 bg-black/20 opacity-60",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-white">
                      {row.question}
                    </p>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      ordem {row.sort_order ?? 0}
                    </span>
                    {row.is_active ? (
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                        Ativo
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-400/40 bg-slate-500/15 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
                    {row.answer}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(row)}
                    disabled={saving}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:opacity-60"
                  >
                    {row.is_active ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    disabled={saving}
                    className="rounded-full border border-rose-400/40 bg-rose-500/15 px-4 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/25 disabled:opacity-60"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}

          {!sorted.length ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center">
              <p className="text-sm font-bold text-white">
                Nenhum item de FAQ cadastrado ainda.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                A landing usa o fallback estático até você cadastrar itens
                aqui. Ao publicar um, ele substitui o fallback inteiro.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
