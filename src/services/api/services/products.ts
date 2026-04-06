// src/services/api/services/products.ts
// Re-exports from the canonical product service for backwards compatibility.
// New code should import directly from "@/services/products".

export {
  normalizeProduct,
  getProducts,
  getProductById,
  getProductPromotion,
  getFavorites,
} from "@/services/products";

export type { GetProductsParams } from "@/services/products";
export type { Product, ProductPromotion } from "@/types/product";

export interface ProductsPage {
  data: import("@/types/product").Product[];
  total?: number;
  page?: number;
  limit?: number;
}
