// src/lib/apiClient.ts
// Padrão único de HTTP client (fetch) para o projeto.
// Objetivos: credentials sempre include, parse seguro (JSON/texto), e erro consistente (ApiError).

import { ApiError, type ApiErrorPayload } from "./errors";

export type ApiRequestOptions = RequestInit & {
  /**
   * Quando true, retorna o Response cru (útil para download/stream).
   * Quando false (default), tenta retornar JSON e, se não for JSON, retorna texto (string) ou null.
   */
  raw?: boolean;

  /** URL base alternativa (default: NEXT_PUBLIC_API_URL || NEXT_PUBLIC_API_BASE_URL || http://localhost:5000) */
  baseUrl?: string;

  /** Se true, não adiciona header Content-Type automaticamente (útil para FormData). */
  skipContentType?: boolean;
};

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:5000";

function joinUrl(base: string, path: string) {
  if (!base) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && (v as any).constructor === Object;
}

function isBodyJsonSerializable(body: any) {
  // objects "puros" ({}), arrays, etc. (mas não FormData/Blob/ArrayBuffer/URLSearchParams)
  if (body == null) return false;
  if (typeof body === "string") return false;
  if (body instanceof FormData) return false;
  if (body instanceof Blob) return false;
  if (body instanceof ArrayBuffer) return false;
  if (body instanceof URLSearchParams) return false;
  return Array.isArray(body) || isPlainObject(body);
}

async function safeReadBody(res: Response): Promise<{ data: any; text?: string }> {
  const ct = (res.headers.get("content-type") || "").toLowerCase();

  // Prefer JSON quando content-type declara JSON
  if (ct.includes("application/json") || ct.includes("+json")) {
    try {
      const data = await res.json();
      return { data };
    } catch {
      // Cai para texto se JSON quebrar (backend pode mandar texto com ct errado)
    }
  }

  // Caso não seja JSON (ou falhou parse), tenta texto
  try {
    const text = await res.text();
    if (!text) return { data: null, text: "" };

    // Se parecer JSON, tenta parse defensivo
    const trimmed = text.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return { data: JSON.parse(trimmed), text };
      } catch {
        // mantém texto cru
      }
    }

    return { data: text, text };
  } catch {
    return { data: null, text: "" };
  }
}

function extractRequestId(res: Response): string | undefined {
  return (
    res.headers.get("x-request-id") ||
    res.headers.get("x-correlation-id") ||
    res.headers.get("request-id") ||
    undefined
  );
}

function normalizeErrorPayload(body: any): ApiErrorPayload {
  if (!body) return {};
  if (typeof body === "string") return { message: body };
  if (typeof body !== "object") return {};

  // Compat com seus padrões atuais (message/mensagem)
  const code = (body as any).code;
  const message = (body as any).message || (body as any).mensagem;
  const details = (body as any).details;
  const requestId = (body as any).requestId || (body as any).request_id;

  return { code, message, details, requestId };
}

function buildHeaders(initHeaders?: HeadersInit, contentType?: string) {
  const headers = new Headers(initHeaders || undefined);

  // Mantém compat com chamadas antigas
  if (!headers.has("accept")) headers.set("accept", "application/json");

  if (contentType && !headers.has("content-type")) headers.set("content-type", contentType);

  return headers;
}

export async function apiRequest<T = any>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const url = joinUrl(baseUrl, path);

  const method = (options.method || "GET").toUpperCase();

  // Garantia: credentials include sempre, a menos que o caller explicitamente mude
  const credentials = options.credentials ?? "include";

  // Normaliza body: se for objeto, vira JSON (exceto FormData etc.)
  let body = options.body as any;
  let contentType: string | undefined;

  if (isBodyJsonSerializable(body)) {
    body = JSON.stringify(body);
    contentType = "application/json";
  }

  if (typeof body === "string" && !options.skipContentType) {
    // se já é string e não tem content-type, assume JSON se parece JSON, senão texto
    const trimmed = body.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      contentType = "application/json";
    }
  }

  const headers = buildHeaders(options.headers, options.skipContentType ? undefined : contentType);

  const res = await fetch(url, {
    ...options,
    method,
    credentials,
    headers,
    body,
  });

  if (options.raw) return (res as unknown) as T;

  const requestId = extractRequestId(res);
  const { data, text } = await safeReadBody(res);

  if (!res.ok) {
    const payload = normalizeErrorPayload(data);
    const message =
      payload.message ||
      (typeof data === "string" && data) ||
      (text && text) ||
      `HTTP ${res.status}`;

    throw new ApiError({
      status: res.status,
      code: payload.code,
      message,
      details: payload.details ?? data,
      requestId: payload.requestId ?? requestId,
      url,
    });
  }

  return (data as T) ?? (null as unknown as T);
}

/**
 * Alias legado (compatibilidade)
 * Alguns hooks/services antigos ainda importam `apiFetch`.
 * Internamente, continua sendo o mesmo client (apiRequest) com credentials include e parse seguro.
 */
export const apiFetch = apiRequest;

// Conveniências (padrão único)
export const apiClient = {
  request: apiRequest,
  get: <T = any>(path: string, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T = any>(path: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T = any>(path: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T = any>(path: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  del: <T = any>(path: string, options?: ApiRequestOptions) => apiRequest<T>(path, { ...options, method: "DELETE" }),
};

export default apiClient;
