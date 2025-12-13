// src/services/services.ts
import type { Service } from "@/types/service";
import { apiFetch } from "@/lib/apiClient";

export interface GetServicesParams {
  q?: string; // busca
  specialty?: string; // será convertido para "especialidade"
  page?: number;
  limit?: number;
  sort?: "id" | "nome" | "cargo" | "especialidade";
  order?: "asc" | "desc";
}

/**
 * Lista serviços com paginação/filtros.
 * Mantém a lógica: params -> querystring e chama GET /api/servicos
 */
export async function getServices(params: GetServicesParams = {}) {
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
  qs.set("sort", String(sort));
  qs.set("order", String(order));

  if (q) qs.set("q", String(q));

  // mantém a conversão de specialty -> especialidade
  if (specialty) qs.set("especialidade", String(specialty));

  const query = qs.toString();
  const path = query ? `/api/servicos?${query}` : `/api/servicos`;

  return apiFetch(path, { cache: "no-store" });
}

/**
 * Um serviço por ID.
 * Mantém a mesma ideia e mantém a normalização de images exatamente como você fazia.
 */
export async function getServiceById(id: string | number): Promise<Service> {
  if (!id && id !== 0) throw new Error("Service id is required");

  const json: any = await apiFetch(`/api/servicos/${id}`, { cache: "no-store" });

  return {
    ...json,
    images: Array.isArray(json.images)
      ? json.images
      : typeof json.images === "string" && json.images
      ? [json.images]
      : [],
  } as Service;
}
