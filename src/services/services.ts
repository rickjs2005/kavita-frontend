// src/services/services.ts
import type { Service } from "@/types/service";

const API_ROOT =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:5000");

const API_BASE = `${API_ROOT}/api`;

export interface GetServicesParams {
  q?: string;              // busca
  specialty?: string;      // será convertido para "especialidade"
  page?: number;
  limit?: number;
  sort?: "id" | "nome" | "cargo" | "especialidade";
  order?: "asc" | "desc";
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: string;
  order: "asc" | "desc";
}

export interface ServicesResponse {
  data: Service[];
  meta: ListMeta;
}

export async function getServices(
  params: GetServicesParams = {}
): Promise<ServicesResponse> {
  const {
    q,
    specialty,
    page = 1,
    limit = 12,
    sort = "id",
    order = "desc",
  } = params;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (sort) qs.set("sort", sort);
  if (order) qs.set("order", order);

  if (q) qs.set("busca", q);
  if (specialty) qs.set("especialidade", specialty);

  const url = `${API_BASE}/public/servicos?${qs.toString()}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const json = await res.json();

  // backend pode devolver array ou objeto paginado
  const payload: {
    data: Service[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    sort: string;
    order: "asc" | "desc";
  } = Array.isArray(json)
    ? {
        data: json,
        page: 1,
        limit: json.length,
        total: json.length,
        totalPages: 1,
        sort: "id",
        order: "desc",
      }
    : json;

  const normalized = (payload.data || []).map((s) => ({
    ...s,
    images: Array.isArray(s.images)
      ? s.images
      : typeof (s as any).images === "string" && (s as any).images
      ? [(s as any).images]
      : [],
  }));

  return {
    data: normalized,
    meta: {
      page: payload.page,
      limit: payload.limit,
      total: payload.total,
      totalPages: payload.totalPages,
      sort: payload.sort,
      order: payload.order,
    },
  };
}

export async function getServiceById(id: string | number) {
  if (!id && id !== 0) throw new Error("Service id is required");

  const url = `${API_BASE}/public/servicos/${id}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }

  const json = await res.json();
  return {
    ...json,
    images: Array.isArray(json.images)
      ? json.images
      : typeof json.images === "string" && json.images
      ? [json.images]
      : [],
  } as Service;
}
