"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import ProductShippingSection from "./ProductShippingSection";
import { absUrl } from "@/utils/absUrl";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { isApiError } from "@/lib/errors";

type Msg = { type: "success" | "error"; text: string };

type Categoria = {
  id: number;
  name: string;
  is_active: 0 | 1 | boolean;
};

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

  shipping_prazo_dias?: number | null;
};

type Props = {
  API_BASE?: string;
  produtoEditado?: ProdutoEditado | null;
  onProdutoAdicionado?: () => void;
  onLimparEdicao?: () => void;
};

export default function ProdutoForm({
  produtoEditado,
  onProdutoAdicionado,
  onLimparEdicao,
}: Omit<Props, "API_BASE">) {

  const isEditing = !!produtoEditado;

  const [msg, setMsg] = useState<Msg | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [quantityStr, setQuantityStr] = useState("");
  const [categoryId, setCategoryId] = useState<string | number>("");
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [existingImgs, setExistingImgs] = useState<string[]>([]);
  const [removeExisting, setRemoveExisting] = useState<Set<string>>(new Set());
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [shippingFree, setShippingFree] = useState<boolean>(false);
  const [shippingFreeFromQtyStr, setShippingFreeFromQtyStr] =
    useState<string>("");

  const [shippingPrazoDiasStr, setShippingPrazoDiasStr] = useState<string>("");

  useEffect(() => {
    apiClient
      .get<Categoria[]>("/api/admin/categorias")
      .then((res) => {
        const ativas = (Array.isArray(res) ? res : []).filter(
          (c) => c.is_active === 1 || c.is_active === true,
        );
        setCategorias(ativas);
      })
      .catch((err) => {
        console.error("Erro ao carregar categorias:", err);
      });
  }, []);

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

      const extras = Array.isArray(produtoEditado.images)
        ? produtoEditado.images
        : [];
      const allRel = [produtoEditado.image, ...extras].filter(
        Boolean,
      ) as string[];
      const uniqueRel = Array.from(new Set(allRel));
      const urlsAbs = uniqueRel.map((p) => absUrl(p)).filter(Boolean);

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
        produtoEditado.shipping_free_from_qty
          ? String(produtoEditado.shipping_free_from_qty)
          : "",
      );

      setShippingPrazoDiasStr(
        produtoEditado.shipping_prazo_dias
          ? String(produtoEditado.shipping_prazo_dias)
          : "",
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
    [quantityStr],
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
    setShippingPrazoDiasStr("");
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

    if (shippingPrazoDiasStr.trim()) {
      const n = Number(shippingPrazoDiasStr);
      if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
        return "Prazo do produto (dias): informe um número inteiro válido (ex: 3).";
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

    fd.append("shippingFree", shippingFree ? "1" : "0");
    fd.append("shippingFreeFromQtyStr", shippingFreeFromQtyStr.trim());
    fd.append("shippingPrazoDiasStr", shippingPrazoDiasStr.trim());

    newFiles.forEach((file) => fd.append("images", file));

    if (isEditing) {
      const kept = existingImgs
        .map((abs) => toRel(abs))
        .filter((rel) => rel && !removeExisting.has(rel));
      fd.append("keepImages", JSON.stringify(kept));
    }

    const path = isEditing
      ? `/api/admin/produtos/${produtoEditado!.id}`
      : `/api/admin/produtos`;

    setLoading(true);

    try {
      // apiClient injeta CSRF token automaticamente e gerencia credentials
      if (isEditing) {
        await apiClient.put(path, fd, { skipContentType: true });
      } else {
        await apiClient.post(path, fd, { skipContentType: true });
      }

      setMsg({
        type: "success",
        text: isEditing
          ? "Produto atualizado com sucesso."
          : "Produto salvo com sucesso.",
      });

      resetForm();
      onProdutoAdicionado?.();
      onLimparEdicao?.();
    } catch (err: unknown) {
      const ui = formatApiError(err, "Erro ao salvar produto.");
      const isAuthErr = isApiError(err) && (err.status === 401 || err.status === 403);
      // Usa mensagem do backend quando é específica (ex: RBAC); caso contrário exibe genérica.
      let errMsg: string;
      if (isAuthErr && err.message && err.message !== `HTTP ${err.status}`) {
        errMsg = err.message;
      } else if (isAuthErr) {
        errMsg = "Você não tem permissão para salvar este produto. Faça login novamente.";
      } else if (ui.status) {
        const action = isEditing ? "atualizar" : "adicionar";
        errMsg = `Falha ao ${action} (${ui.status}). ${ui.message}`;
      } else {
        errMsg = ui.message;
      }
      setMsg({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-5 rounded-2xl bg-white p-4 text-gray-900 shadow-sm sm:p-6 md:p-8"
    >
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-primary sm:text-lg">
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-primary"
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              value={String(categoryId)}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="" className="bg-white text-gray-400">
                Selecione...
              </option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-white text-gray-900">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              Descrição
            </label>
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-primary"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-primary"
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
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-gray-400 focus:border-primary"
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
            value={{
              shippingFree,
              shippingFreeFromQtyStr,
              shippingPrazoDiasStr,
            }}
            onChange={(next) => {
              setShippingFree(!!next.shippingFree);
              setShippingFreeFromQtyStr(next.shippingFreeFromQtyStr ?? "");
              setShippingPrazoDiasStr(next.shippingPrazoDiasStr ?? "");
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
          className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
          disabled={loading}
        >
          {loading
            ? "Salvando..."
            : isEditing
              ? "Salvar alterações"
              : "Adicionar Produto"}
        </button>
      </div>
    </form>
  );
}