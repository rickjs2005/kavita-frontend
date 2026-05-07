"use client";

// CRUD admin de cases comerciais do Kavita Drones.
// Lista, cria e edita cases com 3 imagens opcionais (cover/before/after).
// Bandeira permission_to_use é obrigatória ao publicar (LGPD).

import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "@/lib/apiClient";
import { absUrl } from "@/utils/absUrl";
import type { DroneCase } from "@/types/drones";

type Draft = {
  title: string;
  farm_name: string;
  producer_name: string;
  city: string;
  uf: string;
  hectares: string;
  model_key: string;
  summary: string;
  testimonial: string;
  permission_to_use: 0 | 1;
  is_active: 0 | 1;
  sort_order: number;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  farm_name: "",
  producer_name: "",
  city: "",
  uf: "",
  hectares: "",
  model_key: "",
  summary: "",
  testimonial: "",
  permission_to_use: 0,
  is_active: 1,
  sort_order: 0,
};

export default function CasesTable() {
  const [items, setItems] = useState<DroneCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);

  const coverRef = useRef<HTMLInputElement>(null);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

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
      const res = await apiClient.get<{ items?: DroneCase[] }>(
        "/api/admin/drones/cases",
      );
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string };
      if (e?.status === 401 || e?.status === 403) {
        if (typeof window !== "undefined") window.location.assign("/admin/login");
        return;
      }
      setMsg(e?.message || "Erro ao carregar cases.");
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
    if (coverRef.current) coverRef.current.value = "";
    if (beforeRef.current) beforeRef.current.value = "";
    if (afterRef.current) afterRef.current.value = "";
  }

  function startEdit(row: DroneCase) {
    setEditingId(row.id);
    setDraft({
      title: row.title || "",
      farm_name: row.farm_name || "",
      producer_name: row.producer_name || "",
      city: row.city || "",
      uf: row.uf || "",
      hectares: row.hectares == null ? "" : String(row.hectares),
      model_key: row.model_key || "",
      summary: row.summary || "",
      testimonial: row.testimonial || "",
      permission_to_use: (row.permission_to_use ?? 0) as 0 | 1,
      is_active: (row.is_active ?? 1) as 0 | 1,
      sort_order: row.sort_order ?? 0,
    });
    if (coverRef.current) coverRef.current.value = "";
    if (beforeRef.current) beforeRef.current.value = "";
    if (afterRef.current) afterRef.current.value = "";
  }

  function cancel() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  function buildFormData(): FormData {
    const fd = new FormData();
    Object.entries(draft).forEach(([k, v]) => {
      if (v == null || v === "") return;
      fd.append(k, String(v));
    });
    if (coverRef.current?.files?.[0]) {
      fd.append("cover_image", coverRef.current.files[0]);
    }
    if (beforeRef.current?.files?.[0]) {
      fd.append("before_image", beforeRef.current.files[0]);
    }
    if (afterRef.current?.files?.[0]) {
      fd.append("after_image", afterRef.current.files[0]);
    }
    return fd;
  }

  async function save() {
    if (!draft.title.trim() || !draft.farm_name.trim()) {
      setMsg("Título e nome da fazenda são obrigatórios.");
      return;
    }
    if (!draft.permission_to_use) {
      setMsg(
        "Marque a permissão de uso de imagem antes de salvar (LGPD).",
      );
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const fd = buildFormData();
      if (isCreating) {
        await apiClient.post("/api/admin/drones/cases", fd);
        setMsg("Case criado.");
      } else if (editingId) {
        await apiClient.put(`/api/admin/drones/cases/${editingId}`, fd);
        setMsg("Case atualizado.");
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

  async function toggleActive(row: DroneCase) {
    setSaving(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("is_active", row.is_active ? "0" : "1");
      // Reenviar todos os campos required do schema (title, farm_name).
      fd.append("title", row.title);
      fd.append("farm_name", row.farm_name);
      await apiClient.put(`/api/admin/drones/cases/${row.id}`, fd);
      await load();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setMsg(e?.message || "Erro ao alternar status.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Excluir este case e suas imagens?")) return;
    setSaving(true);
    setMsg(null);
    try {
      await apiClient.del(`/api/admin/drones/cases/${id}`);
      setMsg("Case excluído.");
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
          <h2 className="text-sm font-extrabold text-white">Cases comerciais</h2>
          <p className="mt-1 text-xs text-slate-300">
            Histórias de uso real (fazenda, hectares, modelo, fotos).
            Apenas cases ativos com permissão de uso aparecem no público.
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
              + Novo case
            </button>
          )}
        </div>
      </div>

      {msg ? <p className="mt-3 text-sm text-slate-200">{msg}</p> : null}

      {(isCreating || editingId) && editingId !== null ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/5 p-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
            {isCreating ? "Novo case" : `Editando #${editingId}`}
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Título do case"
              maxLength={160}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <input
              value={draft.farm_name}
              onChange={(e) => setDraft({ ...draft, farm_name: e.target.value })}
              placeholder="Nome da fazenda"
              maxLength={160}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <input
              value={draft.producer_name}
              onChange={(e) =>
                setDraft({ ...draft, producer_name: e.target.value })
              }
              placeholder="Produtor (opcional)"
              maxLength={120}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <div className="grid grid-cols-[1fr_60px] gap-2">
              <input
                value={draft.city}
                onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                placeholder="Cidade"
                maxLength={80}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <input
                value={draft.uf}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    uf: e.target.value.toUpperCase().slice(0, 2),
                  })
                }
                placeholder="UF"
                maxLength={2}
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-center text-sm uppercase text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <input
              type="number"
              min={0}
              step="0.01"
              value={draft.hectares}
              onChange={(e) =>
                setDraft({ ...draft, hectares: e.target.value })
              }
              placeholder="Hectares"
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <input
              value={draft.model_key}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  model_key: e.target.value.toLowerCase().slice(0, 20),
                })
              }
              placeholder="Modelo (t25p, t70p, t100)"
              maxLength={20}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <textarea
              value={draft.summary}
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              placeholder="Resumo curto (até 500 caracteres)"
              rows={3}
              maxLength={500}
              className="sm:col-span-2 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />
            <textarea
              value={draft.testimonial}
              onChange={(e) =>
                setDraft({ ...draft, testimonial: e.target.value })
              }
              placeholder="Depoimento do produtor (opcional)"
              rows={5}
              maxLength={5000}
              className="sm:col-span-2 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500"
            />

            {/* Imagens */}
            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-slate-300">
                Capa
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="text-xs text-slate-300"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-300">
                Antes
                <input
                  ref={beforeRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="text-xs text-slate-300"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-300">
                Depois
                <input
                  ref={afterRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="text-xs text-slate-300"
                />
              </label>
            </div>

            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-[140px_140px_1fr]">
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
              <label className="flex items-center gap-2 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(draft.permission_to_use)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      permission_to_use: (e.target.checked ? 1 : 0) as 0 | 1,
                    })
                  }
                  className="h-4 w-4"
                />
                Tenho permissão escrita ou verbal do produtor para usar nome,
                foto e dados (LGPD)
              </label>
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-2">
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
                  <p className="text-sm font-bold text-white">{row.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {row.farm_name}
                    {row.city ? ` · ${row.city}` : ""}
                    {row.uf ? `/${row.uf}` : ""}
                    {row.hectares != null ? ` · ${row.hectares} ha` : ""}
                    {row.model_key ? ` · ${row.model_key.toUpperCase()}` : ""}
                  </p>
                  {row.summary ? (
                    <p className="mt-2 text-xs text-slate-300">{row.summary}</p>
                  ) : null}
                  {row.cover_image_url ? (
                    <img
                      src={absUrl(row.cover_image_url)}
                      alt={row.title}
                      className="mt-3 max-h-32 rounded-lg border border-white/10 object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={[
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
                      row.permission_to_use
                        ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                        : "border-amber-400/40 bg-amber-500/15 text-amber-200",
                    ].join(" ")}
                  >
                    {row.permission_to_use
                      ? "LGPD ok"
                      : "Sem permissão"}
                  </span>
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
                Nenhum case cadastrado ainda.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Cadastre cases reais com permissão LGPD do produtor para
                aparecerem na landing pública.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
