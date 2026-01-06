import { ImageLike } from "./CartCarProps";

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
  shipping_free?: number | boolean;          // 1 | 0
  shipping_free_from_qty?: number | null;    // ex: 5
};

export interface ProductReview {
  nota: number;
  comentario: string | null;
  created_at: string;
}
