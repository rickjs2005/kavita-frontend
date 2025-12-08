"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import CloseButton from "@/components/buttons/CloseButton";
import CustomButton from "@/components/buttons/CustomButton";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Categoria = {
  id: number;
  name: string;
  slug: string;
  is_active: 0 | 1 | boolean;
  sort_order: number;
};

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

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", slug: "", sort_order: 0 });
  }

  async function loadCategorias() {
    try {
      setLoading(true);
      const res = await axios.get<Categoria[]>(
        `${API_BASE}/api/admin/categorias`,
        {
          withCredentials: true, // 🔐 usa apenas cookie HttpOnly
        }
      );
      setCategorias(res.data);
    } catch (err: any) {
      console.error(err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
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
    value: (typeof form)[K]
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
        await axios.put(
          `${API_BASE}/api/admin/categorias/${editingId}`,
          {
            name: form.name.trim(),
            slug: form.slug.trim() || undefined,
            sort_order: Number(form.sort_order) || 0,
          },
          {
            withCredentials: true, // 🔐 cookie HttpOnly
          }
        );
        toast.success("Categoria atualizada.");
      } else {
        await axios.post(
          `${API_BASE}/api/admin/categorias`,
          {
            name: form.name.trim(),
            slug: form.slug.trim() || undefined,
            sort_order: Number(form.sort_order) || 0,
          },
          {
            withCredentials: true, // 🔐 cookie HttpOnly
          }
        );
        toast.success("Categoria criada.");
      }

      resetForm();
      await loadCategorias();
    } catch (err: any) {
      console.error(err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error("Sessão expirada. Faça login no painel admin.");
        router.push("/admin/login");
        return;
      }

      const msg =
        err?.response?.data?.message || "Erro ao salvar categoria.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(cat: Categoria) {
    try {
      await axios.patch(
        `${API_BASE}/api/admin/categorias/${cat.id}/status`,
        { is_active: !cat.is_active },
        {
          withCredentials: true, // 🔐 cookie HttpOnly
        }
      );
      toast.success(
        !cat.is_active ? "Categoria ativada." : "Categoria desativada."
      );
      await loadCategorias();
    } catch (err: any) {
      console.error(err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
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
      await axios.delete(`${API_BASE}/api/admin/categorias/${cat.id}`, {
        withCredentials: true, // 🔐 cookie HttpOnly
      });
      toast.success("Categoria removida.");
      await loadCategorias();
    } catch (err: any) {
      console.error(err);

      if (err?.response?.status === 401 || err?.response?.status === 403) {
        toast.error("Sessão expirada. Faça login no painel admin.");
        router.push("/admin/login");
        return;
      }

      const msg =
        err?.response?.data?.message || "Erro ao remover categoria.";
      toast.error(msg);
    }
  }

  const hasCategorias = !loading && categorias.length > 0;

  return (
    <main className="min-h-screen w-full bg-slate-950 text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-3 py-5 sm:px-4 lg:px-6">
        {/* HEADER */}
        <header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="pr-10 sm:pr-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-300/80">
              Painel Admin
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#359293] sm:text-3xl">
              Categorias da Loja
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-300 sm:text-sm">
              Crie, renomeie, reordene e ative/desative categorias sem precisar
              mexer em código. Tudo que aparecer aqui pode virar página pública.
            </p>

            {loading && (
              <p className="mt-2 text-xs text-slate-400">
                Carregando categorias...
              </p>
            )}
          </div>

          {/* Navegação (X no mobile / Voltar no desktop) */}
          <div className="absolute right-0 top-0 flex items-center gap-2 sm:static">
            {/* Mobile: só o X */}
            <div className="block sm:hidden">
              <CloseButton className="text-3xl text-slate-200 hover:text-[#35c2c4]" />
            </div>

            {/* Desktop: botão voltar para configurações */}
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

        {/* ESTADO SEM CATEGORIAS / ERROS BÁSICOS FICAM NO CONTEÚDO */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
          {/* FORMULÁRIO */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
              {editingId ? "Editar categoria" : "Nova categoria"}
            </h2>
            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              Exemplo: Moda, Rações, Ferramentas…
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-200">
                  Nome da categoria
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ex: Moda"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-200">
                  Slug (URL amigável)
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="moda, racoes-pets, ferramentas"
                />
                <p className="text-[11px] text-slate-500">
                  Se deixar em branco, será gerado automaticamente a partir do
                  nome.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-200">
                  Ordem no menu
                </label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    handleChange("sort_order", Number(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="0"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
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
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs text-slate-400 underline-offset-2 hover:text-slate-200 hover:underline"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* LISTA DE CATEGORIAS */}
          <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-slate-50 sm:text-base">
                Categorias cadastradas
              </h2>
              {hasCategorias && (
                <p className="text-[11px] text-slate-400 sm:text-xs">
                  {categorias.length} categoria
                  {categorias.length === 1 ? "" : "s"} no total.
                </p>
              )}
            </div>

            {/* DESKTOP/TABLET: TABELA */}
            <div className="mt-4 hidden max-h-[460px] overflow-auto rounded-xl border border-slate-800/80 md:block">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th className="px-3 py-2 font-medium">Nome</th>
                    <th className="px-3 py-2 font-medium">Slug</th>
                    <th className="px-3 py-2 text-center font-medium">
                      Ordem
                    </th>
                    <th className="px-3 py-2 text-center font-medium">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categorias.length === 0 && !loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-slate-500"
                      >
                        Nenhuma categoria cadastrada.
                      </td>
                    </tr>
                  )}

                  {categorias.map((cat) => (
                    <tr
                      key={cat.id}
                      className="border-t border-slate-800 hover:bg-slate-900/60"
                    >
                      <td className="px-3 py-2">{cat.name}</td>
                      <td className="px-3 py-2 text-slate-400">{cat.slug}</td>
                      <td className="px-3 py-2 text-center">
                        {cat.sort_order ?? 0}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            cat.is_active
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-700/40 text-slate-300 border border-slate-500/60"
                          }`}
                        >
                          {cat.is_active ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td className="px-3 py-2 space-x-1.5 text-right">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] hover:border-emerald-500 hover:text-emerald-300"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleAtivo(cat)}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] hover:border-amber-500 hover:text-amber-300"
                        >
                          {cat.is_active ? "Desativar" : "Ativar"}
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="rounded-md border border-red-700/70 bg-slate-900 px-2 py-1 text-[11px] text-red-300 hover:bg-red-900/30"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE: CARDS RESPONSIVOS */}
            <div className="mt-4 space-y-3 md:hidden">
              {loading && (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-[11px] text-slate-300">
                  Carregando categorias...
                </div>
              )}

              {!loading && categorias.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/80 px-4 py-4 text-center text-xs text-slate-400">
                  Nenhuma categoria cadastrada ainda.
                </div>
              )}

              {categorias.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/90 p-3 text-xs shadow-lg shadow-black/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-[13px] font-semibold text-slate-50">
                        {cat.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Slug:{" "}
                        <span className="text-slate-300">{cat.slug}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Ordem no menu:{" "}
                        <span className="text-slate-200">
                          {cat.sort_order ?? 0}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        cat.is_active
                          ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                          : "bg-slate-700/40 text-slate-300 border border-slate-500/60"
                      }`}
                    >
                      {cat.is_active ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-center text-[11px] hover:border-emerald-500 hover:text-emerald-300"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => toggleAtivo(cat)}
                      className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-center text-[11px] hover:border-amber-500 hover:text-amber-300"
                    >
                      {cat.is_active ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="flex-1 rounded-md border border-red-700/70 bg-slate-900 px-2 py-1 text-center text-[11px] text-red-300 hover:bg-red-900/30"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
