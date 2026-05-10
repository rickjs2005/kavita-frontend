// src/server/data/newsOverview.ts
//
// Server-only fetcher for the /news overview page (RSC).
// Fetches clima, cotações and posts INDEPENDENTLY — a failure in one
// module does NOT prevent the others from rendering.
import "server-only";

import type {
  PublicClima,
  PublicCotacao,
  PublicPost,
  CotacaoHistoryPoint,
  CotacoesHistoryBatch,
} from "@/lib/newsPublicApi";

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

/** Fetch safely — returns empty array on any error instead of throwing. */
async function fetchSafe<T>(url: string): Promise<T[]> {
  try {
    const data = await fetchJson<T[]>(url);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export type NewsOverview = {
  clima: PublicClima[];
  cotacoes: PublicCotacao[];
  posts: PublicPost[];
  /** Mapa { slug: [pontos...] } com histórico recente das cotações listadas
   *  (até 24 pontos cada, últimos 7 dias). Se o batch falhar, vem vazio
   *  — os sparklines caem para silhueta procedural sem quebrar a página. */
  cotacoesHistory: Record<string, CotacaoHistoryPoint[]>;
  /** true if ALL three modules returned empty/error — page has nothing to show */
  isEmpty: boolean;
  /** true if at least one module failed (data may be partial) */
  hasErrors: boolean;
};

/**
 * Fetches all three news modules independently.
 * Each module that fails returns an empty array — the page still renders
 * with whatever data is available.
 *
 * This is intentionally different from Promise.all: a single broken module
 * should NOT take down the entire /news page.
 */
export async function fetchNewsOverview(postsLimit = 6): Promise<NewsOverview> {
  // Fetch all three in parallel but independently (Promise.allSettled pattern)
  const [climaResult, cotacoesResult, postsResult] = await Promise.allSettled([
    fetchSafe<PublicClima>(buildUrl("/api/news/clima")),
    fetchSafe<PublicCotacao>(buildUrl("/api/news/cotacoes")),
    fetchSafe<PublicPost>(buildUrl(`/api/news/posts?limit=${postsLimit}&offset=0`)),
  ]);

  const clima = climaResult.status === "fulfilled" ? climaResult.value : [];
  const cotacoes = cotacoesResult.status === "fulfilled" ? cotacoesResult.value : [];
  const posts = postsResult.status === "fulfilled" ? postsResult.value : [];

  const hasErrors =
    climaResult.status === "rejected" ||
    cotacoesResult.status === "rejected" ||
    postsResult.status === "rejected";

  // Segunda etapa: pega histórico em lote das cotações que vieram. Mantemos
  // como passo separado para que uma falha aqui NÃO impeça a página de
  // renderizar — o sparkline cai pra silhueta procedural.
  const slugs = cotacoes
    .map((c) => (typeof c.slug === "string" ? c.slug.trim() : ""))
    .filter((s): s is string => s.length > 0)
    .slice(0, 12);

  let cotacoesHistory: CotacoesHistoryBatch = {};
  if (slugs.length > 0) {
    try {
      const csv = encodeURIComponent(slugs.join(","));
      cotacoesHistory = await fetchJson<CotacoesHistoryBatch>(
        buildUrl(`/api/news/cotacoes/history-batch?slugs=${csv}&limit=24`),
      );
      if (!cotacoesHistory || typeof cotacoesHistory !== "object") {
        cotacoesHistory = {};
      }
    } catch {
      cotacoesHistory = {};
    }
  }

  const isEmpty = clima.length === 0 && cotacoes.length === 0 && posts.length === 0;

  return { clima, cotacoes, posts, cotacoesHistory, isEmpty, hasErrors };
}
