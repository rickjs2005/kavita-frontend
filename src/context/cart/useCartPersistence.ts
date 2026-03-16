"use client";

import { useEffect, useRef } from "react";
import type { CartItem } from "@/types/CartCarProps";

/**
 * Persiste cartItems no localStorage quando mudam.
 * Ignora a primeira execução após troca de chave para evitar
 * gravar o estado antigo na chave nova (ex: ao fazer logout).
 */
export function useCartPersistence(
  cartItems: CartItem[],
  cartKey: string | null,
) {
  const lastCartKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!cartKey || typeof window === "undefined") return;

    if (lastCartKeyRef.current !== cartKey) {
      lastCartKeyRef.current = cartKey;
      return; // chave acabou de mudar — não persiste ainda
    }

    try {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    } catch {
      // ignore quota errors silently
    }
  }, [cartItems, cartKey]);
}
