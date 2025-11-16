// src/components/admin/produtos/produtoform.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Category = { id: number; name: string };

export type Product = {
  id?: number;
  name: string;
  description?: string | null;
  price: number | string;
  quantity: number | string;
  category_id?: number | null;
  image?: string | null;   // capa (string relativa: "/uploads/a.jpg")
  images?: string[];       // extras (strings relativas)
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

// Normaliza URL absoluta p/ preview
const toAbs = (p?: string | null) =>
  !p ? null : p.startsWith("http") ? p : `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;

// Converte URL absoluta de volta para caminho relativo (para o backend)
const toRel = (u: string) => (u?.startsWith(API_BASE) ? u.slice(API_BASE.length) : u);

export default function ProdutoForm({
  produtoEditado,
  onProdutoAdicionado,
  onLimparEdicao,
}: ProdutoFormProps) {
  /* --------------------------- estados de formulário --------------------------- */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [quantityStr, setQuantityStr] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");

  /* ------------------------- estados auxiliares/ux ------------------------- */
  const [categories, setCategories] = useState<Category[]>([]);

  // Imagens existentes (URLs absolutas p/ preview) e seleção de remoção (guardamos relativas)
  const [existingImgs, setExistingImgs] = useState<string[]>([]);
  const [removeExisting, setRemoveExisting] = useState<Set<string>>(new Set());

  // Novas imagens (Files) + seus previews blob
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Message>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEditing = !!produtoEditado?.id;

  /* -------------------------------- efeitos -------------------------------- */
  // Carregar categorias protegidas
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      setMsg({ type: "error", text: "Faça login no admin para continuar." });
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/categorias`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Falha ao carregar categorias (${res.status})`);
        const data: Category[] = await res.json();
        setCategories(data);
      } catch (e: any) {
        setMsg({ type: "error", text: e?.message || "Erro ao carregar categorias." });
      }
    })();
  }, []);

  // Preenche o form ao iniciar/alterar produto em edição
  useEffect(() => {
    if (produtoEditado) {
      setName(produtoEditado.name || "");
      setDescription(produtoEditado.description || "");
      setPriceStr(String(produtoEditado.price ?? ""));
      setQuantityStr(String(produtoEditado.quantity ?? ""));
      setCategoryId(produtoEditado.category_id || "");

      // 🔑 Capa + extras -> remove DUPLICADOS antes de montar preview
      const extras = Array.isArray(produtoEditado.images) ? produtoEditado.images : [];
      const allRel = [produtoEditado.image, ...extras].filter(Boolean) as string[]; // relativos
      const uniqueRel = Array.from(new Set(allRel)); // remove duplicatas por caminho relativo
      const urlsAbs = uniqueRel
        .map((p) => toAbs(p)!)
        .filter(Boolean); // absolutas para preview

      setExistingImgs(urlsAbs);

      // Reseta seleções
      setRemoveExisting(new Set());
      setNewFiles([]);
      setNewPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtoEditado]);

  // Gera/desmonta previews de novas imagens
  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setNewPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newFiles]);

  /* ------------------------------ normalizadores ------------------------------ */
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

  /* --------------------------------- helpers --------------------------------- */
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

  /* ---------------------------------- eventos --------------------------------- */
  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // Evita excesso e permite anexar mais de uma vez
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

    const token = localStorage.getItem("adminToken");
    if (!token) {
      setMsg({ type: "error", text: "Faça login no admin para continuar." });
      return;
    }

    // FormData base
    const fd = new FormData();
    fd.append("name", name.trim());
    fd.append("description", (description || "").trim());
    fd.append("price", String(price));
    fd.append("quantity", String(quantity));
    fd.append("category_id", String(categoryId));

    // Arquivos novos (se houver)
    newFiles.forEach((file) => fd.append("images", file));

    if (isEditing) {
      // Mantém TODAS as antigas exceto as marcadas para remoção
      const kept = existingImgs
        .map((abs) => toRel(abs))
        .filter((rel) => rel && !removeExisting.has(rel));

      // Envia ao backend a LISTA FINAL que deve permanecer
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
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
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
        return j?.message || JSON.stringify(j);
      }
      return await res.text();
    } catch {
      return "";
    }
  }

  /* ----------------------------------- UI ----------------------------------- */
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 mb-4 bg-white rounded-xl shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#359293]">
          {isEditing ? "Editar Produto" : "Adicionar Produto"}
        </h2>

        {isEditing && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              onLimparEdicao?.();
            }}
            className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
          >
            Cancelar edição
          </button>
        )}
      </div>

      {/* Nome */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Nome</label>
        <input
          className="border rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Ração Premium 10kg"
          required
        />
      </div>

      {/* Descrição */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Descrição</label>
        <textarea
          className="border rounded px-3 py-2 min-h-[80px]"
          value={description || ""}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detalhes do produto…"
        />
      </div>

      {/* Preço e Quantidade */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Preço</label>
          <input
            className="border rounded px-3 py-2"
            value={priceStr}
            onChange={(e) => setPriceStr(e.target.value)}
            placeholder="Ex.: 200,00"
            inputMode="decimal"
          />
          <span className="text-xs text-gray-500">
            Interpretação: <strong>R$ {price.toFixed(2)}</strong>
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Quantidade</label>
          <input
            className="border rounded px-3 py-2"
            value={quantityStr}
            onChange={(e) => setQuantityStr(e.target.value)}
            placeholder="Ex.: 10"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Categoria */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Categoria</label>
        <select
          className="border rounded px-3 py-2"
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

      {/* Imagens existentes (com toggle de remoção) */}
      {isEditing && existingImgs.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Imagens atuais</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {existingImgs.map((u) => {
              const rel = toRel(u);
              const marked = removeExisting.has(rel);
              return (
                <button
                  key={u} // 🔑 agora único, pois deduplicamos a origem
                  type="button"
                  onClick={() => toggleRemoveExisting(u)}
                  className={`relative rounded overflow-hidden border ${
                    marked ? "ring-2 ring-red-500" : "ring-1 ring-black/10"
                  }`}
                  title={marked ? "Marcada p/ remover (clique p/ desfazer)" : "Clique p/ marcar remoção"}
                >
                  <img src={u} alt="img existente" className="w-full h-28 object-cover" />
                  <span
                    className={`absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded ${
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
            <p className="text-xs text-red-600">
              {removeExisting.size} imagem(ns) marcada(s) para remoção.
            </p>
          )}
        </div>
      )}

      {/* Novas imagens (append) */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">
          {isEditing ? "Adicionar novas imagens (opcional)" : "Imagens do produto (opcional)"}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onPickFiles}
          className="block"
        />

        {newPreviews.length > 0 && (
          <>
            <p className="text-xs text-gray-500">
              Estas serão <strong>adicionadas</strong> ao produto.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {newPreviews.map((src, i) => (
                <div key={`${src}-${i}`} className="relative">
                  <img
                    src={src}
                    alt={`img-nova-${i}`}
                    className="w-full h-28 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1 right-1 text-xs bg-black/70 text-white px-2 py-1 rounded"
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

      {/* Mensagens */}
      {msg && (
        <div
          className={`text-sm rounded px-3 py-2 ${
            msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => {
            resetForm();
            onLimparEdicao?.();
          }}
          disabled={loading}
          className="px-4 py-2 rounded border hover:bg-gray-50 disabled:opacity-50"
        >
          Limpar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-[#2F7E7F] text-white hover:opacity-95 disabled:opacity-50"
        >
          {loading ? (isEditing ? "Atualizando..." : "Salvando...") : isEditing ? "Atualizar Produto" : "Adicionar Produto"}
        </button>
      </div>
    </form>
  );
}
