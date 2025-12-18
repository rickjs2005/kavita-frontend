// src/lib/api/newsPublicApi.ts
import { apiPublic } from "./http";

export type PublicOk<T> = { ok: true; data: T; meta?: any };

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
  name: string;
  slug: string;
  group_key?: string | null;
  type?: string | null;
  price?: string | number | null;
  unit?: string | null;
  variation_day?: string | number | null;
  market?: string | null;
  source?: string | null;
  last_update_at?: string | null;
};

export type PublicPost = {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  cover_image_url?: string | null;
  category?: string | null;
  tags?: string | null;
  published_at?: string | null;
  views?: number | null;
};

export type Overview = {
  clima: PublicClima[];
  cotacoes: PublicCotacao[];
  posts: PublicPost[];
};

export const newsPublicApi = {
  overview: async (postsLimit = 6) => {
    return apiPublic<PublicOk<Overview>>(`/api/news/overview?posts_limit=${postsLimit}`);
  },

  climaList: async () => apiPublic<PublicOk<PublicClima[]>>(`/api/news/clima`),
  climaBySlug: async (slug: string) =>
    apiPublic<PublicOk<PublicClima>>(`/api/news/clima/${encodeURIComponent(slug)}`),

  cotacoesList: async (groupKey?: string) => {
    const q = groupKey ? `?group_key=${encodeURIComponent(groupKey)}` : "";
    return apiPublic<PublicOk<PublicCotacao[]>>(`/api/news/cotacoes${q}`);
  },
  cotacaoBySlug: async (slug: string) =>
    apiPublic<PublicOk<PublicCotacao>>(`/api/news/cotacoes/${encodeURIComponent(slug)}`),

  postsList: async (limit = 10, offset = 0) =>
    apiPublic<PublicOk<PublicPost[]>>(`/api/news/posts?limit=${limit}&offset=${offset}`),

  postBySlug: async (slug: string) =>
    apiPublic<PublicOk<PublicPost>>(`/api/news/posts/${encodeURIComponent(slug)}`),
};
