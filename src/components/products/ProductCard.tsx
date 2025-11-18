"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/buttons/AddToCartButton";
import type { Product } from "@/types/product";
import { resolveStockValue } from "../../utils/stock";

type Props = {
  product: Product;
  images?: string[];
  className?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/placeholder.png";

/** Mantém a mesma lógica de normalização de URL */
function absUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const src = String(raw).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads")) return `${API_BASE}${src}`;
  if (src.startsWith("uploads")) return `${API_BASE}/${src}`;
  if (!src.startsWith("/")) return `${API_BASE}/uploads/${src}`;
  return `${API_BASE}${src}`;
}

/** ✅ Formatador BRL determinístico (sem Intl) — evita divergência SSR x cliente */
function formatBRL(value: unknown): string {
  const n = Number(value ?? 0);
  const [int, dec] = n.toFixed(2).split(".");
  const mil = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${mil},${dec}`;
}

export default function ProductCard({
  product,
  images: externalImages,
  className = "",
}: Props) {
  // === Imagens (mesma lógica, apenas organizada) ===
  const images = useMemo(() => {
    if (externalImages?.length) {
      const norm = externalImages.map(absUrl).filter(Boolean) as string[];
      return norm.length ? norm : [PLACEHOLDER];
    }
    const extras: string[] = Array.isArray(product.images)
      ? (product.images as unknown as string[])
      : [];
    const all = [product.image, ...extras].filter(Boolean) as string[];
    const uniq = Array.from(new Set(all)).map(absUrl).filter(Boolean) as string[];
    return uniq.length ? uniq : [PLACEHOLDER];
  }, [externalImages, product.image, product.images]);

  const cover = images[0] ?? PLACEHOLDER;

  // === Estoque (sem mudar a regra) ===
  const stock = resolveStockValue(
    (product as any).quantity,
    (product as any).estoque,
    (product as any).stock
  );

  const outOfStock = typeof stock === "number" ? stock <= 0 : false;

  return (
    <article
      className={[
        "group relative flex h-full flex-col rounded-2xl border border-gray-200 bg-white",
        "shadow-sm hover:shadow-md transition-shadow",
        "ring-1 ring-gray-100 hover:ring-emerald-200/70",
        "p-3 sm:p-4",
        className,
      ].join(" ")}
    >
      {/* Imagem com proporção estável */}
      <Link
        href={`/produtos/${product.id}`}
        aria-label={`Ver detalhes de ${product.name}`}
        prefetch={false}
        className="relative block w-full overflow-hidden rounded-xl bg-gray-50"
      >
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/11]">
          <Image
            src={cover}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={false}
          />
        </div>

        {/* Badge de esgotado (visualmente discreto) */}
        {outOfStock && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
            Esgotado
          </span>
        )}
      </Link>

      {/* Conteúdo */}
      <div className="mt-3 flex flex-1 flex-col">
        {/* Título: reserva espaço p/ 2 linhas (mantém mesma altura entre cards) */}
        <Link
          href={`/produtos/${product.id}`}
          prefetch={false}
          className="min-h-[44px] line-clamp-2 text-sm sm:text-[15px] font-semibold text-gray-900 hover:underline underline-offset-2"
        >
          {product.name}
        </Link>

        {/* Descrição: também reserva espaço p/ 2 linhas */}
        {product.description && (
          <p className="mt-1 min-h-[36px] line-clamp-2 text-xs sm:text-sm text-gray-600">
            {product.description}
          </p>
        )}

        {/* Preço (apenas troca para formatBRL) */}
        <div className="mt-3">
          <span className="text-lg sm:text-xl font-extrabold text-emerald-600">
            {formatBRL(product.price)}
          </span>
        </div>

        {/* Ações: sempre encostadas no rodapé do card e empilhadas */}
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <div className="w-full">
            <AddToCartButton product={product} disabled={outOfStock} />
          </div>

          <Link
            href={`/produtos/${product.id}`}
            prefetch={false}
            className="w-full inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}
