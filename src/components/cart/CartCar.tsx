"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import CartItemCard from "./CartItemCard";
import CustomButton from "../buttons/CustomButton";
import CloseButton from "../buttons/CloseButton";
import toast from "react-hot-toast";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface CouponPreviewResponse {
  success: boolean;
  message?: string;
  desconto?: number;
  total_original?: number;
  total_com_desconto?: number;
  cupom?: {
    id: number;
    codigo: string;
    tipo: string;
    valor: number;
  };
}

const CartCar: React.FC<{ isCartOpen: boolean; closeCart: () => void }> = ({
  isCartOpen,
  closeCart,
}) => {
  const { cartItems, cartTotal } = useCart();
  const auth = useAuth() as any;
  const router = useRouter();

  const [logged, setLogged] = useState(false);

  // CUPOM
  const [coupon, setCoupon] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

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

  // se carrinho mudar, zera cupom
  useEffect(() => {
    setDiscount(0);
    setCouponMessage(null);
    setCouponError(null);
  }, [cartTotal, cartItems]);

  const warnings = useMemo(() => {
    return (cartItems as any[])
      .filter(
        (i) =>
          typeof i._stock === "number" && i._stock > 0 && i.quantity >= i._stock
      )
      .map((i) => `“${i.name}” atingiu o limite de estoque (${i._stock}).`);
  }, [cartItems]);

  const subtotal = useMemo(() => cartTotal, [cartTotal]);
  const total = useMemo(
    () => Math.max(subtotal - discount, 0),
    [subtotal, discount]
  );

  const applyDiscount = async () => {
    const code = coupon.trim().toUpperCase();

    if (!code) {
      toast.error("Informe um cupom.");
      return;
    }

    if (!logged) {
      toast.error("Você precisa estar logado para aplicar um cupom.");
      router.push("/login");
      return;
    }

    if (!subtotal || subtotal <= 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    try {
      setCouponLoading(true);
      setCouponError(null);
      setCouponMessage(null);

      const token = auth?.user?.token ?? null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const { data } = await axios.post<CouponPreviewResponse>(
        `${API_BASE}/api/checkout/preview-cupom`,
        {
          codigo: code,
          total: subtotal,
        },
        { headers }
      );

      if (!data?.success) {
        const msg =
          data?.message || "Não foi possível aplicar este cupom.";
        setDiscount(0);
        setCouponError(msg);
        toast.error(msg);
        return;
      }

      const desconto = Number(data.desconto || 0);
      setDiscount(desconto > 0 ? desconto : 0);

      const msg = data.message || "Cupom aplicado com sucesso!";
      setCouponMessage(msg);
      setCouponError(null);
      toast.success(msg);

      if (typeof window !== "undefined") {
        localStorage.setItem("kavita_current_coupon", code);
      }
    } catch (err: any) {
      const msgBackend = err?.response?.data?.message;
      const msg = msgBackend || "Não foi possível aplicar este cupom.";
      setDiscount(0);
      setCouponError(msg);
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
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
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b px-4 sm:px-5 py-3">
        <div className="relative flex items-center justify-center">
          <h2 className="text-base sm:text-lg font-semibold">
            Carrinho de compras
          </h2>
          <CloseButton
            onClose={closeCart}
            className="absolute right-0 top-1/2 -translate-y-1/2"
          />
        </div>
      </header>

      {/* Lista de itens */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 space-y-3">
        {isEmpty ? (
          <p className="text-sm sm:text-base text-gray-500 text-center py-10">
            🛒 Seu carrinho está vazio!
          </p>
        ) : (
          <ul className="space-y-3">
            {cartItems.map((item) => (
              <CartItemCard key={item.id} item={item} />
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      {!isEmpty && (
        <footer className="sticky bottom-0 z-10 border-t bg-white px-4 sm:px-5 py-3">
          {warnings.length > 0 && (
            <div className="mb-2 text-xs text-orange-600 space-y-1">
              {warnings.map((w, idx) => (
                <p key={idx}>⚠️ {w}</p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between font-semibold">
            <span>Total:</span>
            <span className="text-lg font-extrabold text-green-600">
              R$ {total.toFixed(2)}
            </span>
          </div>

          {discount > 0 && (
            <p className="mt-1 text-xs text-emerald-700">
              Desconto aplicado: - R$ {discount.toFixed(2)}
            </p>
          )}

          {couponMessage && (
            <p className="mt-1 text-xs text-emerald-600">{couponMessage}</p>
          )}
          {couponError && (
            <p className="mt-1 text-xs text-red-600">{couponError}</p>
          )}

          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={(e) => {
                setCoupon(e.target.value.toUpperCase());
                setCouponMessage(null);
                setCouponError(null);
              }}
              placeholder="Cupom de desconto"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 min-h-[44px] text-sm
                         focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20 outline-none"
            />
            <CustomButton
              label={couponLoading ? "Aplicando..." : "Aplicar"}
              onClick={applyDiscount}
              variant="primary"
              isLoading={couponLoading}
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
