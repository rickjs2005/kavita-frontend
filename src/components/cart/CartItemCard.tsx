"use client";

import Image from "next/image";
import React from "react";
import { CartItem } from "../../types/CartCarProps";
import { useCart } from "../../context/CartContext";
import CustomButton from "../buttons/CustomButton";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const PLACEHOLDER = "/placeholder.png";

function normalizePrice(price: unknown): number {
  if (typeof price === "number" && !Number.isNaN(price)) return price;
  if (typeof price === "string") {
    const cleaned = price.replace(/[^\d,.-]/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
function formatPriceBRL(n: number): string {
  return n.toFixed(2);
}
function resolveImage(raw: any): string {
  if (!raw) return PLACEHOLDER;
  if (typeof raw === "object") {
    const candidate = raw.url || raw.path || raw.src || raw.image;
    if (candidate) return resolveImage(candidate);
    return PLACEHOLDER;
  }
  let src = String(raw).trim().replace(/\\/g, "/");
  if (!src) return PLACEHOLDER;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/uploads")) return `${API}${src}`;
  if (src.startsWith("uploads")) return `${API}/${src}`;
  return `${API}/uploads/${src}`;
}

const quantityButtonClasses =
  "min-w-[36px] h-9 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold transition hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#359293] disabled:opacity-50 disabled:cursor-not-allowed";

const CartItemCard: React.FC<{ item: CartItem }> = ({ item }) => {
  const { removeFromCart, updateQuantity } = useCart();

  const unit = normalizePrice((item as any).price);
  const qty = typeof item.quantity === "number" ? item.quantity : 1;
  const total = unit * qty;

  const rawImage =
    (item as any).image ||
    (Array.isArray((item as any).images) ? (item as any).images[0] : null);
  const imageSrc = resolveImage(rawImage);

  const stock = Number((item as any)._stock);
  const hasStock = Number.isFinite(stock) && stock >= 0;
  const atMax = hasStock && stock > 0 && qty >= stock;
  const canDecrease = qty > 1;
  const canIncrease = !atMax;

  return (
    <li
      className="rounded-xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm
                 grid grid-cols-[64px_1fr] sm:grid-cols-[64px_1fr_auto] gap-3 sm:gap-4 items-start"
    >
      {/* imagem */}
      <Image
        src={imageSrc}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-md"
        width={64}
        height={64}
        sizes="64px"
      />

      {/* infos */}
      <div className="min-w-0">
        <h3 className="text-sm font-semibold line-clamp-2">{item.name}</h3>
        <p className="text-gray-500 text-xs">R$ {formatPriceBRL(unit)}</p>

        <div className="mt-2 flex items-center gap-2" aria-live="polite">
          <button
            type="button"
            onClick={() => canDecrease && updateQuantity(item.id, Math.max(1, qty - 1))}
            className={quantityButtonClasses}
            disabled={!canDecrease}
            aria-label={`Diminuir quantidade de ${item.name}`}
          >
            -
          </button>
          <span className="w-8 text-center text-sm" aria-label={`Quantidade de ${item.name}`}>
            {qty}
          </span>
          <button
            type="button"
            onClick={() => canIncrease && updateQuantity(item.id, qty + 1)}
            className={quantityButtonClasses}
            disabled={!canIncrease}
            aria-label={`Aumentar quantidade de ${item.name}`}
          >
            +
          </button>
        </div>

        {hasStock && (
          <p className="text-xs text-gray-500 mt-1">
            {stock === 0
              ? "Sem estoque"
              : atMax
              ? "Limite de estoque atingido"
              : `Em estoque: ${Math.max(0, stock - qty)}`}
          </p>
        )}
      </div>

      {/* ações / total */}
      <div className="col-span-2 sm:col-span-1 sm:pl-2 flex items-center justify-between sm:block sm:justify-end gap-2">
        <p className="text-green-600 font-bold text-sm sm:text-base sm:text-right">
          R$ {formatPriceBRL(total)}
        </p>

        <CustomButton
          label="Remover"
          onClick={() => removeFromCart(item.id)}
          variant="primary"
          isLoading={false}
          size="small"
          className="min-h-[36px] sm:mt-6 w-auto"
        />
      </div>
    </li>
  );
};

export default CartItemCard;
