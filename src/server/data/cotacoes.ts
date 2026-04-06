// src/server/data/cotacoes.ts
//
// Server-only fetchers for public cotações pages (RSC).
// Uses native fetch() with next.revalidate for predictable ISR caching.
// Do NOT import this in client components — use newsPublicApi instead.
import "server-only";

import type { PublicCotacao } from "@/lib/newsPublicApi";

const API_BASE =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/** Revalidation interval in seconds for cotações data. */
const REVALIDATE_SECONDS = 120; // 2 minutes — cotações change infrequently within a sync cycle

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

  // Unwrap standard API envelope { ok: true, data: [...] }
  if (json && typeof json === "object" && json.ok === true && "data" in json) {
    return json.data as T;
  }

  return json as T;
}

/**
 * Fetch all active cotações for the public listing page.
 */
export async function fetchPublicCotacoes(
  groupKey?: string,
): Promise<PublicCotacao[]> {
  const q = groupKey ? `?group_key=${encodeURIComponent(groupKey)}` : "";
  const url = buildUrl(`/api/news/cotacoes${q}`);
  const data = await fetchJson<PublicCotacao[]>(url);
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch a single cotação by slug for the public detail page.
 * Returns null if not found (404).
 * Throws on other errors (500, timeout, etc.).
 */
export async function fetchPublicCotacaoBySlug(
  slug: string,
): Promise<PublicCotacao | null> {
  const url = buildUrl(`/api/news/cotacoes/${encodeURIComponent(slug)}`);

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

  // Unwrap envelope
  if (json && typeof json === "object" && json.ok === true && "data" in json) {
    return (json.data as PublicCotacao) ?? null;
  }

  return (json as PublicCotacao) ?? null;
}
