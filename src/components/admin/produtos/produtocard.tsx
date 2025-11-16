// src/components/admin/produtos/ProdutoCard.tsx
"use client";

import React, { useMemo, useState } from "react";

export type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  quantity: number | string;
  category_id?: number | null;
  image?: string | null;      // capa vinda do banco (ex.: "/uploads/abc.jpg")
  images?: string[];          // urls adicionais (ex.: ["/uploads/1.jpg", ...])
};

type Props = {
  produto: Product;
  onEditar?: (p: Product) => void;
  onRemover?: (id: number) => Promise<void> | void;
  confirmText?: string;
  readOnly?: boolean;
  /** Permite controlar margens no grid/página (ex.: "mt-6") */
  className?: string;
};

const PLACEHOLDER = "/placeholder.png";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Converte paths relativos ("/uploads/...") em URL absoluta do backend */
function absUrl(p?: string | null) {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;
}

function toBRL(n: number) {
  try {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  } catch {
    return `R$ ${n.toFixed(2)}`;
  }
}

export default function ProdutoCard({
  produto,
  onEditar,
  onRemover,
  confirmText = "Tem certeza que deseja remover este produto?",
  readOnly = false,
  className = "",
}: Props) {
  const [removing, setRemoving] = useState(false);

  const price = useMemo(() => Number(produto.price) || 0, [produto.price]);
  const qty   = useMemo(() => Number(produto.quantity) || 0, [produto.quantity]);

  // Monta lista de imagens (capa + extras) normalizando para URL absoluta e removendo duplicatas
  const images = useMemo(() => {
    const extras = Array.isArray(produto.images) ? produto.images : [];
    const all = [produto.image, ...extras].filter(Boolean) as string[];
    const unique = Array.from(new Set(all));
    return unique
      .map(absUrl)
      .filter(Boolean) as string[]; // só strings válidas
  }, [produto.image, produto.images]);

  const cover = images[0] || PLACEHOLDER;

  async function handleRemove() {
    if (!onRemover || readOnly) return;
    if (!window.confirm(confirmText)) return;
    try {
      setRemoving(true);
      await onRemover(produto.id);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <article
      className={`bg-white rounded-xl shadow-sm ring-1 ring-black/5 overflow-hidden flex flex-col ${className}`}
      aria-labelledby={`prod-${produto.id}-title`}
    >
      {/* Capa */}
      <div className="relative">
        <img
          src={cover}
          alt={produto.name || "Imagem do produto"}
          className="w-full h-44 object-cover bg-gray-50"
          onError={(e) => ((e.currentTarget.src = PLACEHOLDER))}
          loading="lazy"
        />
        {qty <= 0 && (
          <span className="absolute top-2 left-2 text-xs font-semibold bg-red-600 text-white px-2 py-0.5 rounded">
            Sem estoque
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col gap-2">
        <h3
          id={`prod-${produto.id}-title`}
          className="text-base font-semibold text-gray-900 line-clamp-1"
          title={produto.name}
        >
          {produto.name}
        </h3>

        {produto.description && (
          <p
            className="text-sm text-gray-600 line-clamp-2"
            title={produto.description || undefined}
          >
            {produto.description}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between">
          <span className="text-[#2F7E7F] font-semibold">{toBRL(price)}</span>
          <span className="text-xs text-gray-500">Qtde: {qty}</span>
        </div>

        {/* Miniaturas (se houver) */}
        {images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {images.slice(1, 6).map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={`Miniatura ${i + 1}`}
                className="w-12 h-12 rounded object-cover ring-1 ring-black/10 bg-gray-50 flex-shrink-0"
                onError={(e) => ((e.currentTarget.src = PLACEHOLDER))}
                loading="lazy"
              />
            ))}
            {images.length > 6 && (
              <span className="text-xs text-gray-500 self-center">
                +{images.length - 6}
              </span>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="mt-3 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => onEditar?.(produto)}
            disabled={readOnly}
            className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={readOnly || removing}
            className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {removing ? "Removendo..." : "Remover"}
          </button>
        </div>
      </div>
    </article>
  );
}
