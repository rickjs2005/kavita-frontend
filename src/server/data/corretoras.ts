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
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<PublicCorretora>> {
  const qs = new URLSearchParams();
  if (params?.city) qs.set("city", params.city);
  if (params?.featured) qs.set("featured", params.featured);
  if (params?.search) qs.set("search", params.search);
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
 * Fetch a single corretora by slug.
 * Returns null if not found (404).
 */
export async function fetchPublicCorretoraBySlug(
  slug: string,
): Promise<PublicCorretora | null> {
  const url = buildUrl(`/api/public/corretoras/${encodeURIComponent(slug)}`);

  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();

  if (json && typeof json === "object" && json.ok === true && "data" in json) {
    return (json.data as PublicCorretora) ?? null;
  }

  return (json as PublicCorretora) ?? null;
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
