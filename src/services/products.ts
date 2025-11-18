// src/services/products.ts

// Normaliza o slug da categoria
function normalizeCategory(category?: string): string | undefined {
  if (!category) return undefined;
  return String(category).trim().toLowerCase();
}

// Base da API (usa NEXT_PUBLIC_API_URL)
const API_ROOT =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:5000");

const API_BASE = `${API_ROOT}/api`;

export interface GetProductsParams {
  category?: string;          // slug da categoria
  subcategory?: string;       // third_category
  search?: string;
  page?: number;
  limit?: number;
  sort?: "id" | "name" | "price" | "quantity";
  order?: "asc" | "desc";
}

// Lista de produtos
export async function getProducts(params: GetProductsParams = {}) {
  const {
    category,
    subcategory,
    search,
    page = 1,
    limit = 12,
    sort = "id",
    order = "desc",
  } = params;

  const url = new URL(`${API_BASE}/products`);

  const categorySlug = normalizeCategory(category);
  if (categorySlug) url.searchParams.set("category", categorySlug);
  if (subcategory) url.searchParams.set("third_category", subcategory);
  if (search) url.searchParams.set("search", search);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", sort);
  url.searchParams.set("order", order);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const payload = await res.json();
  // Suporta array simples ou { data: [...] }
  return Array.isArray(payload) ? payload : (payload?.data ?? []);
}

// Um único produto
export async function getProductById(id: string | number) {
  if (!id && id !== 0) throw new Error("Product id is required");

  const url = `${API_BASE}/products/${id}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}
