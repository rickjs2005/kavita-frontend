"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

// 🔹 Tipo de categoria (mantido, com slug + is_active)
type Category = {
  id: number;
  name: string;
  slug?: string;
  is_active?: 0 | 1 | boolean;
};

export type Product = {
  id?: number;
  name: string;
  description?: string | null;
  price: number | string;
  quantity: number | string;
  category_id?: number | null;
  image?: string | null;
  images?: string[];
};

type Message =
  | { type: "success"; text: string }
  | { type: "error"; text: string }
  | null;

type ProdutoFormProps = {
  produtoEditado?: Product | null;
  onProdutoAdicionado?: () => void;
  onLimparEdicao?: () => void;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const toAbs = (p?: string | null) =>
  !p ? null : p.startsWith("http") ? p : `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;

const toRel = (u: string) => (u?.startsWith(API_BASE) ? u.slice(API_BASE.length) : u);

export default function ProdutoForm({
  produtoEditado,
  onProdutoAdicionado,
  onLimparEdicao,
}: ProdutoFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [quantityStr, setQuantityStr] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");

  const [categories, setCategories] = useState<Category[]>([]);

  const [existingImgs, setExistingImgs] = useState<string[]>([]);
  const [removeExisting, setRemoveExisting] = useState<Set<string>>(new Set());

  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Message>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEditing = !!produtoEditado?.id;

  // 🔐 BUSCA DE CATEGORIAS — agora usando cookie HttpOnly (credentials: "include")
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/categorias`, {
          cache: "no-store",
          credentials: "include", // ✅ envia o cookie HttpOnly
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("Você não tem permissão para listar categorias. Faça login novamente.");
          }
          throw new Error(`Falha ao carregar categorias (${res.status})`);
        }

        const data: Category[] = await res.json();

        // 🔹 Usa só categorias ativas (se API mandar is_active)
        const onlyActive = (data || []).filter(
          (c) => c.is_active === undefined || c.is_active === 1 || c.is_active === true
        );

        setCategories(onlyActive);
      } catch (e: any) {
        setMsg({ type: "error", text: e?.message || "Erro ao carregar categorias." });
      }
    })();
  }, []);

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
      const urlsAbs = uniqueRel.map((p) => toAbs(p)!).filter(Boolean);

      setExistingImgs(urlsAbs);
      setRemoveExisting(new Set());
      setNewFiles([]);
      setNewPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
  }

  function validate(): string | null {
    if (!name.trim()) return "Informe o nome do produto.";
    if (!categoryId) return "Selecione uma categoria.";
    if (price <= 0) return "Informe um preço válido.";
    if (quantity < 0) return "A quantidade não pode ser negativa.";
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

    newFiles.forEach((file) => fd.append("images", file));

    if (isEditing) {
      const kept = existingImgs
        .map((abs) => toRel(abs))
        .filter((rel) => rel && !removeExisting.has(rel));
      fd.append("keepImages", JSON.stringify(kept));
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing
      ? `${API_BASE}/api/admin/produtos/${produtoEditado!.id}`
      : `${API_BASE}/api/admin/produtos`;

    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        body: fd,
        credentials: "include", // ✅ cookie HttpOnly vai junto
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
      {/* Cabeçalho */}
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

      {/* Campos principais */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-4">
          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              Nome do produto
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 ring-0 transition focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Ração Premium 10kg"
              required
            />
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              Categoria
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              <option value="">Selecione…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              Descrição
            </label>
            <textarea
              className="min-h-[96px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 ring-0 transition focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20"
              value={description || ""}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do produto, recomendações de uso, etc."
            />
          </div>
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-4">
          {/* Preço e Quantidade */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
                Preço
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 ring-0 transition focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                placeholder="Ex.: 200,00"
                inputMode="decimal"
              />
              <span className="text-[11px] text-gray-500">
                Interpretação:{" "}
                <strong className="font-semibold">R$ {price.toFixed(2)}</strong>
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
                Quantidade em estoque
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 ring-0 transition focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20"
                value={quantityStr}
                onChange={(e) => setQuantityStr(e.target.value)}
                placeholder="Ex.: 10"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Imagens existentes */}
          {isEditing && existingImgs.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
                Imagens atuais
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {existingImgs.map((u) => {
                  const rel = toRel(u);
                  const marked = removeExisting.has(rel);
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => toggleRemoveExisting(u)}
                      className={`relative overflow-hidden rounded-lg border text-left shadow-sm transition ${
                        marked
                          ? "ring-2 ring-red-500"
                          : "ring-1 ring-black/5 hover:ring-[#359293]"
                      }`}
                      title={
                        marked
                          ? "Marcada para remover (clique p/ desfazer)"
                          : "Clique para marcar remoção"
                      }
                    >
                      <img
                        src={u}
                        alt="img existente"
                        className="h-28 w-full object-cover"
                      />
                      <span
                        className={`absolute right-1 top-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          marked ? "bg-red-600 text-white" : "bg-black/60 text-white"
                        }`}
                      >
                        {marked ? "remover" : "manter"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {removeExisting.size > 0 && (
                <p className="text-[11px] text-red-600">
                  {removeExisting.size} imagem(ns) marcada(s) para remoção.
                </p>
              )}
            </div>
          )}

          {/* Novas imagens */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              {isEditing
                ? "Adicionar novas imagens (opcional)"
                : "Imagens do produto (opcional)"}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={onPickFiles}
              className="block w-full text-xs text-gray-700 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-[#359293] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-[#287072]"
            />

            {newPreviews.length > 0 && (
              <>
                <p className="text-[11px] text-gray-500">
                  Estas imagens serão{" "}
                  <strong className="font-semibold">adicionadas</strong> ao produto.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {newPreviews.map((src, i) => (
                    <div
                      key={`${src}-${i}`}
                      className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm"
                    >
                      <img
                        src={src}
                        alt={`img-nova-${i}`}
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(i)}
                        className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white"
                        title="Remover esta nova imagem"
                      >
                        remover
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mensagens */}
      {msg && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            resetForm();
            onLimparEdicao?.();
          }}
          disabled={loading}
          className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          Limpar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#2F7E7F] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#266768] disabled:opacity-60 sm:w-auto"
        >
          {loading
            ? isEditing
              ? "Atualizando..."
              : "Salvando..."
            : isEditing
            ? "Atualizar Produto"
            : "Adicionar Produto"}
        </button>
      </div>
    </form>
  );
}
