// src/services/services.ts
import type { NormalizedService } from "@/types/service";
import { apiRequest } from "@/lib/apiClient";

// ---------------------------------------------------------------------------
// Adapter: backend raw → NormalizedService
// ---------------------------------------------------------------------------

/**
 * Converte um objeto raw do backend em `NormalizedService` com tipos limpos.
 * Nenhum componente precisa checar se `verificado` é `0|1` ou `false|true`,
 * se `especialidade_id` pode ser string, ou se `images` é null.
 */
export function normalizeService(raw: any): NormalizedService {
  // images: string, array, ou null → sempre string[]
  let images: string[];
  if (Array.isArray(raw?.images)) {
    images = raw.images.filter((x: any) => typeof x === "string");
  } else if (typeof raw?.images === "string" && raw.images) {
    images = [raw.images];
  } else {
    images = [];
  }

  // verificado: 0|1 ou false|true → sempre boolean
  const verificado = raw?.verificado === true || raw?.verificado === 1;

  // especialidade_id: string ou number → sempre number | null
  const rawEspId = raw?.especialidade_id;
  const especialidade_id =
    rawEspId != null && rawEspId !== ""
      ? Number(rawEspId) || null
      : null;

  return {
    id: Number(raw?.id),
    nome: String(raw?.nome ?? ""),
    descricao: String(raw?.descricao ?? ""),
    cargo: raw?.cargo != null ? String(raw.cargo) : null,
    imagem: raw?.imagem != null ? String(raw.imagem) : null,
    images,
    whatsapp: raw?.whatsapp != null ? String(raw.whatsapp) : null,
    especialidade_nome:
      raw?.especialidade_nome != null ? String(raw.especialidade_nome) : null,
    especialidade_id,
    verificado,
  };
}

function normText(v?: string) {
  const s = (v ?? "").trim();
  return s ? s.toLowerCase() : "";
}

export interface GetServicesParams {
  q?: string;
  specialty?: string;
  page?: number;
  limit?: number;
  sort?: "id" | "nome" | "cargo" | "especialidade";
  order?: "asc" | "desc";
}

/**
 * Lista serviços com paginação/filtros.
 * Retorna `{ items: NormalizedService[]; ... }` — os serviços já normalizados.
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

  const esp = normText(specialty);
  if (esp) qs.set("especialidade", esp);

  const query = qs.toString();
  const path = query ? `/api/servicos?${query}` : `/api/servicos`;

  try {
    const res: any = await apiRequest(path, { cache: "no-store" });

    // Normaliza lista independente do shape (array direto ou { items: [...] })
    if (Array.isArray(res)) return res.map(normalizeService);
    if (Array.isArray(res?.items)) {
      return { ...res, items: res.items.map(normalizeService) };
    }
    return res;
  } catch {
    throw new Error("Failed to fetch services");
  }
}

/** Um serviço por ID, normalizado. */
export async function getServiceById(id: string | number): Promise<NormalizedService> {
  if (!id && id !== 0) throw new Error("Service id is required");

  try {
    const raw: any = await apiRequest(`/api/servicos/${id}`, { cache: "no-store" });
    return normalizeService(raw);
  } catch {
    throw new Error("Failed to fetch service");
  }
}
