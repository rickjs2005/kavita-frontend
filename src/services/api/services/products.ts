// src/services/api/services/products.ts
// Type-safe service functions for product operations.

import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "../endpoints";
import type { Product } from "@/types/product";

export interface GetProductsParams {
  q?: string;
  category?: string;
  subcategory?: string;
  page?: number;
  limit?: number;
  sort?: "id" | "nome" | "price";
  order?: "asc" | "desc";
}

export interface ProductPromotion {
  id: number;
  product_id?: number;
  title?: string | null;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  promo_price?: number | string | null;
  ends_at?: string | null;
}

export interface ProductsPage {
  data: Product[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * List products with optional filters and pagination.
 */
export async function getProducts(params: GetProductsParams = {}): Promise<ProductsPage | Product[]> {
  const { q, category, subcategory, page = 1, limit = 12, sort = "id", order = "desc" } = params;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  qs.set("sort", sort);
  qs.set("order", order);

  if (q?.trim()) qs.set("q", q.trim());
  if (category?.trim()) qs.set("category", category.trim());
  if (subcategory?.trim()) qs.set("subcategory", subcategory.trim());

  return apiClient.get(`${ENDPOINTS.PRODUCTS.LIST}?${qs.toString()}`);
}

/**
 * Get a single product by ID.
 */
export async function getProductById(id: number | string): Promise<Product> {
  return apiClient.get<Product>(ENDPOINTS.PRODUCTS.DETAIL(id));
}

/**
 * Get the active promotion for a product, if any.
 * Returns null if no promotion exists (404).
 */
export async function getProductPromotion(id: number | string): Promise<ProductPromotion | null> {
  try {
    return await apiClient.get<ProductPromotion>(ENDPOINTS.PRODUCTS.PROMOTIONS(id));
  } catch {
    return null;
  }
}

type FavoritesApiResponse = Product[] | { data: Product[] };

/**
 * Get the list of favorites for the authenticated user.
 */
export async function getFavorites(): Promise<Product[]> {
  const json = await apiClient.get<FavoritesApiResponse>(ENDPOINTS.FAVORITES.LIST);
  return Array.isArray(json) ? json : (json.data ?? []);
}
