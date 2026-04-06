// src/services/products.ts
// Canonical product service — single source of truth for product data access.
import { apiRequest, apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Product, NormalizedProduct, ProductPromotion } from "@/types/product";

// ---------------------------------------------------------------------------
// Adapter: backend raw → NormalizedProduct
// Isola todas as inconsistências do backend nesta função.
// ---------------------------------------------------------------------------

/**
 * Converte um objeto raw do backend em `NormalizedProduct` com tipos limpos.
 * Nenhum componente precisa saber que `price` pode vir como string,
 * que o estoque pode se chamar `estoque` ou `quantity`, ou que
 * `shipping_free` pode ser `0 | 1` em vez de `boolean`.
 */
export function normalizeProduct(raw: any): NormalizedProduct {
  // price: backend pode enviar string ("29.90") ou number
  const price = Number(raw?.price ?? 0) || 0;

  // stock: unifica quantity e estoque (backends divergem)
  const quantity =
    typeof raw?.quantity === "number"
      ? raw.quantity
      : typeof raw?.estoque === "number"
        ? raw.estoque
        : Number(raw?.quantity ?? raw?.estoque ?? 0) || 0;

  // shipping_free: 0/1 ou false/true
  const shipping_free = raw?.shipping_free === true || raw?.shipping_free === 1;

  // images: garante que é sempre array
  const images = Array.isArray(raw?.images) ? raw.images : [];

  return {
    id: Number(raw?.id),
    name: String(raw?.name ?? ""),
    description: String(raw?.description ?? ""),
    price,
    image: String(raw?.image ?? ""),
    images,
    quantity,
    category_id: raw?.category_id != null ? String(raw.category_id) : null,
    third_category: raw?.third_category != null ? String(raw.third_category) : null,
    destaque: raw?.destaque ?? null,
    rating_avg: raw?.rating_avg != null ? Number(raw.rating_avg) : null,
    rating_count: raw?.rating_count != null ? Number(raw.rating_count) : null,
    shipping_free,
    shipping_free_from_qty:
      raw?.shipping_free_from_qty != null
        ? Number(raw.shipping_free_from_qty)
        : null,
  };
}

// ---------------------------------------------------------------------------
// Normaliza o slug da categoria (trim + lowercase)
// ---------------------------------------------------------------------------
function normalizeCategory(category?: string): string | undefined {
  if (!category) return undefined;
  return String(category).trim().toLowerCase();
}

export interface GetProductsParams {
  q?: string;
  category?: string;
  subcategory?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

/**
 * Lista produtos com paginação/filtros.
 * Retorna `{ items: NormalizedProduct[]; ... }` — os produtos já normalizados.
 */
export async function getProducts(params: GetProductsParams = {}) {
  const {
    q,
    category,
    subcategory,
    page = 1,
    limit = 12,
    sort = "id",
    order = "desc",
  } = params;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  qs.set("sort", String(sort));
  qs.set("order", String(order));

  if (q) qs.set("q", String(q));

  const cat = normalizeCategory(category);
  if (cat) qs.set("category", cat);

  const sub = normalizeCategory(subcategory);
  if (sub) qs.set("subcategory", sub);

  const query = qs.toString();
  const path = query ? `/api/products?${query}` : `/api/products`;

  const res: any = await apiRequest(path, { cache: "no-store" });

  // Normaliza lista independente do shape (array direto ou { items: [...] })
  if (Array.isArray(res)) return res.map(normalizeProduct);
  if (Array.isArray(res?.items)) {
    return { ...res, items: res.items.map(normalizeProduct) };
  }
  return res;
}

/** Um único produto normalizado. */
export async function getProductById(id: string | number): Promise<NormalizedProduct> {
  if (!id && id !== 0) throw new Error("Product id is required");
  const raw = await apiRequest(`/api/products/${id}`, { cache: "no-store" });
  return normalizeProduct(raw);
}

/**
 * Get the active promotion for a product, if any.
 * Returns null if no promotion exists (404).
 */
export async function getProductPromotion(
  id: number | string,
): Promise<ProductPromotion | null> {
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
