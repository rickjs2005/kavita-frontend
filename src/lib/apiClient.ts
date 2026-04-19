// src/lib/apiClient.ts
// Padrão único de HTTP client (fetch) para o projeto.
// Objetivos: credentials CONDICIONAL, parse seguro (JSON/texto), e erro consistente (ApiError).

import { ApiError, type ApiErrorPayload } from "./errors";

// ---------------------------------------------------------------------------
// Tratamento global de sessão expirada (401)
// Componentes não precisam tratar 401 individualmente — o cliente despacha
// um evento customizado que os contextos de auth podem capturar para redirecionar.
// ---------------------------------------------------------------------------

/**
 * Dispara evento global "auth:expired" quando o servidor retorna 401.
 * Escute com: window.addEventListener("auth:expired", handler).
 * Ignora rotas de login para evitar loop infinito.
 */
function dispatchAuthExpired(url: string) {
  // Evita disparar em rotas de login/logout para não criar loop
  if (
    typeof window === "undefined" ||
    url.includes("/login") ||
    url.includes("/logout")
  ) {
    return;
  }
  window.dispatchEvent(new CustomEvent("auth:expired", { detail: { url } }));
}

// ---------------------------------------------------------------------------
// CSRF token cache (P0-2)
// TTL de 10 minutos; dedup de requisições simultâneas; falha silenciosa.
// ---------------------------------------------------------------------------

const CSRF_TTL_MS = 10 * 60 * 1000; // 10 minutos

let _csrfToken: string | null = null;
let _csrfFetchedAt: number | null = null;
let _csrfInflight: Promise<string | null> | null = null;

/** Obtém o token CSRF do backend (com cache de 10 min e dedup). Falha silenciosamente. */
async function fetchCsrfToken(baseUrl: string): Promise<string | null> {
  const now = Date.now();

  // cache ainda válido
  if (_csrfToken && _csrfFetchedAt && now - _csrfFetchedAt < CSRF_TTL_MS) {
    return _csrfToken;
  }

  // dedup: se já tem requisição em andamento, reutiliza
  if (_csrfInflight) return _csrfInflight;

  _csrfInflight = (async () => {
    try {
      const url = joinUrl(baseUrl, "/api/csrf-token");
      const csrfController = new AbortController();
      const csrfTimeoutId = setTimeout(
        () => csrfController.abort(),
        CSRF_TIMEOUT_MS,
      );
      let res: Response;
      try {
        res = await fetch(url, {
          credentials: "include",
          signal: csrfController.signal,
        });
      } finally {
        clearTimeout(csrfTimeoutId);
      }
      if (!res.ok) {
        console.warn(`[apiClient] CSRF token fetch falhou: HTTP ${res.status}`);
        return null;
      }
      const json = await res.json();
      const token = typeof json?.csrfToken === "string" ? json.csrfToken : null;
      if (token) {
        _csrfToken = token;
        _csrfFetchedAt = Date.now();
      } else {
        console.warn(
          "[apiClient] CSRF token endpoint não retornou token válido.",
        );
      }
      return token;
    } catch (err) {
      // backend ainda não implementou; não quebra o fluxo
      const msg = err instanceof Error ? err.message : "erro desconhecido";
      console.warn(
        `[apiClient] CSRF token indisponível (endpoint ausente ou erro de rede). ${msg}`,
      );
      return null;
    } finally {
      _csrfInflight = null;
    }
  })();

  return _csrfInflight;
}

const CSRF_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

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

  /**
   * Timeout em milissegundos antes de abortar a requisição.
   * Default: 15000 (15 segundos).
   * Use 0 para desabilitar (ex: uploads grandes).
   */
  timeout?: number;
};

// No browser, baseUrl fica vazio — todas as requests são relativas ao host
// (`/api/...`), passando pelo rewrite do next.config.ts que faz proxy pro
// backend. Isso evita problemas de cookie cross-origin (SameSite=Lax) e
// permite acessar o painel de qualquer host na rede (localhost, IP, túnel)
// sem mexer em .env.
//
// No server (RSC/SSR), mantém URL absoluta — o server não tem "host" pra
// herdar e precisa bater direto no backend Express.
const IS_SERVER = typeof window === "undefined";

const DEFAULT_BASE_URL = IS_SERVER
  ? process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:5000"
  : "";

/** Timeout padrão para todas as requisições (15 segundos). Use options.timeout=0 para desabilitar. */
const DEFAULT_TIMEOUT_MS = 15_000;

/** Timeout fixo para o fetch do CSRF token (operação interna, não configurável). */
const CSRF_TIMEOUT_MS = 5_000;

function joinUrl(base: string, path: string) {
  if (!base) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === "object" && v !== null && (v as any).constructor === Object
  );
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

async function safeReadBody(
  res: Response,
): Promise<{ data: any; text?: string }> {
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

  if (contentType && !headers.has("content-type"))
    headers.set("content-type", contentType);

  return headers;
}

export async function apiRequest<T = any>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const url = joinUrl(baseUrl, path);

  const method = (options.method || "GET").toUpperCase();

  // ✅ CORREÇÃO CRÍTICA: Credentials CONDICIONAL
  // SÓ envia credentials para /api (autenticação, cookies, CSRF)
  // NÃO envia para /uploads (arquivos estáticos)
  const credentials: RequestCredentials = 
    url.includes("/api") 
      ? (options.credentials ?? "include")  // ✅ /api: com credentials
      : "omit";                              // ✅ /uploads: sem credentials

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

  const headers = buildHeaders(
    options.headers,
    options.skipContentType ? undefined : contentType,
  );

  // P0-2: Injeta CSRF token automaticamente para mutações (POST/PUT/PATCH/DELETE).
  // Falha silenciosa: se o backend ainda não expõe /api/csrf-token, continua sem o header.
  if (CSRF_METHODS.has(method)) {
    const csrfToken = await fetchCsrfToken(baseUrl);
    if (csrfToken && !headers.has("x-csrf-token")) {
      headers.set("x-csrf-token", csrfToken);
    }
  }

  // ---------------------------------------------------------------------------
  // Timeout via AbortController
  // ---------------------------------------------------------------------------
  const timeoutMs =
    options.timeout !== undefined ? options.timeout : DEFAULT_TIMEOUT_MS;

  let timeoutController: AbortController | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  // Determina o signal final:
  // - Se caller passou signal e temos timeout: combina via AbortSignal.any() quando disponível
  // - Se só timeout: usa nosso controller
  // - Se só caller signal: usa o dele
  // - Se nenhum: undefined
  let signal: AbortSignal | undefined = options.signal ?? undefined;

  if (timeoutMs > 0) {
    timeoutController = new AbortController();
    timeoutId = setTimeout(() => timeoutController!.abort(), timeoutMs);

    if (signal && typeof (AbortSignal as any).any === "function") {
      // Node 18.17+ / Chrome 116+: combina os dois signals
      signal = (AbortSignal as any).any([signal, timeoutController.signal]);
    } else {
      // Fallback: timeout tem prioridade (comportamento mais seguro para produção)
      signal = timeoutController.signal;
    }
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      method,
      credentials,
      headers,
      body,
      signal,
    });
  } catch (err) {
    // Distingue timeout de outros erros de rede
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError({
        status: 0,
        code: "TIMEOUT",
        message: `A requisição excedeu ${timeoutMs / 1000}s sem resposta. Verifique sua conexão e tente novamente.`,
        url,
      });
    }
    throw err;
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }

  if (options.raw) return res as unknown as T;

  const requestId = extractRequestId(res);
  const { data, text } = await safeReadBody(res);

  if (!res.ok) {
    const payload = normalizeErrorPayload(data);
    const message =
      payload.message ||
      (typeof data === "string" && data) ||
      (text && text) ||
      `HTTP ${res.status}`;

    // Despacha evento global para tratamento centralizado de sessão expirada
    if (res.status === 401) {
      dispatchAuthExpired(url);
    }

    throw new ApiError({
      status: res.status,
      code: payload.code,
      message,
      details: payload.details ?? data,
      requestId: payload.requestId ?? requestId,
      url,
    });
  }

  // Unwrap standard API envelope { ok: true, data?: ... }
  // Backend (lib/response.js) wraps all success responses in this format.
  // Consumers expect the inner payload, not the transport envelope.
  if (
    data != null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    (data as any).ok === true &&
    "data" in (data as any)
  ) {
    return ((data as any).data as T) ?? (null as unknown as T);
  }

  return (data as T) ?? (null as unknown as T);
}

/**
 * @deprecated Use `apiRequest` or `apiClient` instead.
 * Kept only for test files that still reference the alias directly.
 */
export const apiFetch = apiRequest;

// Conveniências (padrão único)
export const apiClient = {
  request: apiRequest,
  get: <T = any>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T = any>(path: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST", body }),
  put: <T = any>(path: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PUT", body }),
  patch: <T = any>(path: string, body?: any, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH", body }),
  del: <T = any>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};

export default apiClient;