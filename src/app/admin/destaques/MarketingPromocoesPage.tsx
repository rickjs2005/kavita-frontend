"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import DeleteButton from "@/components/buttons/DeleteButton";
import SearchInputProdutos from "@/components/products/SearchInput";
import CloseButton from "@/components/buttons/CloseButton";

type Promocao = {
  id: number;
  product_id: number;
  name: string;
  image: string | null;

  original_price: number | string;
  final_price: number | string;
  discount_percent: number | null;
  promo_price: number | null;

  title: string | null;
  type: "PROMOCAO" | "FLASH" | string;
  start_at?: string | null;
  end_at?: string | null;
  is_active?: 0 | 1;
  status?: string; // ATIVA / INATIVA
};

type FormMode = "idle" | "create" | "edit";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000";
const API_ADMIN = `${API_BASE}/api/admin`;
const PLACEHOLDER = "https://via.placeholder.com/400x240?text=Sem+imagem";

function toImageUrl(raw?: string | null) {
  if (!raw) return PLACEHOLDER;
  const p = String(raw).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(p)) return p;
  const clean = p.replace(/^\/+/, "");
  if (clean.startsWith("uploads/")) return `${API_BASE}/${clean}`;
  if (clean.startsWith("public/")) return `${API_BASE}/${clean}`;
  return `${API_BASE}/uploads/${clean}`;
}

function toArray(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.data)) return json.data;
  if (json && Array.isArray(json.rows)) return json.rows;
  if (json && Array.isArray(json.products)) return json.products;
  if (json && Array.isArray(json.items)) return json.items;
  return [];
}

function toInputDateTime(value?: string | null) {
  if (!value) return "";
  // espera algo tipo "2025-12-05T10:00:00.000Z" ou "2025-12-05 10:00:00"
  const s = value.replace(" ", "T");
  return s.slice(0, 16);
}

export default function MarketingPromocoesPage() {
  const [promocoes, setPromocoes] = useState<Promocao[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ----- estado do formulário -----
  const [mode, setMode] = useState<FormMode>("idle");
  const [formPromoId, setFormPromoId] = useState<number | null>(null);
  const [formProductId, setFormProductId] = useState<number | null>(null);
  const [formProductName, setFormProductName] = useState<string>("");
  const [formBasePrice, setFormBasePrice] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState<string>("");
  const [formType, setFormType] = useState<"PROMOCAO" | "FLASH">("PROMOCAO");
  const [formDiscountPercent, setFormDiscountPercent] = useState<string>("10");
  const [formPromoPrice, setFormPromoPrice] = useState<string>("");
  const [formStartAt, setFormStartAt] = useState<string>("");
  const [formEndAt, setFormEndAt] = useState<string>("");
  const [formActive, setFormActive] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    buscarPromocoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buscarPromocoes() {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch(`${API_ADMIN}/marketing/promocoes`, {
        credentials: "include", // 🔐 usa cookie HttpOnly
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        throw new Error("Sessão expirada. Faça login novamente no admin.");
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `Erro ao listar promoções (${res.status}).`);
      }

      const json = await res.json();
      const list = toArray(json) as Promocao[];
      setPromocoes(
        list.map((d) => ({
          ...d,
          original_price: Number(d.original_price ?? d.final_price ?? 0),
          final_price: Number(d.final_price ?? d.original_price ?? 0),
          discount_percent:
            d.discount_percent !== null && d.discount_percent !== undefined
              ? Number(d.discount_percent)
              : null,
          promo_price:
            d.promo_price !== null && d.promo_price !== undefined
              ? Number(d.promo_price)
              : null,
          image: toImageUrl(d.image),
        }))
      );
    } catch (e: any) {
      console.error(e);
      const msg = e?.message || "Falha ao carregar promoções.";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // --------- FORM: abrir para criação ---------
  function abrirCriarPromocao(produto: any) {
    const id = Number(produto.id);
    if (!id) {
      toast.error("Produto inválido.");
      return;
    }

    if (promocoes.some((d) => d.product_id === id)) {
      toast.error("Este produto já possui uma promoção ativa.");
      return;
    }

    setMode("create");
    setFormPromoId(null);
    setFormProductId(id);
    setFormProductName(produto.name || produto.nome || `Produto #${id}`);
    setFormBasePrice(produto.price ?? produto.preco ?? null);
    setFormTitle("");
    setFormType("PROMOCAO");
    setFormDiscountPercent("10");
    setFormPromoPrice("");
    setFormStartAt("");
    setFormEndAt("");
    setFormActive(true);
  }

  // --------- FORM: abrir para edição ---------
  function abrirEditarPromocao(promo: Promocao) {
    setMode("edit");
    setFormPromoId(promo.id);
    setFormProductId(promo.product_id);
    setFormProductName(promo.name);
    setFormBasePrice(Number(promo.original_price));
    setFormTitle(promo.title || "");
    setFormType(promo.type === "FLASH" ? "FLASH" : "PROMOCAO");
    setFormDiscountPercent(
      promo.discount_percent != null ? String(promo.discount_percent) : ""
    );
    setFormPromoPrice(
      promo.promo_price != null ? String(promo.promo_price) : ""
    );
    setFormStartAt(toInputDateTime((promo as any).start_at));
    setFormEndAt(toInputDateTime((promo as any).end_at));
    setFormActive(promo.is_active === 1 || promo.status === "ATIVA");
  }

  function limparFormulario() {
    setMode("idle");
    setFormPromoId(null);
    setFormProductId(null);
    setFormProductName("");
    setFormBasePrice(null);
    setFormTitle("");
    setFormType("PROMOCAO");
    setFormDiscountPercent("10");
    setFormPromoPrice("");
    setFormStartAt("");
    setFormEndAt("");
    setFormActive(true);
  }

  // --------- FORM: submit (criar/editar) ---------
  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formProductId) {
      toast.error("Selecione um produto para a promoção.");
      return;
    }

    const discount =
      formDiscountPercent.trim() !== "" ? Number(formDiscountPercent) : null;
    const promoPrice =
      formPromoPrice.trim() !== "" ? Number(formPromoPrice) : null;

    if (!discount && !promoPrice) {
      toast.error("Informe desconto em % ou preço promocional.");
      return;
    }

    if (discount != null && (Number.isNaN(discount) || discount <= 0)) {
      toast.error("Desconto em % inválido.");
      return;
    }

    if (promoPrice != null && (Number.isNaN(promoPrice) || promoPrice <= 0)) {
      toast.error("Preço promocional inválido.");
      return;
    }

    const payload: any = {
      title: formTitle || null,
      type: formType,
      discount_percent: discount,
      promo_price: promoPrice,
      start_at: formStartAt || null,
      end_at: formEndAt || null,
      is_active: formActive ? 1 : 0,
    };

    try {
      setSaving(true);

      if (mode === "create") {
        const res = await fetch(`${API_ADMIN}/marketing/promocoes`, {
          method: "POST",
          credentials: "include", // 🔐 cookie HttpOnly
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: formProductId,
            ...payload,
          }),
        });

        if (res.status === 401 || res.status === 403) {
          toast.error("Sessão expirada. Faça login novamente no admin.");
          return;
        }

        if (res.status === 409) {
          toast.error("Já existe uma promoção para este produto.");
          return;
        }

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || "Erro ao criar promoção.");
        }

        toast.success("Promoção criada com sucesso.");
      } else if (mode === "edit" && formPromoId != null) {
        const res = await fetch(
          `${API_ADMIN}/marketing/promocoes/${formPromoId}`,
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (res.status === 401 || res.status === 403) {
          toast.error("Sessão expirada. Faça login novamente no admin.");
          return;
        }

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          throw new Error(t || "Erro ao atualizar promoção.");
        }

        toast.success("Promoção atualizada com sucesso.");
      }

      await buscarPromocoes();
      limparFormulario();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Erro ao salvar promoção.");
    } finally {
      setSaving(false);
    }
  }

  async function removerPromocao(id: number) {
    try {
      const res = await fetch(`${API_ADMIN}/marketing/promocoes/${id}`, {
        method: "DELETE",
        credentials: "include", // 🔐 cookie HttpOnly
      });

      if (res.status === 401 || res.status === 403) {
        toast.error("Sessão expirada. Faça login novamente no admin.");
        return;
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Erro ao remover promoção.");
      }

      toast.success("Promoção removida com sucesso.");
      await buscarPromocoes();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao remover promoção.");
    }
  }

  const temItens = useMemo(() => promocoes.length > 0, [promocoes]);

  return (
    <div className="w-full px-3 py-5 sm:px-4 lg:px-6">
      <div className="relative mx-auto w-full max-w-6xl">
        {/* Botão voltar (mobile) */}
        <CloseButton className="absolute right-3 -top-2 z-10 block text-2xl sm:hidden" />

        {/* Header */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-1 flex-col gap-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#359293] sm:text-3xl">
              Marketing & Promoções
            </h1>
            <p className="text-xs text-gray-300 sm:text-sm">
              Busque um produto e transforme em promoção. Use descontos em
              porcentagem ou preços especiais para criar campanhas como os
              grandes ecommerces.
            </p>

            <div className="mt-3 w-full sm:w-80 md:w-96">
              <SearchInputProdutos
                className="w-full"
                placeholder="Buscar produto para criar promoção..."
                onPick={(produto: any) => abrirCriarPromocao(produto)}
              />
            </div>
          </div>
        </div>

        {/* FORMULÁRIO DE CRIAÇÃO/EDIÇÃO */}
        {mode !== "idle" && formProductId && (
          <div className="mb-6 rounded-2xl border border-emerald-600/40 bg-slate-950/70 p-4 shadow-xl sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-emerald-100 sm:text-lg">
                  {mode === "create" ? "Criar promoção" : "Editar promoção"}
                </h2>
                <p className="text-[11px] text-slate-300 sm:text-xs">
                  {formProductName}{" "}
                  {formBasePrice != null && (
                    <span className="ml-1 text-[11px] text-slate-400">
                      (Preço cheio: R$ {formBasePrice.toFixed(2)})
                    </span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={limparFormulario}
                className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
              >
                Cancelar
              </button>
            </div>

            <form
              className="grid gap-3 sm:grid-cols-2 sm:gap-4"
              onSubmit={handleSubmitForm}
            >
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">
                  Título da promoção (opcional)
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Ex.: Semana Bovinos, Oferta do Campo..."
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">
                  Tipo
                </label>
                <select
                  value={formType}
                  onChange={(e) =>
                    setFormType(
                      e.target.value === "FLASH" ? "FLASH" : "PROMOCAO"
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="PROMOCAO">Promoção normal</option>
                  <option value="FLASH">Oferta relâmpago</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">
                  Desconto (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formDiscountPercent}
                    onChange={(e) => setFormDiscountPercent(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Ex.: 10"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">
                  Se você preencher preço promocional abaixo, ele será prioridade.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">
                  Preço promocional (opcional)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">R$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formPromoPrice}
                    onChange={(e) => setFormPromoPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="Deixe em branco para usar apenas %"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">
                  Início (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={formStartAt}
                  onChange={(e) => setFormStartAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-300">
                  Fim (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={formEndAt}
                  onChange={(e) => setFormEndAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  id="promo-active"
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                />
                <label
                  htmlFor="promo-active"
                  className="text-xs text-slate-200"
                >
                  Promoção ativa (aparece para os clientes enquanto estiver
                  dentro do período configurado)
                </label>
              </div>

              <div className="mt-2 flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving
                    ? "Salvando..."
                    : mode === "create"
                    ? "Criar promoção"
                    : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Estados */}
        {loading && (
          <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm sm:p-5">
            Carregando promoções…
          </div>
        )}
        {err && !loading && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 sm:p-5">
            {err}
          </div>
        )}
        {!loading && !err && !temItens && (
          <div className="mt-6 rounded-2xl bg-white p-4 text-sm text-gray-600 shadow-sm sm:p-5">
            Nenhuma promoção cadastrada ainda. Use a busca acima para criar a
            primeira oferta.
          </div>
        )}

        {/* Grid de promoções */}
        {temItens && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {promocoes.map((promo) => {
              const original = Number(promo.original_price);
              const final = Number(promo.final_price);
              const desconto =
                promo.discount_percent ??
                (original > 0 ? ((original - final) / original) * 100 : 0);

              const isFlash = promo.type === "FLASH";
              const status = promo.status || "INATIVA";

              return (
                <article
                  key={promo.id}
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative w-full bg-gray-100/80 pb-[56.25%]">
                    <Image
                      src={toImageUrl(promo.image)}
                      alt={String(promo.name)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      onError={(e) =>
                        ((e.currentTarget as any).src = PLACEHOLDER)
                      }
                    />

                    <div className="absolute left-2 top-2 flex items-center gap-2">
                      {desconto && desconto > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                          -{desconto.toFixed(0)}%
                        </span>
                      )}
                      {isFlash && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                          Oferta relâmpago
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                      {promo.name}
                    </h2>

                    {promo.title && (
                      <p className="mt-0.5 line-clamp-2 text-xs font-medium uppercase tracking-wide text-emerald-700">
                        {promo.title}
                      </p>
                    )}

                    <div className="mt-2 flex flex-col gap-1 text-sm">
                      {original > final && (
                        <span className="text-xs text-gray-400 line-through">
                          R$ {original.toFixed(2)}
                        </span>
                      )}
                      <span className="text-base font-bold text-emerald-700">
                        R$ {final.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${
                          status === "ATIVA"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {status === "ATIVA" ? "Ativa" : "Inativa"}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-gray-400">
                        {promo.type === "FLASH" ? "Flash" : "Promoção"}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEditarPromocao(promo)}
                        className="flex-1 rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Editar
                      </button>

                      <DeleteButton
                        onConfirm={() => removerPromocao(promo.id)}
                        label="Remover promoção"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
