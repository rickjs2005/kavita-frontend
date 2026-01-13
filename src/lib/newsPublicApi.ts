// src/lib/api/newsPublicApi.ts
import { apiPublic } from "./http";

export type PublicOk<T> = { ok: true; data: T; meta?: any };

/**
 * Tipos públicos (News)
 * Mantidos flexíveis (campos opcionais) para evitar quebra quando o backend variar nomes/campos.
 */

export type PublicClima = {
  id: number;
  city_name: string;
  slug: string;
  uf: string;
  mm_24h?: string | number | null;
  mm_7d?: string | number | null;
  source?: string | null;
  last_update_at?: string | null;
};

export type PublicCotacao = {
  id: number;

  // Identificação / SEO
  slug?: string | null;

  // Nome exibível
  name?: string | null;
  title?: string | null;

  // Agrupamento
  group_key?: string | null;

  // Heurística/labels
  market?: string | null;
  type?: string | null;

  // Unidade e valores (alguns componentes usam price, outros value)
  unit?: string | null;
  value?: string | number | null;
  price?: string | number | null;

  // Variações
  variation?: string | number | null;
  variation_day?: string | number | null;

  // Metadados
  source?: string | null;
  last_update_at?: string | null;

  // Compat extra
  updated_at?: string | null;
  created_at?: string | null;
};

export type PublicPost = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_url?: string | null;
  cover_image?: string | null;
  category?: string | null;
  published_at?: string | null;
  created_at?: string | null;
};

export type PublicOverview = {
  clima: PublicClima[];
  cotacoes: PublicCotacao[];
  posts: PublicPost[];
};

async function climaList() {
  return apiPublic<PublicOk<PublicClima[]>>("/api/news/clima");
}

async function climaBySlug(slug: string) {
  return apiPublic<PublicOk<PublicClima>>(`/api/news/clima/${encodeURIComponent(slug)}`);
}

async function cotacoesList(groupKey?: string) {
  const q = groupKey ? `?group_key=${encodeURIComponent(groupKey)}` : "";
  return apiPublic<PublicOk<PublicCotacao[]>>(`/api/news/cotacoes${q}`);
}

async function cotacaoBySlug(slug: string) {
  return apiPublic<PublicOk<PublicCotacao>>(`/api/news/cotacoes/${encodeURIComponent(slug)}`);
}

async function postsList(limit = 10, offset = 0) {
  return apiPublic<PublicOk<PublicPost[]>>(`/api/news/posts?limit=${limit}&offset=${offset}`);
}

async function postBySlug(slug: string) {
  return apiPublic<PublicOk<PublicPost>>(`/api/news/posts/${encodeURIComponent(slug)}`);
}

/**
 * Overview para página /news (agrega clima + cotacoes + posts)
 */
async function overview(limit = 6, groupKey?: string): Promise<PublicOk<PublicOverview>> {
  const [climaRes, cotacoesRes, postsRes] = await Promise.all([
    climaList(),
    cotacoesList(groupKey),
    postsList(limit, 0),
  ]);

  return {
    ok: true,
    data: {
      clima: climaRes?.data ?? [],
      cotacoes: cotacoesRes?.data ?? [],
      posts: postsRes?.data ?? [],
    },
    meta: {
      postsLimit: limit,
      groupKey: groupKey ?? null,
    },
  };
}

export const newsPublicApi = {
  climaList,
  climaBySlug,
  cotacoesList,
  cotacaoBySlug,
  postsList,
  postBySlug,
  overview,
};
