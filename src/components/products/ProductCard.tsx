"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import AddToCartButton from "@/components/buttons/AddToCartButton";
import type { Product } from "@/types/product";
import { resolveStockValue } from "../../utils/stock";
import { useAuth } from "@/context/AuthContext";
import { absUrl } from "@/utils/absUrl";
import apiClient from "@/lib/apiClient";
import { useProductPromotion } from "@/hooks/useProductPromotion";
import { computeProductPrice } from "@/utils/pricing";
import { formatCurrency } from "@/utils/formatters";

type Props = {
  product: Product;
  images?: string[];
  className?: string;
  initialIsFavorite?: boolean;
};

const PLACEHOLDER = "/placeholder.png";


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
      const norm = externalImages.map((img) => {
        const result = absUrl(img);
        return result;
      }).filter(Boolean) as string[];
      return norm.length ? norm : [PLACEHOLDER];
    }
    const extras: string[] = Array.isArray(product.images)
      ? (product.images as unknown as string[])
      : [];
    const all = [product.image, ...extras].filter(Boolean) as string[];
    const uniq = Array.from(new Set(all))
      .map((img) => absUrl(img))
      .filter(Boolean) as string[];
    return uniq.length ? uniq : [PLACEHOLDER];
  }, [externalImages, product.image, product.images]);

  const cover = images[0] ?? PLACEHOLDER;

  // === Estoque ===
  const stock = resolveStockValue(
    product.quantity,
    product.estoque,
    product.stock,
  );
  const outOfStock = typeof stock === "number" ? stock <= 0 : false;

  // === Frete grátis (badge) ===
  const shippingFree = Boolean(product.shipping_free);
  const shippingFreeFromQty =
    product.shipping_free_from_qty != null
      ? Number(product.shipping_free_from_qty)
      : null;

  // === Avaliação (⭐) ===
  const ratingAvgRaw = product.rating_avg;
  const ratingCountRaw = product.rating_count;

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
  const { promotion } = useProductPromotion(product?.id);

  const { originalPrice, finalPrice, discountPercent, hasDiscount } = useMemo(
    () => computeProductPrice(product.price, promotion),
    [product.price, promotion],
  );

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

    if (favLoading) return;

    const wasFavorite = isFavorite;
    setIsFavorite(!wasFavorite);
    setFavLoading(true);

    try {
      if (wasFavorite) {
        await apiClient.del(`/api/favorites/${product.id}`);
      } else {
        await apiClient.post("/api/favorites", { productId: product.id });
      }
    } catch {
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
        "p-2.5 sm:p-4",
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
          absolute right-2 top-2 z-20
          inline-flex h-7 w-7 items-center justify-center
          rounded-full bg-white/95
          border border-gray-200
          shadow-sm
          hover:bg-white hover:border-rose-300 hover:text-rose-500
          transition
          sm:right-3 sm:top-3 sm:h-9 sm:w-9
        "
      >
        <Heart
          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
          fill={isFavorite ? "currentColor" : "none"}
        />
      </button>

      {/* Imagem */}
      <Link
        href={`/produtos/${product.id}`}
        aria-label={`Ver detalhes de ${product.name}`}
        prefetch={false}
        className="relative block w-full overflow-hidden rounded-xl bg-gray-50"
      >
        <div className="relative w-full aspect-[5/4] sm:aspect-[16/11]">
          <Image
            src={cover}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={85}
          />
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-3rem)] flex-col gap-1">
          {outOfStock && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-[10px]">
              Esgotado
            </span>
          )}

          {hasDiscount && !outOfStock && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-[10px]">
              -{discountPercent!.toFixed(0)}% OFF
            </span>
          )}

          {shippingFree && !outOfStock && (
            <span className="max-w-full truncate rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm sm:px-2.5 sm:py-1 sm:text-[10px]">
              {shippingFreeFromQty
                ? `Frete grátis ${shippingFreeFromQty}+ un.`
                : "Frete grátis"}
            </span>
          )}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="mt-2.5 flex flex-1 flex-col sm:mt-3">
        <Link
          href={`/produtos/${product.id}`}
          prefetch={false}
          className="min-h-[36px] line-clamp-2 text-[13px] sm:min-h-[44px] sm:text-[15px] font-semibold text-gray-900 hover:underline underline-offset-2"
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

        {/* Descrição — escondida no mobile (carrossel compacto) */}
        {product.description && (
          <p className="mt-1 hidden min-h-[36px] line-clamp-2 text-xs sm:block sm:text-sm text-gray-600">
            {product.description}
          </p>
        )}

        {/* Preço + desconto */}
        <div className="mt-2 space-y-0.5 sm:mt-3">
          {hasDiscount && (
            <div className="text-[11px] text-gray-400 line-through sm:text-xs">
              {formatCurrency(originalPrice)}
            </div>
          )}
          <span className="text-base font-extrabold text-emerald-600 sm:text-xl">
            {formatCurrency(finalPrice)}
          </span>
        </div>

        <div className="mt-auto flex flex-col gap-1.5 pt-3 sm:gap-2 sm:pt-4">
          <div className="w-full">
            <AddToCartButton product={productForCart} disabled={outOfStock} />
          </div>

          <Link
            href={`/produtos/${product.id}`}
            prefetch={false}
            className="w-full text-center text-[12px] font-medium text-emerald-700 underline-offset-2 hover:underline sm:inline-flex sm:items-center sm:justify-center sm:rounded-lg sm:border sm:border-gray-300 sm:px-3 sm:py-2 sm:text-sm sm:text-gray-700 sm:no-underline sm:hover:bg-gray-50"
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}
