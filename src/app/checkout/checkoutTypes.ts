// Shared types for the checkout flow.
// Imported by useCheckoutState and section components.

import type { SavedAddress } from "@/types/address";
import type { ProductPromotion } from "@/types/product";
export type { SavedAddress, ProductPromotion };

/** Cart item format accepted by the checkout API payload (differs from CartContext's CartItem). */
export interface CheckoutCartItem {
  id?: number | string;
  productId?: number | string;
  product_id?: number | string;

  name?: string;
  nome?: string;

  price?: number | string;

  quantity?: number | string;
  quantidade?: number | string;
  qtd?: number | string;
}

export type ShippingRuleApplied = "ZONE" | "CEP_RANGE" | "PRODUCT_FREE";

export type ShippingQuote = {
  price: number;
  prazo_dias: number;
  cep: string;
  ruleApplied?: ShippingRuleApplied;
};


export type EntregaTipo = "ENTREGA" | "RETIRADA";

/** Normalized cart item used internally by checkout (after resolution of field aliases). */
export type NormalizedCheckoutItem = {
  __key: string;
  id: number | null;
  name: string;
  price: number;
  quantity: number;
};
