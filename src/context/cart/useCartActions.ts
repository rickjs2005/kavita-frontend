"use client";

import toast from "react-hot-toast";
import type { Dispatch, SetStateAction } from "react";
import type { Product, CartItem } from "@/types/CartCarProps";
import apiClient from "@/lib/apiClient";
import { handleApiError } from "@/lib/handleApiError";
import { isApiError } from "@/lib/errors";
import { toNum, knownStock, clampByStock } from "./cartUtils";

export type AddResult =
  | { ok: true }
  | { ok: false; reason: "OUT_OF_STOCK" | "LIMIT_REACHED" };

type AfterFn = () => void;

type Props = {
  userId: number | null;
  cartKey: string | null;
  setCartItems: Dispatch<SetStateAction<CartItem[]>>;
  refetchServerCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
};

/** All cart mutation actions. Optimistic-updates locally, then syncs to server when logged in. */
export function useCartActions({
  userId,
  cartKey,
  setCartItems,
  refetchServerCart,
  openCart,
  closeCart,
}: Props) {
  const addToCart = (product: Product, qty = 1): AddResult => {
    const stockFromApi =
      typeof product.quantity === "number"
        ? product.quantity
        : typeof product.estoque === "number"
          ? product.estoque
          : typeof product.stock === "number"
            ? product.stock
            : undefined;

    let result: AddResult = { ok: true };
    const after: AfterFn[] = [];
    const increment = Math.max(1, toNum(qty, 1));

    setCartItems((prev) => {
      const found = prev.find((i) => i.id === product.id);

      if (found) {
        const stock = stockFromApi ?? knownStock(found);
        const desired = toNum(found.quantity, 1) + increment;
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
              : toast.error("Quantidade máxima atingida."),
          );
          return prev;
        }

        after.push(() => toast.success("Quantidade atualizada no carrinho."));
        return prev.map((i) =>
          i.id === product.id
            ? { ...found, quantity: clamped, _stock: stock }
            : i,
        );
      }

      const stock = stockFromApi;
      const firstQty = clampByStock({ _stock: stock }, increment);

      if (firstQty === 0) {
        result = { ok: false, reason: "OUT_OF_STOCK" };
        after.push(() => toast.error("Produto esgotado."));
        return prev;
      }

      after.push(() => {
        openCart();
        toast.success("Adicionado ao carrinho!");
      });

      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: toNum((product as any).price, 0),
        image: (product as any).image ?? null,
        quantity: firstQty,
        _stock: stock,
      };

      return [...prev, newItem];
    });

    if (userId) {
      apiClient
        .post("/api/cart/items", { produto_id: product.id, quantidade: increment })
        .catch((err) => {
          if (isApiError(err) && err.status === 409 && err.code === "STOCK_LIMIT") {
            toast.error("Limite de estoque atingido.");
            refetchServerCart();
            return;
          }
          handleApiError(err, {
            fallbackMessage: "Erro ao salvar item no carrinho no servidor.",
          });
          refetchServerCart();
        });
    }

    after.forEach((fn) => fn());
    return result;
  };

  const updateQuantity = (id: number, quantity: number) => {
    let finalQty: number | null = null;
    const after: AfterFn[] = [];

    setCartItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (!found) return prev;

      const desired = toNum(quantity, 1);
      const clamped = clampByStock(found, desired);
      finalQty = clamped;

      if (clamped === 0) {
        after.push(() =>
          toast.error("Produto esgotado. Removemos do carrinho."),
        );
        return prev.filter((i) => i.id !== id);
      }

      if (clamped !== desired) {
        after.push(() =>
          toast.error(`Ajustamos para ${clamped} por limite de estoque.`),
        );
      }

      return prev.map((i) => (i.id === id ? { ...i, quantity: clamped } : i));
    });

    if (userId && finalQty !== null) {
      if (finalQty <= 0) {
        apiClient
          .del(`/api/cart/items/${id}`)
          .catch((err) =>
            handleApiError(err, {
              fallbackMessage: "Erro ao remover item do carrinho no servidor.",
            }),
          );
      } else {
        apiClient
          .patch("/api/cart/items", { produto_id: id, quantidade: finalQty })
          .catch((err) => {
            if (
              isApiError(err) &&
              err.status === 409 &&
              err.code === "STOCK_LIMIT"
            ) {
              toast.error("Limite de estoque atingido.");
              refetchServerCart();
              return;
            }
            handleApiError(err, {
              fallbackMessage: "Erro ao atualizar quantidade no servidor.",
            });
          });
      }
    }

    after.forEach((fn) => fn());
  };

  const removeFromCart = (id: number) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));

    if (userId) {
      apiClient
        .del(`/api/cart/items/${id}`)
        .catch((err) =>
          handleApiError(err, {
            fallbackMessage: "Erro ao remover item do carrinho no servidor.",
          }),
        );
    }

    toast("Item removido do carrinho.");
  };

  const syncStock = (productId: number, newStock: number) => {
    const after: AfterFn[] = [];

    setCartItems(
      (prev) =>
        prev
          .map((it) => {
            if (it.id !== productId) return it;
            const stock = Math.max(0, toNum(newStock, 0));
            const clamped = clampByStock({ ...it, _stock: stock }, it.quantity);

            if (stock === 0) {
              after.push(() =>
                toast.error("Um item esgotou e foi removido do carrinho."),
              );
              return null;
            }

            if (clamped !== it.quantity) {
              after.push(() =>
                toast.error(
                  `Estoque atualizado. Ajustamos para ${clamped}.`,
                ),
              );
            }

            return { ...it, _stock: stock, quantity: clamped };
          })
          .filter(Boolean) as CartItem[],
    );

    after.forEach((fn) => fn());
  };

  const clearCart = () => {
    setCartItems([]);
    closeCart();

    if (typeof window !== "undefined" && cartKey) {
      try {
        localStorage.removeItem(cartKey);
      } catch {
        // ignore
      }
    }

    if (userId) {
      apiClient
        .del("/api/cart")
        .catch((err) =>
          handleApiError(err, {
            fallbackMessage: "Erro ao limpar o carrinho no servidor.",
          }),
        );
    }

    toast("Carrinho limpo.");
  };

  return { addToCart, updateQuantity, removeFromCart, syncStock, clearCart };
}
