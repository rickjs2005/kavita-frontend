"use client";

import { useMemo } from "react";
import type { CartItem } from "@/types/CartCarProps";
import { toNum } from "./cartUtils";

/** Derived values computed from cartItems. */
export function useCartCalculations(cartItems: CartItem[]) {
  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, it) => sum + toNum(it.price, 0) * toNum(it.quantity, 1),
        0,
      ),
    [cartItems],
  );

  return { cartTotal };
}
