"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import AddToCartButton from "@/components/buttons/AddToCartButton";
import type { Product } from "@/types/product";
import { resolveStockValue } from "../../utils/stock";
import { useAuth } from "@/context/AuthContext";

type Props = {
  product: Product;
  images?: string[];
  className?: string;
  initialIsFavorite?: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/placeholder.png";

/** normaliza URL de imagem */
function absUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const src = String(raw).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads")) return `${API_BASE}${src}`;
  if (src.startsWith("uploads")) return `${API_BASE}/${src}`;
  if (!src.startsWith("/")) return `${API_BASE}/uploads/${src}`;
  return `${API_BASE}${src}`;
}

/** formatador BRL determinístico */
function formatBRL(value: unknown): string {
  const n = Number(value ?? 0);
  const [int, dec] = n.toFixed(2).split(".");
  const mil = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${mil},${dec}`;
}

// Promoção vinda da rota pública
type ProductPromotion = {
  id: number;
  product_id?: number;
  title?: string | null;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  promo_price?: number | string | null;
  ends_at?: string | null;
};

export default function ProductCard({
  product,
  images: externalImages,
  className = "",
  initialIsFavorite,
}: Props) {
  const { user } = useAuth(); // pega user + token do contexto

  // === Imagens ===
  const images = useMemo(() => {
    if (externalImages?.length) {
      const norm = externalImages.map(absUrl).filter(Boolean) as string[];
      return norm.length ? norm : [PLACEHOLDER];
    }
    const extras: string[] = Array.isArray(product.images)
      ? (product.images as unknown as string[])
      : [];
    const all = [product.image, ...extras].filter(Boolean) as string[];
    const uniq = Array.from(new Set(all))
      .map(absUrl)
      .filter(Boolean) as string[];
    return uniq.length ? uniq : [PLACEHOLDER];
  }, [externalImages, product.image, product.images]);

  const cover = images[0] ?? PLACEHOLDER;

  // === Estoque ===
  const stock = resolveStockValue(
    (product as any).quantity,
    (product as any).estoque,
    (product as any).stock
  );
  const outOfStock = typeof stock === "number" ? stock <= 0 : false;

  // === Frete grátis (badge) ===
  // Regra de negócio:
  // shipping_free = 1 => produto tem frete grátis
  // shipping_free_from_qty null => sempre grátis
  // shipping_free_from_qty número => grátis a partir daquela quantidade
  const shippingFree = Boolean((product as any).shipping_free);
  const shippingFreeFromQty =
    (product as any).shipping_free_from_qty != null
      ? Number((product as any).shipping_free_from_qty)
      : null;

  // === Avaliação (⭐) ===
  const ratingAvgRaw = (product as any).rating_avg;
  const ratingCountRaw = (product as any).rating_count;

  const ratingAvg =
    ratingAvgRaw !== null && ratingAvgRaw !== undefined
      ? Number(ratingAvgRaw)
      : NaN;
  const ratingCount =
    ratingCountRaw !== null && ratingCountRaw !== undefined
      ? Number(ratingCountRaw)
      : 0;

  const hasRating =
    !Number.isNaN(ratingAvg) && ratingAvg > 0 && ratingCount > 0;

  // === Promoção / desconto ===
  const [promotion, setPromotion] = useState<ProductPromotion | null>(null);

  useEffect(() => {
    let ignore = false;

    async function fetchPromotion() {
      try {
        if (!product?.id) return;

        const res = await fetch(`${API_BASE}/api/public/promocoes/${product.id}`);

        if (!res.ok) {
          // 404 = não tem promo pra esse produto, só ignora
          return;
        }

        const data = await res.json();
        if (!ignore) {
          setPromotion(data as ProductPromotion);
        }
      } catch (err) {
        console.error("[ProductCard] erro ao buscar promoção:", err);
      }
    }

    fetchPromotion();

    return () => {
      ignore = true;
    };
  }, [product?.id]);

  // === Cálculo de preço final (mesma lógica do produto) ===
  const precoBase = Number(product.price ?? 0);

  const originalFromPromo =
    promotion?.original_price != null ? Number(promotion.original_price) : null;
  const finalFromPromo =
    promotion?.final_price != null
      ? Number(promotion.final_price)
      : promotion?.promo_price != null
        ? Number(promotion.promo_price)
        : null;

  const originalPrice = originalFromPromo !== null ? originalFromPromo : precoBase || 0;

  let finalPrice = finalFromPromo !== null ? finalFromPromo : originalPrice;

  let discountPercent: number | null = null;

  if (promotion) {
    const explicitDiscount =
      promotion.discount_percent != null ? Number(promotion.discount_percent) : NaN;

    // se veio só % de desconto sem final_price calculado
    if (
      finalFromPromo === null &&
      !Number.isNaN(explicitDiscount) &&
      explicitDiscount > 0 &&
      originalPrice > 0
    ) {
      finalPrice = originalPrice * (1 - explicitDiscount / 100);
    }

    // calcula % real
    if (originalPrice > 0 && finalPrice < originalPrice) {
      discountPercent = ((originalPrice - finalPrice) / originalPrice) * 100;
    } else if (!Number.isNaN(explicitDiscount) && explicitDiscount > 0) {
      discountPercent = explicitDiscount;
    }
  }

  const hasDiscount =
    discountPercent !== null && discountPercent > 0 && finalPrice < originalPrice;

  // produto que vai para o carrinho com o PREÇO FINAL
  const productForCart: Product = {
    ...product,
    price: finalPrice,
  };

  // === Favoritos ===
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (initialIsFavorite) setIsFavorite(true);
  }, [initialIsFavorite]);

  const handleToggleFavorite = useCallback(async () => {
    // se não tiver user, manda pra login
    if (!user) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return;
    }

    const token = (user as any).token;
    if (!token) {
      console.warn("Usuário logado mas sem token. Faça login novamente.");
      return;
    }

    if (favLoading) return;

    const wasFavorite = isFavorite;
    setIsFavorite(!wasFavorite);
    setFavLoading(true);

    try {
      const url = wasFavorite
        ? `${API_BASE}/api/favorites/${product.id}`
        : `${API_BASE}/api/favorites`;

      const options: RequestInit = {
        method: wasFavorite ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      if (!wasFavorite) {
        options.body = JSON.stringify({ productId: product.id });
      }

      const res = await fetch(url, options);

      if (!res.ok) {
        // desfaz se der erro
        setIsFavorite(wasFavorite);
        console.error("Falha ao atualizar favorito");
      }
    } catch (err) {
      console.error("Erro ao chamar /api/favorites:", err);
      setIsFavorite(wasFavorite);
    } finally {
      setFavLoading(false);
    }
  }, [user, isFavorite, favLoading, product.id]);

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
      {/* Botão de favorito */}
      <button
        type="button"
        onClick={handleToggleFavorite}
        aria-pressed={isFavorite}
        disabled={favLoading}
        className="
          absolute right-3 top-3 z-20
          inline-flex h-9 w-9 items-center justify-center
          rounded-full bg-white/95
          border border-gray-200
          shadow-sm
          hover:bg-white hover:border-rose-300 hover:text-rose-500
          transition
        "
      >
        <Heart className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
      </button>

      {/* Imagem */}
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
          />
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {outOfStock && (
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Esgotado
            </span>
          )}

          {hasDiscount && !outOfStock && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              -{discountPercent!.toFixed(0)}% OFF
            </span>
          )}

          {shippingFree && !outOfStock && (
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              {shippingFreeFromQty
                ? `Frete grátis a partir de ${shippingFreeFromQty} un.`
                : "Frete grátis"}
            </span>
          )}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="mt-3 flex flex-1 flex-col">
        <Link
          href={`/produtos/${product.id}`}
          prefetch={false}
          className="min-h-[44px] line-clamp-2 text-sm sm:text-[15px] font-semibold text-gray-900 hover:underline underline-offset-2"
        >
          {product.name}
        </Link>

        {/* ⭐ Avaliação resumida */}
        {hasRating && (
          <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
            <span>⭐ {ratingAvg.toFixed(1)}</span>
            <span className="text-[11px] text-gray-500">
              ({ratingCount} avaliação{ratingCount > 1 ? "s" : ""})
            </span>
          </div>
        )}

        {product.description && (
          <p className="mt-1 min-h-[36px] line-clamp-2 text-xs sm:text-sm text-gray-600">
            {product.description}
          </p>
        )}

        {/* Preço + desconto */}
        <div className="mt-3 space-y-0.5">
          {hasDiscount && (
            <div className="text-xs text-gray-400 line-through">
              {formatBRL(originalPrice)}
            </div>
          )}
          <span className="text-lg sm:text-xl font-extrabold text-emerald-600">
            {formatBRL(finalPrice)}
          </span>
        </div>

        <div className="mt-auto pt-4 flex flex-col gap-2">
          <div className="w-full">
            <AddToCartButton product={productForCart} disabled={outOfStock} />
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
