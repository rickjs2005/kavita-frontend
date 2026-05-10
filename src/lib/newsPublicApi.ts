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

export type CotacaoHistoryPoint = {
  id: number;
  price: string | number | null;
  variation_day?: string | number | null;
  source?: string | null;
  observed_at?: string | null;
  created_at?: string | null;
};

export type CotacoesHistoryBatch = Record<string, CotacaoHistoryPoint[]>;

/**
 * Histórico em lote — usado pelo painel "Cotações em tempo real" da home.
 * Retorna mapa { slug: [pontos...] }. Slugs inválidos são silenciosamente
 * filtrados pelo backend; se passar zero válidos retorna 400.
 */
async function cotacoesHistoryBatch(
  slugs: string[],
  limit = 24,
): Promise<CotacoesHistoryBatch> {
  if (!Array.isArray(slugs) || slugs.length === 0) return {};
  const csv = slugs
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .join(",");
  if (!csv) return {};
  const res = await apiClient.get<CotacoesHistoryBatch>(
    `/api/news/cotacoes/history-batch?slugs=${encodeURIComponent(csv)}&limit=${limit}`,
  );
  return res && typeof res === "object" ? res : {};
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

export type WhatsappSubscribeResult = {
  id: number;
  phone: string;
  status: "pending" | "active" | "unsubscribed";
  /** true se a inscrição foi criada agora; false se o número já existia. */
  created: boolean;
};

/**
 * Inscreve um número no canal WhatsApp do Kavita News.
 * Idempotente — número já existente NÃO retorna erro.
 *
 * O backend valida o telefone (10 ou 11 dígitos, DDD válido) — passamos
 * a string original (com ou sem máscara) e ele normaliza.
 */
async function whatsappSubscribe(
  phone: string,
  source = "home_news",
): Promise<WhatsappSubscribeResult> {
  return apiClient.post<WhatsappSubscribeResult>("/api/news/whatsapp-subscribe", {
    phone,
    source,
  });
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
  cotacoesHistoryBatch,
  postsList,
  postBySlug,
  overview,
  whatsappSubscribe,
};
