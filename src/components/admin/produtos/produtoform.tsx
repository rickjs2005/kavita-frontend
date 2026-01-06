"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ProductShippingSection from "./ProductShippingSection";

type Msg = { type: "success" | "error"; text: string };

type ProdutoEditado = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  category_id: number | string;
  image?: string | null;
  images?: string[];
  shipping_free?: number | boolean | null;
  shipping_free_from_qty?: number | null;
};

type Props = {
  API_BASE?: string; // ✅ deixa opcional para evitar "undefined" caso esqueça de passar
  produtoEditado?: ProdutoEditado | null;
  onProdutoAdicionado?: () => void;
  onLimparEdicao?: () => void;
};

function absUrl(API_BASE: string, p?: string | null) {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
}

export default function ProdutoForm({
  API_BASE,
  produtoEditado,
  onProdutoAdicionado,
  onLimparEdicao,
}: Props) {
  // ✅ fallback seguro: se esquecer de passar API_BASE, não cai no Next (3000)
  const BASE = API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const isEditing = !!produtoEditado;

  const [msg, setMsg] = useState<Msg | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [quantityStr, setQuantityStr] = useState("");
  const [categoryId, setCategoryId] = useState<string | number>("");

  // imagens
  const [existingImgs, setExistingImgs] = useState<string[]>([]);
  const [removeExisting, setRemoveExisting] = useState<Set<string>>(new Set());
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // frete por produto
  const [shippingFree, setShippingFree] = useState<boolean>(false);
  const [shippingFreeFromQtyStr, setShippingFreeFromQtyStr] = useState<string>("");

  function toRel(abs: string) {
    if (!abs) return "";
    try {
      const u = new URL(abs);
      return u.pathname || "";
    } catch {
      return abs;
    }
  }

  useEffect(() => {
    if (produtoEditado) {
      setName(produtoEditado.name || "");
      setDescription(produtoEditado.description || "");
      setPriceStr(String(produtoEditado.price ?? ""));
      setQuantityStr(String(produtoEditado.quantity ?? ""));
      setCategoryId(produtoEditado.category_id || "");

      const extras = Array.isArray(produtoEditado.images) ? produtoEditado.images : [];
      const allRel = [produtoEditado.image, ...extras].filter(Boolean) as string[];
      const uniqueRel = Array.from(new Set(allRel));
      const urlsAbs = uniqueRel.map((p) => absUrl(BASE, p)!).filter(Boolean);

      setExistingImgs(urlsAbs);
      setRemoveExisting(new Set());
      setNewFiles([]);
      setNewPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      const freeBool =
        produtoEditado.shipping_free === true ||
        produtoEditado.shipping_free === 1 ||
        String(produtoEditado.shipping_free ?? "0") === "1";

      setShippingFree(freeBool);
      setShippingFreeFromQtyStr(
        produtoEditado.shipping_free_from_qty ? String(produtoEditado.shipping_free_from_qty) : ""
      );
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtoEditado]);

  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setNewPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newFiles]);

  function normalizeNumber(input: string): number {
    if (input == null) return 0;
    let s = String(input).trim();
    if (!s) return 0;
    s = s.replace(/[R$\s]/g, "");
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > -1 && lastDot > -1) {
      const decSep = lastComma > lastDot ? "," : ".";
      const thouSep = decSep === "," ? "." : ",";
      s = s.replace(new RegExp("\\" + thouSep, "g"), "");
      if (decSep === ",") s = s.replace(",", ".");
    } else if (lastComma > -1) {
      s = s.replace(/\./g, "").replace(",", ".");
    }
    const n = Number(s);
    return Number.isNaN(n) ? 0 : Number(n.toFixed(2));
  }

  const price = useMemo(() => normalizeNumber(priceStr), [priceStr]);
  const quantity = useMemo(
    () => Math.max(0, Math.floor(Number(quantityStr) || 0)),
    [quantityStr]
  );

  function resetForm() {
    setName("");
    setDescription("");
    setPriceStr("");
    setQuantityStr("");
    setCategoryId("");
    setExistingImgs([]);
    setRemoveExisting(new Set());
    setNewFiles([]);
    setNewPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setShippingFree(false);
    setShippingFreeFromQtyStr("");
  }

  function validate(): string | null {
    if (!name.trim()) return "Informe o nome do produto.";
    if (!categoryId) return "Selecione uma categoria.";
    if (price <= 0) return "Informe um preço válido.";
    if (quantity < 0) return "A quantidade não pode ser negativa.";

    if (shippingFree && shippingFreeFromQtyStr.trim()) {
      const n = Number(shippingFreeFromQtyStr);
      if (!Number.isFinite(n) || n <= 0) {
        return "Frete grátis por quantidade: informe um número válido (ex: 10).";
      }
    }

    return null;
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setNewFiles((prev) => {
      const next = [...prev, ...files];
      return next.slice(0, 8);
    });
  }

  function removeNewImage(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleRemoveExisting(urlAbs: string) {
    setRemoveExisting((prev) => {
      const next = new Set(prev);
      const rel = toRel(urlAbs);
      if (next.has(rel)) next.delete(rel);
      else next.add(rel);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const err = validate();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }

    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", (description || "").trim());
    fd.append("price", String(price));
    fd.append("quantity", String(quantity));
    fd.append("category_id", String(categoryId));

    // frete por produto (sempre enviar)
    fd.append("shippingFree", shippingFree ? "1" : "0");
    fd.append("shippingFreeFromQtyStr", shippingFreeFromQtyStr.trim());

    newFiles.forEach((file) => fd.append("images", file));

    if (isEditing) {
      const kept = existingImgs
        .map((abs) => toRel(abs))
        .filter((rel) => rel && !removeExisting.has(rel));
      fd.append("keepImages", JSON.stringify(kept));
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${BASE}/api/admin/produtos/${produtoEditado!.id}`
      : `${BASE}/api/admin/produtos`;

    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        body: fd,
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const txt = await safeText(res);
          throw new Error(
            txt || "Você não tem permissão para salvar este produto. Faça login novamente."
          );
        }

        const txt = await safeText(res);
        throw new Error(
          `Falha ao ${isEditing ? "atualizar" : "salvar"} (${res.status}). ${txt || ""}`
        );
      }

      setMsg({
        type: "success",
        text: isEditing ? "Produto atualizado com sucesso." : "Produto salvo com sucesso.",
      });

      resetForm();
      onProdutoAdicionado?.();
      onLimparEdicao?.();
    } catch (e: any) {
      setMsg({ type: "error", text: e?.message || "Erro ao salvar produto." });
    } finally {
      setLoading(false);
    }
  }

  async function safeText(res: Response) {
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const j = await res.json();
        return (j as any)?.message || JSON.stringify(j);
      }
      return await res.text();
    } catch {
      return "";
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-5 rounded-2xl bg-white p-4 shadow-sm sm:p-6 md:p-8"
    >
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#359293] sm:text-lg">
            {isEditing ? "Editar Produto" : "Adicionar Produto"}
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Preencha os dados abaixo para manter o catálogo sempre atualizado.
          </p>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              onLimparEdicao?.();
            }}
            className="self-start rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:self-auto"
          >
            Cancelar edição
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              Nome do produto
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359293]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Ração Premium 10kg"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              Categoria
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359293]"
              value={String(categoryId)}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Selecione...</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              Descrição
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359293]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do produto, recomendações de uso, etc."
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
                Preço
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359293]"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="Ex.: 200,00"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
                Quantidade em estoque
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#359293]"
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                placeholder="Ex.: 10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              Imagens do produto (opcional)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onPickFiles}
            />

            {!!newPreviews.length && (
              <div className="flex flex-wrap gap-2">
                {newPreviews.map((src, i) => (
                  <div key={src} className="relative">
                    <img
                      src={src}
                      alt={`Nova imagem ${i + 1}`}
                      className="h-16 w-16 rounded-lg object-cover ring-1 ring-black/10"
                    />
                    <button
                      type="button"
                      className="absolute -right-2 -top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
                      onClick={() => removeNewImage(i)}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!!existingImgs.length && (
              <div className="flex flex-wrap gap-2">
                {existingImgs.map((abs) => {
                  const rel = toRel(abs);
                  const willRemove = removeExisting.has(rel);
                  return (
                    <button
                      key={abs}
                      type="button"
                      onClick={() => toggleRemoveExisting(abs)}
                      className={`relative rounded-lg ring-1 ring-black/10 transition ${
                        willRemove ? "opacity-40" : "opacity-100"
                      }`}
                      title={willRemove ? "Remover" : "Manter"}
                    >
                      <img
                        src={abs}
                        alt="Imagem existente"
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      {willRemove && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-red-600">
                          Remover
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <ProductShippingSection
            value={{ shippingFree, shippingFreeFromQtyStr }}
            onChange={(next) => {
              setShippingFree(!!next.shippingFree);
              setShippingFreeFromQtyStr(next.shippingFreeFromQtyStr ?? "");
            }}
          />
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={resetForm}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          Limpar
        </button>

        <button
          type="submit"
          className="rounded-full bg-[#2F7E7F] px-5 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Salvando..." : isEditing ? "Salvar alterações" : "Adicionar Produto"}
        </button>
      </div>
    </form>
  );
}
