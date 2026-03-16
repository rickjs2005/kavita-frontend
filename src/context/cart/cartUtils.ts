// Pure helpers — no React, no side effects, safe to import in tests.

import type { CartItem } from "@/types/CartCarProps";
import {
  CartApiItemSchema,
  safeParseSilent,
} from "@/lib/schemas/api";

export const toNum = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const knownStock = (item: Partial<CartItem>): number | undefined =>
  typeof item._stock === "number" && item._stock >= 0 ? item._stock : undefined;

export const clampByStock = (item: Partial<CartItem>, desired: number): number => {
  const s = knownStock(item);
  if (s !== undefined) {
    if (s <= 0) return 0;
    return Math.max(1, Math.min(s, desired));
  }
  return Math.max(1, desired);
};

export const makeCartKey = (userId: number | null | undefined): string =>
  userId ? `cartItems_${userId}` : "cartItems_guest";

export function loadFromLocalStorage(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

/**
 * Normaliza itens vindos da API para CartItem.
 * Valida cada item via CartApiItemSchema (Zod).
 * Itens com shape inválido são descartados silenciosamente.
 */
export function normalizeApiItems(rawItems: unknown[]): CartItem[] {
  const result: CartItem[] = [];

  for (const raw of rawItems) {
    const parsed = safeParseSilent(CartApiItemSchema, raw);

    if (!parsed) {
      console.warn("[CartContext] Item ignorado: schema inválido", raw);
      continue;
    }

    result.push({
      id: parsed.produto_id,
      name: parsed.nome ?? `Produto #${parsed.produto_id}`,
      price: parsed.valor_unitario,
      image: parsed.image ?? null,
      quantity: Math.max(1, parsed.quantidade),
      _stock: parsed.stock,
    });
  }

  return result;
}
