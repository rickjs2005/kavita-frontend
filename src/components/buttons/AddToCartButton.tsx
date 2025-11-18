"use client";

import { Product } from "@/types/product";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { resolveStockValue } from "../../utils/stock";

interface AddToCartButtonProps {
  product: Product;
  qty?: number;            // 👈 NOVO: quantidade
  className?: string;
  disabled?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  product,
  qty = 1,
  className,
  disabled,
}) => {
  const { addToCart, openCart } = useCart();
  const [loading, setLoading] = useState(false);

  const stock = resolveStockValue(
    (product as any).quantity,
    (product as any).estoque,
    (product as any).stock
  );
  const hasStockFlag = typeof stock === "number";
  const isOut = hasStockFlag ? stock <= 0 : false;

  const handleAddToCart = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (loading || disabled || isOut) return;
    setLoading(true);
    try {
      const res = addToCart(product, qty); // 👈 passa a QTD escolhida
      // Abra o carrinho SEMPRE que clicar (mesmo se já existia e só atualizou)
      if (res.ok) openCart();
      // Em caso de LIMIT_REACHED/OUT_OF_STOCK, o contexto já faz toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={loading || disabled || isOut}
      className={`w-full py-3 rounded-xl text-white font-semibold transition ${
        isOut
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-green-600 hover:bg-green-700 active:bg-green-800"
      } disabled:opacity-60 ${className ?? ""}`}
      aria-busy={loading}
      title={isOut ? "Esgotado" : "Adicionar ao Carrinho"}
      aria-disabled={loading || disabled || isOut || undefined}
    >
      {loading ? "Adicionando..." : isOut ? "Esgotado" : "Adicionar ao Carrinho"}
    </button>
  );
};

export default AddToCartButton;
