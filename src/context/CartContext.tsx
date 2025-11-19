"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Product, CartItem } from "@/types/CartCarProps";
import { useAuth } from "@/context/AuthContext";

/* Helpers */
const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const knownStock = (item: Partial<CartItem>) =>
  typeof item._stock === "number" && item._stock >= 0 ? item._stock : undefined;

const clampByStock = (item: Partial<CartItem>, desired: number) => {
  const s = knownStock(item);
  if (s !== undefined) {
    if (s <= 0) return 0; // esgotado
    return Math.max(1, Math.min(s, desired));
  }
  return Math.max(1, desired);
};

type AddResult = { ok: true } | { ok: false; reason: "OUT_OF_STOCK" | "LIMIT_REACHED" };
type AfterFn = () => void;

interface CartContextProps {
  cartItems: CartItem[];
  addToCart: (product: Product, qty?: number) => AddResult;
  updateQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
  syncStock: (productId: number, newStock: number) => void;
  clearCart: () => void;
  cartTotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

// chave de storage por usuário
const makeCartKey = (userId: number | null | undefined) =>
  userId ? `cartItems_${userId}` : "cartItems_guest";

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const userId: number | null = user?.id ? Number(user.id) : null;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartKey, setCartKey] = useState<string | null>(null);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  /* Define a chave sempre que o usuário mudar */
  useEffect(() => {
    const key = makeCartKey(userId);
    setCartKey(key);
  }, [userId]);

  /* Carrega itens do storage quando a chave mudar (troca de usuário) */
  useEffect(() => {
    if (!cartKey || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(cartKey);
      setCartItems(raw ? JSON.parse(raw) : []);
    } catch {
      setCartItems([]);
    }
  }, [cartKey]);

  /* Persiste itens no storage da chave atual */
  useEffect(() => {
    if (!cartKey || typeof window === "undefined") return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    } catch {
      // ignora erros de storage
    }
  }, [cartItems, cartKey]);

  /* ========== Ações ========== */

  const addToCart = (product: Product, qty = 1): AddResult => {
    const price = toNum(product.price, 0);
    const stockFromApi =
      typeof product.quantity === "number"
        ? product.quantity
        : typeof product.estoque === "number"
        ? product.estoque
        : undefined;

    let result: AddResult = { ok: true };
    const after: AfterFn[] = [];

    setCartItems((prev) => {
      const found = prev.find((i) => i.id === product.id);

      if (found) {
        const stock = stockFromApi ?? knownStock(found);
        const desired = toNum(found.quantity, 1) + toNum(qty, 1);
        const clamped = clampByStock({ ...found, _stock: stock }, desired);

        if (clamped === 0) {
          result = { ok: false, reason: "OUT_OF_STOCK" };
          after.push(() => toast.error("Produto esgotado."));
          return prev;
        }
        if (clamped <= found.quantity) {
          result = { ok: false, reason: "LIMIT_REACHED" };
          after.push(() =>
            typeof stock === "number"
              ? toast.error(`Limite de estoque atingido (máx. ${stock}).`)
              : toast.error("Quantidade máxima atingida.")
          );
          return prev;
        }

        after.push(() => toast.success("Quantidade atualizada no carrinho."));
        return prev.map((i) =>
          i.id === product.id ? { ...found, quantity: clamped, _stock: stock } : i
        );
      }

      const stock = stockFromApi;
      const desired = toNum(qty, 1);
      const firstQty = clampByStock({ _stock: stock }, desired);

      if (firstQty === 0) {
        result = { ok: false, reason: "OUT_OF_STOCK" };
        after.push(() => toast.error("Produto esgotado."));
        return prev;
      }

      after.push(() => {
        openCart();
        toast.success("Adicionado ao carrinho!");
      });

      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price,
          image: product.image,
          quantity: firstQty,
          _stock: stock,
        },
      ];
    });

    after.forEach((fn) => fn());
    return result;
  };

  const updateQuantity = (id: number, quantity: number) => {
    const after: AfterFn[] = [];

    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.id !== id) return it;
          const clamped = clampByStock(it, toNum(quantity, 1));

          if (clamped === 0) {
            after.push(() => toast.error("Este item esgotou e foi removido do carrinho."));
            return null;
          }
          if (clamped !== quantity && clamped < quantity) {
            const s = knownStock(it);
            after.push(() =>
              toast.error(
                `Ajustamos para ${clamped}${s !== undefined ? ` (máx. ${s})` : ""} por limite de estoque.`
              )
            );
          }
          return { ...it, quantity: clamped };
        })
        .filter(Boolean) as CartItem[]
    );

    after.forEach((fn) => fn());
  };

  const removeFromCart = (id: number) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
    toast("Item removido do carrinho.");
  };

  /** Sincroniza estoque após resposta “estoque insuficiente” do backend */
  const syncStock = (productId: number, newStock: number) => {
    const after: AfterFn[] = [];

    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.id !== productId) return it;
          const stock = Math.max(0, toNum(newStock, 0));
          const clamped = clampByStock({ ...it, _stock: stock }, it.quantity);

          if (stock === 0) {
            after.push(() => toast.error("Um item esgotou e foi removido do carrinho."));
            return null;
          }
          if (clamped !== it.quantity) {
            after.push(() => toast.error(`Estoque atualizado. Ajustamos para ${clamped}.`));
          }
          return { ...it, _stock: stock, quantity: clamped };
        })
        .filter(Boolean) as CartItem[]
    );

    after.forEach((fn) => fn());
  };

  const clearCart = () => {
    setCartItems([]);
    if (cartKey && typeof window !== "undefined") {
      try {
        localStorage.removeItem(cartKey);
      } catch {
        // ignore
      }
    }
    toast("Carrinho limpo.");
  };

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, it) => sum + toNum(it.price, 0) * toNum(it.quantity, 1), 0),
    [cartItems]
  );

  const value: CartContextProps = {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    syncStock,
    clearCart,
    cartTotal,
    isCartOpen,
    openCart,
    closeCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
};
