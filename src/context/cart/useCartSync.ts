"use client";

import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CartItem } from "@/types/CartCarProps";
import apiClient from "@/lib/apiClient";
import { handleApiError } from "@/lib/handleApiError";
import { CartGetResponseSchema } from "@/lib/schemas/api";
import { normalizeApiItems, loadFromLocalStorage } from "./cartUtils";

type Props = {
  userId: number | null;
  cartKey: string | null;
  pathname: string;
  setCartItems: Dispatch<SetStateAction<CartItem[]>>;
};

/**
 * Carrega o carrinho ao montar (ou quando cartKey muda) e expõe `refetchServerCart`.
 *
 * Regras de fonte de dados:
 * - /admin    → localStorage (nunca toca a API de carrinho)
 * - visitante → localStorage
 * - logado    → API é fonte da verdade; fallback para localStorage em caso de erro
 */
export function useCartSync({ userId, cartKey, pathname, setCartItems }: Props) {
  useEffect(() => {
    if (!cartKey || typeof window === "undefined") return;

    if (pathname.startsWith("/admin") || !userId) {
      setCartItems(loadFromLocalStorage(cartKey));
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const raw = await apiClient.get<unknown>("/api/cart");
        if (cancelled) return;

        const data = CartGetResponseSchema.safeParse(raw);
        const itemsFromApi = data.success ? (data.data.items ?? []) : [];
        const normalized = normalizeApiItems(itemsFromApi);

        setCartItems(normalized);

        try {
          localStorage.setItem(cartKey, JSON.stringify(normalized));
        } catch {
          // ignore
        }
      } catch (e: unknown) {
        if (cancelled) return;
        handleApiError(e, {
          fallbackMessage: "Erro ao sincronizar o carrinho com o servidor.",
        });
        setCartItems(loadFromLocalStorage(cartKey));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cartKey, userId, pathname, setCartItems]);

  const refetchServerCart = useCallback(async () => {
    if (!userId) return;
    try {
      const raw = await apiClient.get<unknown>("/api/cart");
      const data = CartGetResponseSchema.safeParse(raw);
      const itemsFromApi = data.success ? (data.data.items ?? []) : [];
      setCartItems(normalizeApiItems(itemsFromApi));
    } catch {
      // caller handles feedback via toast when needed
    }
  }, [userId, setCartItems]);

  return { refetchServerCart };
}
