"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import type { Product, CartItem } from "@/types/CartCarProps";
import { useAuth } from "@/context/AuthContext";
import { makeCartKey } from "./cart/cartUtils";
import { useCartPersistence } from "./cart/useCartPersistence";
import { useCartSync } from "./cart/useCartSync";
import { useCartCalculations } from "./cart/useCartCalculations";
import { useCartActions, type AddResult } from "./cart/useCartActions";

interface CartContextProps {
  cartItems: CartItem[];
  addToCart: (product: Product, qty?: number) => AddResult;
  updateQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
  syncStock: (productId: number, newStock: number) => void;
  clearCart: (opts?: { silent?: boolean }) => void;
  cartTotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const pathname = usePathname();

  const userId: number | null = user?.id ? Number(user.id) : null;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartKey, setCartKey] = useState<string | null>(null);

  const lastUserIdRef = useRef<number | null>(userId);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Reset state immediately on user change (login / logout / switch)
  useEffect(() => {
    if (lastUserIdRef.current !== userId) {
      lastUserIdRef.current = userId;
      setCartItems([]);
      setIsCartOpen(false);
    }
  }, [userId]);

  // Derive storage key from userId
  useEffect(() => {
    setCartKey(makeCartKey(userId));
  }, [userId]);

  // Auto-close when cart empties
  useEffect(() => {
    if (isCartOpen && cartItems.length === 0) setIsCartOpen(false);
  }, [isCartOpen, cartItems.length]);

  // Sub-hooks
  useCartPersistence(cartItems, cartKey);
  const { refetchServerCart } = useCartSync({ userId, cartKey, pathname, setCartItems });
  const { cartTotal } = useCartCalculations(cartItems);
  const { addToCart, updateQuantity, removeFromCart, syncStock, clearCart } =
    useCartActions({ userId, cartKey, setCartItems, refetchServerCart, openCart, closeCart });

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
