"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import CartItemCard from "./CartItemCard";
import CustomButton from "../buttons/CustomButton";
import CloseButton from "../buttons/CloseButton";
import toast from "react-hot-toast";

const CartCar: React.FC<{ isCartOpen: boolean; closeCart: () => void }> = ({
  isCartOpen,
  closeCart,
}) => {
  const { cartItems, cartTotal } = useCart();
  const auth = useAuth() as any;
  const [coupon, setCoupon] = useState("");
  const [logged, setLogged] = useState<boolean>(false);
  const router = useRouter();

  const isEmpty = cartItems.length === 0;

  useEffect(() => {
    const localUid =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;

    const authenticated =
      Boolean(auth?.isAuthenticated) ||
      Boolean(auth?.userId) ||
      Boolean(auth?.user?.id) ||
      Boolean(localUid);

    setLogged(authenticated);
  }, [auth?.isAuthenticated, auth?.userId, auth?.user]);

  const warnings = useMemo(() => {
    return cartItems
      .filter((i: any) => typeof i._stock === "number" && i._stock > 0 && i.quantity >= i._stock)
      .map((i) => `“${i.name}” atingiu o limite de estoque (${i._stock}).`);
  }, [cartItems]);

  const applyDiscount = (code: string) => {
    if (!code.trim()) {
      toast("Informe um cupom.");
      return;
    }
    toast.success(`Cupom "${code}" aplicado (simulação).`);
  };

  const handleCheckout = () => {
    if (isEmpty) {
      toast.error("Seu carrinho está vazio!");
      return;
    }
    if (!logged) {
      toast("Faça login para continuar.");
      router.push("/login");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 left-0 sm:left-auto bg-white shadow-xl z-[70] flex flex-col
                  transition-transform duration-300
                  w-full sm:w-[90vw] md:w-[26rem] lg:w-[28rem]
                  ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
      role="dialog"
      aria-label="Carrinho de compras"
      aria-hidden={!isCartOpen}
    >
      {/* Header sticky */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-4 sm:px-5 py-3">
        <div className="relative flex items-center justify-center">
          <h2 className="text-base sm:text-lg font-semibold">Carrinho de compras</h2>
          <CloseButton onClose={closeCart} className="absolute right-0 top-1/2 -translate-y-1/2" />
        </div>
      </header>

      {/* Lista rolável */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 space-y-3">
        {isEmpty ? (
          <p className="text-sm sm:text-base text-gray-500 text-center py-10">
            🛒 Seu carrinho está vazio!
          </p>
        ) : (
          <ul className="space-y-3">{cartItems.map((item) => <CartItemCard key={item.id} item={item} />)}</ul>
        )}
      </div>

      {/* Footer sticky */}
      {!isEmpty && (
        <footer className="sticky bottom-0 z-10 border-t bg-white px-4 sm:px-5 py-3">
          {warnings.length > 0 && (
            <div className="mb-2 text-xs text-orange-600 space-y-1">
              {warnings.map((w, idx) => <p key={idx}>⚠️ {w}</p>)}
            </div>
          )}

          <div className="flex items-center justify-between font-semibold">
            <span>Total:</span>
            <span className="text-lg font-extrabold text-green-600">
              R$ {cartTotal.toFixed(2)}
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Cupom de desconto"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 min-h-[44px] text-sm
                         focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20 outline-none"
            />
            <CustomButton
              label="Aplicar"
              onClick={() => applyDiscount(coupon)}
              variant="primary"
              isLoading={false}
              size="medium"
              className="min-w-[96px] min-h-[44px]"
            />
          </div>

          <CustomButton
            label="Finalizar Compra"
            onClick={handleCheckout}
            variant="primary"
            className="mt-3 w-full min-h-[48px]"
            isLoading={false}
            size="medium"
          />
        </footer>
      )}
    </div>
  );
};

export default CartCar;
