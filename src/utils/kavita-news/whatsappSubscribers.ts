// src/utils/kavita-news/whatsappSubscribers.ts
//
// Cliente HTTP para o admin do canal WhatsApp do Kavita News.
// Casado com:
//   GET   /api/admin/news/whatsapp-subscribers
//   PATCH /api/admin/news/whatsapp-subscribers/:id/status
//
// Mesmo padrão dos outros services do admin de news (posts.ts):
// fetch direto com credentials: include, parse defensivo de JSON.

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000";

const BASE = "/api/admin/news/whatsapp-subscribers";

/* =========================
 * Tipos
 * ========================= */

export type WhatsappSubscriberStatus = "pending" | "active" | "unsubscribed";

export type WhatsappSubscriberRow = {
  id: number;
  phone: string;
  status: WhatsappSubscriberStatus;
  source: string;
  ip: string | null;
  user_agent: string | null;
  confirm_token: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type ListSubscribersParams = {
  /** Página (1-based). */
  page?: number;
  pageSize?: number;
  /** Filtro de status. "all" (default no UI) significa não filtrar. */
  status?: WhatsappSubscriberStatus | "all";
};

export type ListSubscribersResponse = {
  rows: WhatsappSubscriberRow[];
  total: number;
  limit: number;
  offset: number;
};

/* =========================
 * Helpers HTTP
 * ========================= */

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function pickErrorMessage(body: any, res: Response): string {
  return (
    body?.message ||
    body?.mensagem ||
    body?.error ||
    body?.erro ||
    `HTTP ${res.status}`
  );
}

function qs(params: Record<string, any>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/* =========================
 * API
 * ========================= */

export async function listWhatsappSubscribers(
  params: ListSubscribersParams = {},
): Promise<ListSubscribersResponse> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 25;
  const limit = pageSize;
  const offset = (Math.max(page, 1) - 1) * pageSize;

  const status =
    params.status && params.status !== "all" ? params.status : undefined;

  const query = qs({ limit, offset, status });

  const res = await fetch(`${API_BASE}${BASE}${query}`, {
    method: "GET",
    credentials: "include",
  });

  const body = await safeJson(res);
  if (!res.ok) {
    throw new Error(pickErrorMessage(body, res));
  }

  return {
    rows: Array.isArray(body?.data) ? body.data : [],
    total: Number(body?.meta?.total ?? 0),
    limit: Number(body?.meta?.limit ?? limit),
    offset: Number(body?.meta?.offset ?? offset),
  };
}

export async function updateWhatsappSubscriberStatus(
  id: number,
  status: WhatsappSubscriberStatus,
): Promise<WhatsappSubscriberRow> {
  const res = await fetch(`${API_BASE}${BASE}/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const body = await safeJson(res);
  if (!res.ok) {
    throw new Error(pickErrorMessage(body, res));
  }

  return body?.data as WhatsappSubscriberRow;
}
