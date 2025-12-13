// src/lib/api/apiClient.ts
import { ApiError, type ApiErrorPayload } from "./errors";

type ApiFetchOptions = RequestInit & {
  // quando true, não faz JSON.parse no body (útil p/ download, etc.)
  raw?: boolean;
};

function joinUrl(base: string, path: string) {
  if (!base) return path;
  if (path.startsWith("http")) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

async function safeParseJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(path: string, options?: ApiFetchOptions): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  const url = joinUrl(base, path);

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  // 204 No Content
  if (res.status === 204) return null as unknown as T;

  const data = options?.raw ? null : await safeParseJson(res);
  if (!res.ok) {
    const payload = (data || {}) as ApiErrorPayload;

    const requestId =
      payload.requestId ||
      res.headers.get("x-request-id") ||
      res.headers.get("request-id") ||
      undefined;

    throw new ApiError({
      status: res.status,
      code: payload.code,
      message: payload.message || `HTTP ${res.status}`,
      details: payload.details,
      requestId,
    });
  }

  if (options?.raw) return (res as unknown) as T;

  // Se backend não devolver JSON, devolve null ao invés de quebrar
  return (data as T) ?? (null as unknown as T);
}
