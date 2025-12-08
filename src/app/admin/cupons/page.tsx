"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";
import type { Coupon } from "@/types/coupon";
import { emptyCoupon } from "@/types/coupon";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CuponsPage() {
  const [cupons, setCupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<Coupon>(emptyCoupon);

  const formRef = useRef<HTMLDivElement | null>(null);

  // ========= helpers =========

  function scrollToForm() {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleChange(
    field: keyof Coupon,
    value: string | number | boolean | null
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleNovoCupom() {
    setEditing(null);
    setForm(emptyCoupon);
    scrollToForm();
  }

  function handleEditarCupom(cupom: Coupon) {
    setEditing(cupom);
    setForm({
      ...cupom,
      expiracao: cupom.expiracao ? cupom.expiracao.slice(0, 16) : "",
    });
    scrollToForm();
  }

  // ========= requests =========

  async function carregarCupons() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/admin/cupons`, {
        credentials: "include", // 🔐 usa cookie HttpOnly
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        const msg = "Sessão expirada ou sem permissão. Faça login no admin.";
        setError(msg);
        toast.error(msg);
        setCupons([]);
        return;
      }

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Erro HTTP ${res.status}`);
      }

      const data = (await res.json()) as Coupon[];
      setCupons(data);
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Erro ao carregar cupons.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCupons();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        codigo: form.codigo.trim(),
        tipo: form.tipo,
        valor: Number(form.valor),
        minimo: Number(form.minimo) || 0,
        expiracao: form.expiracao || null,
        max_usos:
          form.max_usos === null || (form.max_usos as any) === ""
            ? null
            : Number(form.max_usos),
        ativo: !!form.ativo,
      };

      const isEdit = !!editing;
      const url = isEdit
        ? `${API_BASE}/api/admin/cupons/${editing!.id}`
        : `${API_BASE}/api/admin/cupons`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include", // 🔐 cookie HttpOnly
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 401 || res.status === 403) {
        const msg = "Sessão expirada ou sem permissão. Faça login no admin.";
        setError(msg);
        toast.error(msg);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.message || data?.mensagem || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      await carregarCupons();
      setEditing(null);
      setForm(emptyCoupon);
      toast.success(
        editing ? "Cupom atualizado com sucesso." : "Cupom criado com sucesso."
      );
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Erro ao salvar o cupom.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoverCupom(id: number) {
    if (!confirm("Deseja realmente remover este cupom?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/cupons/${id}`, {
        method: "DELETE",
        credentials: "include", // 🔐 cookie HttpOnly
      });

      if (res.status === 401 || res.status === 403) {
        toast.error("Sessão expirada ou sem permissão. Faça login no admin.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.message || data?.mensagem || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setCupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Cupom removido com sucesso.");
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Erro ao remover o cupom.";
      setError(msg);
      toast.error(msg);
    }
  }

  // ========= UI =========

  return (
    <div className="min-h-screen bg-[#050816] text-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#38bdf8]/80">
              Marketing interno
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#359293] sm:text-3xl">
              Cupons e Promoções
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Crie cupons de desconto para campanhas internas do Kavita.
            </p>
          </div>

          {/* Botões de navegação:
              - CloseButton: só no mobile (X que volta)
              - Voltar: só no desktop */}
          <div className="absolute right-0 top-0 flex items-center gap-2 sm:static">
            <div className="block sm:hidden">
              <CloseButton className="text-3xl text-gray-100 hover:text-[#38bdf8]" />
            </div>

            <Link href="/admin" className="hidden sm:block">
              <CustomButton
                label="Voltar"
                variant="secondary"
                size="small"
                isLoading={false}
              />
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-md border border-red-500 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Layout: Form + Lista */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
          {/* Formulário */}
          <section
            ref={formRef}
            className="rounded-2xl border border-white/5 bg-[#0b1120] p-4 shadow-xl shadow-black/40 sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editing ? "Editar cupom" : "Novo cupom"}
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  Defina código, tipo de desconto e regras de uso.
                </p>
              </div>

              {editing && (
                <button
                  type="button"
                  onClick={handleNovoCupom}
                  className="text-xs font-medium text-[#38bdf8] hover:underline"
                >
                  + Criar novo
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-200">
                  Código
                </label>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(e) => handleChange("codigo", e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm text-white outline-none ring-0 focus:border-[#38bdf8]"
                  placeholder="PROMO10"
                  required
                />
                <p className="text-[11px] text-gray-400">
                  Esse é o código que o cliente vai digitar no checkout.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-200">
                    Tipo
                  </label>
                  <select
                    value={form.tipo}
                    onChange={(e) =>
                      handleChange("tipo", e.target.value as Coupon["tipo"])
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]"
                  >
                    <option value="percentual">% (percentual)</option>
                    <option value="valor">R$ (valor fixo)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-200">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.valor}
                    onChange={(e) =>
                      handleChange("valor", Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]"
                    placeholder="10"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-200">
                    Mínimo de compra (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.minimo}
                    onChange={(e) =>
                      handleChange("minimo", Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]"
                    placeholder="0"
                  />
                  <p className="text-[11px] text-gray-400">
                    Valor mínimo do pedido para o cupom ser aceito.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-200">
                    Máx. de usos
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.max_usos ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "max_usos",
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]"
                    placeholder="Ilimitado"
                  />
                  <p className="text-[11px] text-gray-400">
                    Deixe em branco para uso ilimitado.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-200">
                    Expiração
                  </label>
                  <input
                    type="datetime-local"
                    value={form.expiracao || ""}
                    onChange={(e) => handleChange("expiracao", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#020617] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]"
                  />
                  <p className="text-[11px] text-gray-400">
                    Deixe em branco para não expirar.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    id="ativo"
                    type="checkbox"
                    checked={!!form.ativo}
                    onChange={(e) => handleChange("ativo", e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-[#020617] text-[#38bdf8] focus:ring-0"
                  />
                  <label htmlFor="ativo" className="text-sm text-gray-200">
                    Cupom ativo
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-lg bg-[#38bdf8] px-4 py-2 text-sm font-semibold text-[#020617] shadow-md shadow-cyan-500/30 transition hover:bg-[#0ea5e9] disabled:opacity-60"
                >
                  {saving
                    ? "Salvando..."
                    : editing
                    ? "Salvar alterações"
                    : "Criar cupom"}
                </button>
              </div>
            </form>
          </section>

          {/* Lista de cupons */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">
                Cupons cadastrados
              </h2>
              <button
                type="button"
                onClick={handleNovoCupom}
                className="text-xs font-medium text-[#38bdf8] hover:underline"
              >
                + Novo cupom
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-gray-300">Carregando cupons...</p>
            ) : cupons.length === 0 ? (
              <p className="text-sm text-gray-300">
                Nenhum cupom cadastrado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {cupons.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-[#020617] p-4 text-sm text-gray-100 shadow-md shadow-black/40 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#38bdf8]/10 px-3 py-1 text-xs font-semibold text-[#38bdf8]">
                          {c.codigo}
                        </span>
                        {!c.ativo && (
                          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-300">
                        {(() => {
                          const valor = Number(c.valor) || 0;
                          const minimo = Number(c.minimo) || 0;

                          return (
                            <>
                              {c.tipo === "percentual"
                                ? `Desconto de ${valor}%`
                                : `Desconto de R$ ${valor.toFixed(2)}`}
                              {minimo > 0 && (
                                <> · Mínimo R$ {minimo.toFixed(2)}</>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Usos: {c.usos}
                        {c.max_usos != null && ` / ${c.max_usos}`}
                        {c.expiracao && (
                          <>
                            {" "}
                            · expira em{" "}
                            {new Date(c.expiracao).toLocaleString("pt-BR")}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => handleEditarCupom(c)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-100 hover:border-[#38bdf8] hover:text-[#38bdf8]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoverCupom(c.id)}
                        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
