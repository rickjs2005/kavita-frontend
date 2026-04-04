// src/lib/newsPublicApi.ts
//
// API client público para o módulo Kavita News.
// Retorna os payloads já unwrapped (apiClient extrai .data do envelope).
import apiClient from "./apiClient";

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
  cover_image_url?: string | null;
  tags?: string | null;
  category?: string | null;
  published_at?: string | null;
  created_at?: string | null;
};

export type PublicOverview = {
  clima: PublicClima[];
  cotacoes: PublicCotacao[];
  posts: PublicPost[];
};

async function climaList(): Promise<PublicClima[]> {
  const res = await apiClient.get<PublicClima[]>("/api/news/clima");
  return Array.isArray(res) ? res : [];
}

async function climaBySlug(slug: string): Promise<PublicClima | null> {
  return apiClient.get<PublicClima>(
    `/api/news/clima/${encodeURIComponent(slug)}`,
  );
}

async function cotacoesList(groupKey?: string): Promise<PublicCotacao[]> {
  const q = groupKey ? `?group_key=${encodeURIComponent(groupKey)}` : "";
  const res = await apiClient.get<PublicCotacao[]>(`/api/news/cotacoes${q}`);
  return Array.isArray(res) ? res : [];
}

async function cotacaoBySlug(slug: string): Promise<PublicCotacao | null> {
  return apiClient.get<PublicCotacao>(
    `/api/news/cotacoes/${encodeURIComponent(slug)}`,
  );
}

async function postsList(limit = 10, offset = 0): Promise<PublicPost[]> {
  const res = await apiClient.get<PublicPost[]>(
    `/api/news/posts?limit=${limit}&offset=${offset}`,
  );
  return Array.isArray(res) ? res : [];
}

async function postBySlug(slug: string): Promise<PublicPost | null> {
  return apiClient.get<PublicPost>(
    `/api/news/posts/${encodeURIComponent(slug)}`,
  );
}

/**
 * Overview para página /news (agrega clima + cotacoes + posts)
 */
async function overview(
  limit = 6,
  groupKey?: string,
): Promise<PublicOverview> {
  const [clima, cotacoes, posts] = await Promise.all([
    climaList(),
    cotacoesList(groupKey),
    postsList(limit, 0),
  ]);

  return { clima, cotacoes, posts };
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
