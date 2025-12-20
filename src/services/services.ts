// src/services/services.ts
import type { Service } from "@/types/service";
import { apiFetch } from "@/lib/apiClient";

export interface GetServicesParams {
  q?: string;
  specialty?: string; // será convertido para "especialidade"
  page?: number;
  limit?: number;
  sort?: "id" | "nome" | "cargo" | "especialidade";
  order?: "asc" | "desc";
}

function normText(v?: string) {
  const s = (v ?? "").trim();
  return s ? s.toLowerCase() : "";
}

/**
 * Lista serviços com paginação/filtros (contrato com backend).
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

  const qNorm = (q ?? "").trim();
  if (qNorm) qs.set("q", qNorm);

  // specialty -> especialidade (normalizado)
  const esp = normText(specialty);
  if (esp) qs.set("especialidade", esp);

  const query = qs.toString();
  const path = query ? `/api/servicos?${query}` : `/api/servicos`;

  try {
    return await apiFetch(path, { cache: "no-store" });
  } catch {
    // erro limpo (não vaza stack/erro bruto)
    throw new Error("Failed to fetch services");
  }
}

/**
 * Um serviço por ID.
 * Normaliza images para array.
 */
export async function getServiceById(id: string | number): Promise<Service> {
  if (!id && id !== 0) throw new Error("Service id is required");

  try {
    const json: any = await apiFetch(`/api/servicos/${id}`, { cache: "no-store" });

    return {
      ...json,
      images: Array.isArray(json.images)
        ? json.images
        : typeof json.images === "string" && json.images
        ? [json.images]
        : [],
    } as Service;
  } catch {
    // erro limpo
    throw new Error("Failed to fetch service");
  }
}
