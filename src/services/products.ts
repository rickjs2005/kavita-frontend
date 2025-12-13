// src/services/products.ts
import { apiFetch } from "@/lib/apiClient";

// Normaliza o slug da categoria (mantém a mesma lógica: trim + lowercase)
function normalizeCategory(category?: string): string | undefined {
  if (!category) return undefined;
  return String(category).trim().toLowerCase();
}

export interface GetProductsParams {
  q?: string; // busca
  category?: string; // categoria (slug)
  subcategory?: string; // subcategoria (slug)
  page?: number;
  limit?: number;
  sort?: string; // mantém flexível pra não quebrar seu backend se aceitar outros campos
  order?: "asc" | "desc";
}

/**
 * Lista produtos com paginação/filtros.
 * Mantém a mesma ideia: criar URLSearchParams e chamar GET /api/products
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

  // apiFetch já padroniza erro (ApiError) e mantém cookies (credentials: include)
  return apiFetch(path, { cache: "no-store" });
}

// Um único produto (mantém a validação do id)
export async function getProductById(id: string | number) {
  if (!id && id !== 0) throw new Error("Product id is required");
  return apiFetch(`/api/products/${id}`, { cache: "no-store" });
}
