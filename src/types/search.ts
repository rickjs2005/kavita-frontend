// src/types/search.ts

export type Category = {
  id: number;
  name: string;
  slug?: string;
  total_products?: number;
};

export type ApiProduct = {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  sold_count?: number | null;
  created_at?: string | null;
  category_name?: string | null;
  promo_id?: number | null;
  promo_name?: string | null;
  images?: string[];
  image?: string | null;
  rating_avg?: number | string | null;
  rating_count?: number | string | null;
  price?: number | string | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ProductsResponse = {
  products: ApiProduct[];
  pagination: PaginationMeta;
};
