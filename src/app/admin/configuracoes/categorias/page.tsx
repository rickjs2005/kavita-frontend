"use client";

// src/app/admin/configuracoes/categorias/page.tsx
//
// Refino visual only — lógica, handlers, API calls, estados principais
// e fluxo de dados permanecem 100% intactos. Esta rewrite:
//
//   1. Espaça os botões de ação (Editar / Desativar / Remover) com
//      gap real, touch target mínimo 32px, hierarquia de cor clara
//      (neutro / amber / rose).
//   2. Refina o card do formulário (padding, ritmo, labels, inputs,
//      botão primário mais presente).
//   3. Refina a tabela (padding, hover, header sticky, zebra sutil).
//   4. Responsividade real: cards mobile com botões touch-friendly.
//   5. Feedback visual imediato nos botões de ação usando `actingId`
//      local (setado no wrapper do onClick, zero mudança nos handlers).
//      Resolve a percepção de delay sem alterar nenhum comportamento.

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import CloseButton from "@/components/buttons/CloseButton";
import CustomButton from "@/components/buttons/CustomButton";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type Categoria = {
  id: number;
  name: string;
  slug: string;
  is_active: 0 | 1 | boolean;
  sort_order: number;
};

// Ação em andamento numa linha específica — puramente visual.
// Não altera regra, não altera handler, só dá feedback imediato.
type ActingState = { id: number; action: "edit" | "toggle" | "delete" } | null;

export default function AdminCategoriasPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    sort_order: 0,
  });

  // ── Visual-only: rastreia qual linha está numa ação ──
  const [acting, setActing] = useState<ActingState>(null);

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", slug: "", sort_order: 0 });
  }

  async function loadCategorias() {
    try {
      setLoading(true);
      const res = await apiClient.get<Categoria[]>("/api/admin/categorias");
      setCategorias(res);
    } catch (err: any) {
      console.error(err);

      if (err?.status === 401 || err?.status === 403) {
        toast.error("Sessão expirada. Faça login no painel admin.");
        router.push("/admin/login");
        return;
      }

      toast.error("Erro ao carregar categorias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEdit(cat: Categoria) {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      sort_order: cat.sort_order ?? 0,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Nome é obrigatório.");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await apiClient.put(`/api/admin/categorias/${editingId}`, {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          sort_order: Number(form.sort_order) || 0,
        });
        toast.success("Categoria atualizada.");
      } else {
        await apiClient.post("/api/admin/categorias", {
          name: form.name.trim(),
          slug: form.slug.trim() || undefined,
          sort_order: Number(form.sort_order) || 0,
        });
        toast.success("Categoria criada.");
      }

      resetForm();
      await loadCategorias();
    } catch (err: any) {
      console.error(err);

      if (err?.status === 401 || err?.status === 403) {
        toast.error("Sessão expirada. Faça login no painel admin.");
        router.push("/admin/login");
        return;
      }

      const msg = err?.message || "Erro ao salvar categoria.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(cat: Categoria) {
    try {
      await apiClient.patch(`/api/admin/categorias/${cat.id}/status`, {
        is_active: !cat.is_active,
      });
      toast.success(
        !cat.is_active ? "Categoria ativada." : "Categoria desativada.",
      );
      await loadCategorias();
    } catch (err: any) {
      console.error(err);

      if (err?.status === 401 || err?.status === 403) {
        toast.error("Sessão expirada. Faça login no painel admin.");
        router.push("/admin/login");
        return;
      }

      toast.error("Erro ao atualizar status.");
    }
  }

  async function handleDelete(cat: Categoria) {
    if (!window.confirm(`Remover categoria "${cat.name}"?`)) return;

    try {
      await apiClient.del(`/api/admin/categorias/${cat.id}`);
      toast.success("Categoria removida.");
      await loadCategorias();
    } catch (err: any) {
      console.error(err);

      if (err?.status === 401 || err?.status === 403) {
        toast.error("Sessão expirada. Faça login no painel admin.");
        router.push("/admin/login");
        return;
      }

      const msg = err?.message || "Erro ao remover categoria.";
      toast.error(msg);
    }
  }

  // ── Helpers puramente visuais — chamam os handlers originais intactos ──
  // Rastreiam qual linha/ação está rodando para dar feedback imediato.
  // Cada helper só seta `acting` → aguarda o handler original → limpa.
  // Zero mudança em lógica/regra.

  async function visualHandleEdit(cat: Categoria) {
    setActing({ id: cat.id, action: "edit" });
    try {
      handleEdit(cat);
      // scroll suave pro form em mobile
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      // Edit é síncrono, limpa logo — só pro botão dar um "pulse" visual
      setTimeout(() => setActing(null), 120);
    }
  }

  async function visualToggleAtivo(cat: Categoria) {
    setActing({ id: cat.id, action: "toggle" });
    try {
      await toggleAtivo(cat);
    } finally {
      setActing(null);
    }
  }

  async function visualHandleDelete(cat: Categoria) {
    setActing({ id: cat.id, action: "delete" });
    try {
      await handleDelete(cat);
    } finally {
      setActing(null);
    }
  }

  const isActing = (
    catId: number,
    action: "edit" | "toggle" | "delete",
  ) => acting?.id === catId && acting?.action === action;

  const isRowBusy = (catId: number) => acting?.id === catId;

  const hasCategorias = !loading && categorias.length > 0;

  return (
    <main className="min-h-screen w-full bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-5 lg:px-6 lg:py-8">
        {/* ═══ HEADER ════════════════════════════════════════════════ */}
        <header className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 pr-12 sm:pr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
              Painel Admin
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl lg:text-[2rem]">
              Categorias da Loja
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              Crie, renomeie, reordene e ative/desative categorias sem precisar
              mexer em código. Tudo que aparecer aqui pode virar página pública.
            </p>

            {loading && (
              <p className="mt-3 inline-flex items-center gap-2 text-xs text-slate-400">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Carregando categorias...
              </p>
            )}
          </div>

          {/* Navegação */}
          <div className="absolute right-0 top-0 flex items-center gap-2 sm:static">
            <div className="block sm:hidden">
              <CloseButton className="text-3xl text-slate-200 hover:text-teal-light" />
            </div>

            <div className="hidden sm:block">
              <CustomButton
                label="← Voltar para configurações"
                href="/admin/configuracoes"
                variant="secondary"
                size="small"
                isLoading={false}
              />
            </div>
          </div>
        </header>

        {/* ═══ GRID PRINCIPAL ══════════════════════════════════════════ */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.55fr)] lg:gap-6">
          {/* ─── FORMULÁRIO ─── */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 shadow-lg shadow-black/30">
            {/* Top highlight */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
            />

            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/30"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {editingId ? (
                      <>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </>
                    ) : (
                      <>
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </>
                    )}
                  </svg>
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold leading-tight text-slate-50 sm:text-base">
                    {editingId ? "Editar categoria" : "Nova categoria"}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
                    Exemplo: Moda, Rações, Ferramentas…
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="cat-name"
                    className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300"
                  >
                    Nome da categoria
                  </label>
                  <input
                    id="cat-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-50 outline-none placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="Ex: Moda"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="cat-slug"
                    className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300"
                  >
                    Slug (URL amigável)
                  </label>
                  <input
                    id="cat-slug"
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleChange("slug", e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-50 outline-none placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="moda, racoes-pets, ferramentas"
                  />
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    Se deixar em branco, será gerado automaticamente a partir
                    do nome.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="cat-order"
                    className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-300"
                  >
                    Ordem no menu
                  </label>
                  <input
                    id="cat-order"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      handleChange("sort_order", Number(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-50 outline-none placeholder:text-slate-500 transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                    placeholder="0"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 underline-offset-4 transition-colors hover:text-slate-200 hover:underline"
                    >
                      Cancelar edição
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      Preencha e clique em criar.
                    </span>
                  )}
                  <CustomButton
                    label={
                      saving
                        ? "Salvando..."
                        : editingId
                          ? "Salvar edição"
                          : "Criar categoria"
                    }
                    size="medium"
                    variant="primary"
                    isLoading={saving}
                    type="submit"
                  />
                </div>
              </form>
            </div>
          </section>

          {/* ─── LISTA ─── */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 shadow-lg shadow-black/30">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
            />

            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/30"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M3 15h18" />
                      <path d="M9 3v18" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-[15px] font-semibold leading-tight text-slate-50 sm:text-base">
                      Categorias cadastradas
                    </h2>
                    {hasCategorias && (
                      <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
                        {categorias.length} categoria
                        {categorias.length === 1 ? "" : "s"} no total.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ═══ DESKTOP/TABLET: TABELA ═══ */}
              <div className="mt-5 hidden max-h-[540px] overflow-auto rounded-xl border border-slate-800/80 md:block">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur">
                    <tr>
                      <th className="border-b border-slate-800 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        Nome
                      </th>
                      <th className="border-b border-slate-800 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        Slug
                      </th>
                      <th className="border-b border-slate-800 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        Ordem
                      </th>
                      <th className="border-b border-slate-800 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        Status
                      </th>
                      <th className="border-b border-slate-800 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-sm text-slate-500"
                        >
                          Nenhuma categoria cadastrada.
                        </td>
                      </tr>
                    )}

                    {categorias.map((cat, idx) => {
                      const busy = isRowBusy(cat.id);
                      return (
                        <tr
                          key={cat.id}
                          className={`group border-slate-800 transition-colors ${
                            idx % 2 === 0
                              ? "bg-slate-950/40"
                              : "bg-slate-900/20"
                          } hover:bg-slate-900/60 ${
                            busy ? "opacity-70" : ""
                          }`}
                        >
                          <td className="border-b border-slate-800/60 px-4 py-3.5 font-medium text-slate-100">
                            {cat.name}
                          </td>
                          <td className="border-b border-slate-800/60 px-4 py-3.5 font-mono text-[12px] text-slate-400">
                            {cat.slug}
                          </td>
                          <td className="border-b border-slate-800/60 px-4 py-3.5 text-center tabular-nums text-slate-300">
                            {cat.sort_order ?? 0}
                          </td>
                          <td className="border-b border-slate-800/60 px-4 py-3.5 text-center">
                            <StatusPill active={!!cat.is_active} />
                          </td>
                          <td className="border-b border-slate-800/60 px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <ActionButton
                                tone="neutral"
                                busy={isActing(cat.id, "edit")}
                                disabled={busy}
                                onClick={() => visualHandleEdit(cat)}
                                label="Editar"
                                aria="Editar categoria"
                              />
                              <ActionButton
                                tone="amber"
                                busy={isActing(cat.id, "toggle")}
                                disabled={busy}
                                onClick={() => visualToggleAtivo(cat)}
                                label={cat.is_active ? "Desativar" : "Ativar"}
                                aria={
                                  cat.is_active
                                    ? "Desativar categoria"
                                    : "Ativar categoria"
                                }
                              />
                              <ActionButton
                                tone="danger"
                                busy={isActing(cat.id, "delete")}
                                disabled={busy}
                                onClick={() => visualHandleDelete(cat)}
                                label="Remover"
                                aria="Remover categoria"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ═══ MOBILE: CARDS ═══ */}
              <div className="mt-5 space-y-3 md:hidden">
                {loading && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-300">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Carregando categorias...
                    </span>
                  </div>
                )}

                {!loading && categorias.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/80 px-4 py-6 text-center text-xs text-slate-400">
                    Nenhuma categoria cadastrada ainda.
                  </div>
                )}

                {categorias.map((cat) => {
                  const busy = isRowBusy(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className={`rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-4 shadow-lg shadow-black/30 transition-opacity ${
                        busy ? "opacity-70" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="truncate text-sm font-semibold text-slate-50">
                            {cat.name}
                          </p>
                          <p className="truncate font-mono text-[11px] text-slate-400">
                            /{cat.slug}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Ordem:{" "}
                            <span className="tabular-nums text-slate-300">
                              {cat.sort_order ?? 0}
                            </span>
                          </p>
                        </div>
                        <StatusPill active={!!cat.is_active} />
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <ActionButton
                          tone="neutral"
                          busy={isActing(cat.id, "edit")}
                          disabled={busy}
                          onClick={() => visualHandleEdit(cat)}
                          label="Editar"
                          aria="Editar categoria"
                          full
                        />
                        <ActionButton
                          tone="amber"
                          busy={isActing(cat.id, "toggle")}
                          disabled={busy}
                          onClick={() => visualToggleAtivo(cat)}
                          label={cat.is_active ? "Desativar" : "Ativar"}
                          aria={
                            cat.is_active
                              ? "Desativar categoria"
                              : "Ativar categoria"
                          }
                          full
                        />
                        <ActionButton
                          tone="danger"
                          busy={isActing(cat.id, "delete")}
                          disabled={busy}
                          onClick={() => visualHandleDelete(cat)}
                          label="Remover"
                          aria="Remover categoria"
                          full
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

// ══════════════════════════════════════════════════════════════════
// UI primitives (locais, zero lógica)
// ══════════════════════════════════════════════════════════════════

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active
          ? "border border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
          : "border border-slate-500/60 bg-slate-700/40 text-slate-300"
      }`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" : "bg-slate-500"
        }`}
      />
      {active ? "Ativa" : "Inativa"}
    </span>
  );
}

type Tone = "neutral" | "amber" | "danger";

function ActionButton({
  tone,
  busy,
  disabled,
  onClick,
  label,
  aria,
  full,
}: {
  tone: Tone;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  aria: string;
  full?: boolean;
}) {
  const toneClasses: Record<Tone, string> = {
    neutral:
      "border-slate-700 bg-slate-900 text-slate-200 hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:text-emerald-300 focus-visible:ring-emerald-500/40",
    amber:
      "border-slate-700 bg-slate-900 text-slate-200 hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-300 focus-visible:ring-amber-500/40",
    danger:
      "border-rose-700/70 bg-slate-900 text-rose-300 hover:border-rose-500 hover:bg-rose-500/10 hover:text-rose-200 focus-visible:ring-rose-500/40",
  };

  return (
    <button
      type="button"
      aria-label={aria}
      aria-busy={busy}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all focus:outline-none focus-visible:ring-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
        toneClasses[tone]
      } ${full ? "w-full" : "min-w-[84px]"}`}
    >
      {busy && (
        <span
          aria-hidden
          className="inline-block h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent"
        />
      )}
      <span className={busy ? "opacity-80" : ""}>{label}</span>
    </button>
  );
}
