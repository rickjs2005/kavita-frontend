// src/server/data/corretoras.ts
//
// Server-only fetchers for public corretoras pages (RSC).
// Uses native fetch() with next.revalidate for predictable ISR caching.
// Do NOT import this in client components.
import "server-only";

import type { PublicCorretora } from "@/types/corretora";

const API_BASE =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const REVALIDATE_SECONDS = 120;

function buildUrl(path: string): string {
  return `${String(API_BASE).replace(/\/$/, "")}${path}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();

  if (json && typeof json === "object" && json.ok === true && "data" in json) {
    return json.data as T;
  }

  return json as T;
}

type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/**
 * Fetch active corretoras for the public listing page.
 */
export async function fetchPublicCorretoras(params?: {
  city?: string;
  featured?: string;
  search?: string;
  // Fase 5 — filtros profundos
  tipo_cafe?: string;
  perfil_compra?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<PublicCorretora>> {
  const qs = new URLSearchParams();
  if (params?.city) qs.set("city", params.city);
  if (params?.featured) qs.set("featured", params.featured);
  if (params?.search) qs.set("search", params.search);
  if (params?.tipo_cafe) qs.set("tipo_cafe", params.tipo_cafe);
  if (params?.perfil_compra) qs.set("perfil_compra", params.perfil_compra);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));

  const qStr = qs.toString();
  const url = buildUrl(`/api/public/corretoras${qStr ? `?${qStr}` : ""}`);

  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();

  return {
    items: json.data ?? [],
    total: json.meta?.total ?? 0,
    page: json.meta?.page ?? 1,
    limit: json.meta?.limit ?? 20,
    totalPages: json.meta?.pages ?? 1,
  };
}

/**
 * Fetch featured corretoras only (for the hub page).
 */
export async function fetchFeaturedCorretoras(
  limit = 4,
): Promise<PublicCorretora[]> {
  try {
    const result = await fetchPublicCorretoras({ featured: "1", limit });
    return result.items;
  } catch {
    return [];
  }
}

/**
 * Resultado do lookup por slug: match encontrado, redirect permanente
 * para outro slug (renomeação registrada em corretora_slug_history),
 * ou não encontrado.
 */
export type CorretoraSlugLookup =
  | { kind: "found"; corretora: PublicCorretora }
  | { kind: "redirect"; toSlug: string }
  | { kind: "not_found" };

/**
 * Fetch a single corretora by slug.
 * Retorna discriminated union para o caller tratar rename (301).
 */
export async function fetchPublicCorretoraBySlug(
  slug: string,
): Promise<CorretoraSlugLookup> {
  const url = buildUrl(`/api/public/corretoras/${encodeURIComponent(slug)}`);

  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return { kind: "not_found" };

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const payload =
    json && typeof json === "object" && json.ok === true && "data" in json
      ? json.data
      : json;

  if (
    payload &&
    typeof payload === "object" &&
    "redirect_to_slug" in payload &&
    typeof (payload as { redirect_to_slug: unknown }).redirect_to_slug ===
      "string"
  ) {
    return {
      kind: "redirect",
      toSlug: (payload as { redirect_to_slug: string }).redirect_to_slug,
    };
  }

  if (payload && typeof payload === "object" && "id" in payload) {
    return { kind: "found", corretora: payload as PublicCorretora };
  }

  return { kind: "not_found" };
}

/**
 * ETAPA 3.1 — cotação spot do arábica. Retorna null quando não há
 * provider configurado ou a fonte falhou. Ficha pública esconde o
 * ticker nesses casos (nunca inventa preço).
 */
export type ArabicaSpot = {
  price_cents: number;
  variation_pct: number | null;
  as_of: string | null;
  source: string;
  source_url: string | null;
};

export async function fetchArabicaSpot(): Promise<ArabicaSpot | null> {
  try {
    return await fetchJson<ArabicaSpot | null>(
      buildUrl("/api/public/cotacoes-cafe/arabica"),
    );
  } catch {
    return null;
  }
}

/**
 * Fase 8 — agregado anonimizado de lotes fechados (prova social).
 * Nunca expõe produtor/preço individualmente. Falha silenciosamente:
 * ficha pública segue renderizando mesmo se o endpoint der erro.
 */
export type CorretoraTrackRecord = {
  total_lots: number;
  estimated_sacas: number;
  window_days: number;
};

export async function fetchCorretoraTrackRecord(
  slug: string,
): Promise<CorretoraTrackRecord | null> {
  try {
    return await fetchJson<CorretoraTrackRecord>(
      buildUrl(
        `/api/public/corretoras/${encodeURIComponent(slug)}/track-record`,
      ),
    );
  } catch {
    return null;
  }
}

/**
 * Fetch distinct cities for the filter dropdown.
 */
export async function fetchCorretorasCities(): Promise<string[]> {
  try {
    const data = await fetchJson<string[]>(buildUrl("/api/public/corretoras/cities"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
