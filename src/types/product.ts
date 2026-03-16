import { ImageLike } from "./CartCarProps";

// Tipo raw do backend (pode conter inconsistências — use NormalizedProduct nos componentes)
export type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  image: string;
  images?: ImageLike[] | null;
  quantity?: number | null;
  estoque?: number | null;
  category_id?: string | null;
  third_category?: string | null;
  destaque?: "mais_vendido" | "super_oferta" | "promocao" | null;
  rating_avg?: number | null;
  rating_count?: number | null;
  shipping_free?: number | boolean; // 1 | 0
  shipping_free_from_qty?: number | null; // ex: 5
};

/**
 * Produto normalizado: todas as inconsistências do backend já resolvidas.
 * Use este tipo nos componentes — não há union types ambíguos, não há casting necessário.
 *
 * Produzido por `normalizeProduct()` em `src/services/products.ts`.
 */
export type NormalizedProduct = {
  id: number;
  name: string;
  description: string;
  price: number;             // sempre number (era string | number)
  image: string;
  images: ImageLike[];       // sempre array (nunca null)
  quantity: number;          // unificado de quantity | estoque (era número ou null)
  category_id: string | null;
  third_category: string | null;
  destaque: "mais_vendido" | "super_oferta" | "promocao" | null;
  rating_avg: number | null;
  rating_count: number | null;
  shipping_free: boolean;    // sempre boolean (era number | boolean)
  shipping_free_from_qty: number | null;
};

export interface ProductReview {
  nota: number;
  comentario: string | null;
  created_at: string;
}
