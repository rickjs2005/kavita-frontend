import type {
  NewsPostsListParams,
  NewsPostsListResponse,
  NewsPostDetail,
  NewsPostUpsertInput,
} from "@/types/kavita-news";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = (j as any)?.mensagem || (j as any)?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function toQS(params: Record<string, any>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "" || v === "all") continue;
    sp.set(k, String(v));
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Backend (adminNewsRoutes.js) expõe /posts dentro do router do Kavita News.
 * Portanto o caminho correto é:
 *   /api/admin/kavita-news/posts
 */
const BASE = "/api/admin/news/posts";

// LIST
export async function listNewsPosts(params: NewsPostsListParams): Promise<NewsPostsListResponse> {
  const qs = toQS({
    q: params.q,
    status: params.status,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
  });
  return api<NewsPostsListResponse>(`${BASE}${qs}`);
}

// CREATE
export async function createNewsPost(payload: NewsPostUpsertInput): Promise<NewsPostDetail> {
  return api<NewsPostDetail>(`${BASE}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// UPDATE
export async function updateNewsPost(id: number, payload: NewsPostUpsertInput): Promise<NewsPostDetail> {
  return api<NewsPostDetail>(`${BASE}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// DELETE
export async function deleteNewsPost(id: number): Promise<void> {
  return api<void>(`${BASE}/${id}`, { method: "DELETE" });
}

/**
 * NOTA:
 * Seu backend NÃO tem hoje:
 *  - GET /posts/:id
 *  - PATCH /posts/:id/status
 *  - PATCH /posts/:id/publish-now
 *
 * Então removemos essas funções para não quebrar.
 */
