// src/utils/kavita-news/posts.ts

import type {
  NewsPostDetail,
  NewsPostsListParams,
  NewsPostsListResponse,
  NewsPostUpsertInput,
} from "@/types/kavita-news";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

/* =========================
 * Helpers (HTTP)
 * ========================= */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function pickErrorMessage(body: any, res: Response) {
  return (
    body?.message ||
    body?.mensagem ||
    body?.error ||
    body?.erro ||
    `HTTP ${res.status}`
  );
}

// padrão do seu backend adminPostsController: { ok, data, meta }
type ApiOk<T> = { ok: true; data: T; meta?: any };
type ApiFail = { ok: false; code?: string; message?: string; details?: any };

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.headers || {}),
      "Content-Type": "application/json",
    },
  });

  const body = await safeJson(res);

  if (!res.ok) {
    throw new Error(pickErrorMessage(body, res));
  }

  // quando backend usa wrapper ok/data:
  if (body && typeof body === "object" && "ok" in body) {
    const b = body as ApiOk<T> | ApiFail;
    if (!b.ok) throw new Error(b.message || "Falha na requisição.");
    return b.data as T;
  }

  return body as T;
}

function qs(params: Record<string, any>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* =========================
 * Rotas (Backend real)
 * ========================= */
const BASE_ADMIN_POSTS = "/api/admin/news/posts";

/* =========================
 * Upload de capa (multer)
 * ========================= */
// POST /api/admin/news/upload/cover (field: "file")
export async function uploadNewsCover(
  file: File
): Promise<{ url: string; filename?: string }> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/api/admin/news/upload/cover`, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  const body = await safeJson(res);

  if (!res.ok || !body?.ok) {
    throw new Error(pickErrorMessage(body, res));
  }

  return {
    url: String(body?.data?.url || ""),
    filename: body?.data?.filename,
  };
}

/* =========================
 * Adapters (tipos do front vs schema do backend)
 * ========================= */
function normalizeUpsert(input: NewsPostUpsertInput) {
  const anyInput: any = input as any;

  // aceita tanto cover_url quanto cover_image_url
  const cover_image_url =
    anyInput.cover_image_url ??
    anyInput.cover_url ??
    null;

  return {
    title: anyInput.title,
    slug: anyInput.slug ?? null,
    excerpt: anyInput.excerpt ?? null,
    content: anyInput.content ?? "",
    cover_image_url,
    category: anyInput.category ?? null,
    tags: anyInput.tags ?? anyInput.tags_csv ?? null,
    status: anyInput.status ?? "draft",
    published_at: anyInput.published_at ?? null,
  };
}

/* =========================
 * Posts (CRUD)
 * ========================= */
export async function listNewsPosts(
  params: NewsPostsListParams = {}
): Promise<NewsPostsListResponse> {
  // backend aceita status draft/published/archived
  const normalizedStatus =
    params.status && params.status !== "all" ? params.status : undefined;

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;

  const limit = pageSize;
  const offset = (Math.max(page, 1) - 1) * pageSize;

  // backend usa `search` e não `q`
  const query = qs({
    status: normalizedStatus,
    search: params.q ?? "",
    limit,
    offset,
  });

  // backend devolve "data" como array e "meta.total"
  const res = await fetch(`${API_BASE}${BASE_ADMIN_POSTS}${query}`, {
    method: "GET",
    credentials: "include",
  });

  const body = await safeJson(res);

  if (!res.ok) {
    throw new Error(pickErrorMessage(body, res));
  }

  const rows = Array.isArray(body?.data) ? body.data : [];
  const total = Number(body?.meta?.total || 0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items: rows,
    page,
    pageSize,
    total,
    totalPages,
  } as unknown as NewsPostsListResponse;
}

// Sem endpoint GET /posts/:id no seu controller atual.
// Mantém compat: lista e filtra.
export async function getNewsPost(id: number): Promise<NewsPostDetail> {
  const list = await listNewsPosts({ page: 1, pageSize: 200 });
  const found = (list.items as any[]).find((x) => Number(x.id) === Number(id));
  if (!found) throw new Error("Post não encontrado.");
  return found as unknown as NewsPostDetail;
}

export async function createNewsPost(
  input: NewsPostUpsertInput
): Promise<NewsPostDetail> {
  const payload = normalizeUpsert(input);

  // create no backend responde { ok: true, data: row } (201)
  const res = await fetch(`${API_BASE}${BASE_ADMIN_POSTS}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await safeJson(res);

  if (!res.ok) {
    throw new Error(pickErrorMessage(body, res));
  }

  // compat com { ok, data }
  if (body?.ok && body?.data) return body.data as NewsPostDetail;
  return body as NewsPostDetail;
}

export async function updateNewsPost(
  id: number,
  input: NewsPostUpsertInput
): Promise<NewsPostDetail> {
  const payload = normalizeUpsert(input);

  const res = await fetch(`${API_BASE}${BASE_ADMIN_POSTS}/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await safeJson(res);

  if (!res.ok) {
    throw new Error(pickErrorMessage(body, res));
  }

  if (body?.ok && body?.data) return body.data as NewsPostDetail;
  return body as NewsPostDetail;
}

export async function deleteNewsPost(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}${BASE_ADMIN_POSTS}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const body = await safeJson(res);

  if (!res.ok) {
    throw new Error(pickErrorMessage(body, res));
  }
}
