// src/__tests__/lib/apiClient.csrf.test.ts
// Unit tests for CSRF injection, caching, and dedup in apiClient.ts

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../lib/errors", () => {
  class ApiError extends Error {
    status?: number;
    code?: string;
    details?: unknown;
    requestId?: string;
    url?: string;

    constructor(args: {
      status: number;
      code?: string;
      message: string;
      details?: unknown;
      requestId?: string;
      url?: string;
    }) {
      super(args.message);
      this.name = "ApiError";
      this.status = args.status;
      this.code = args.code;
      this.details = args.details;
      this.requestId = args.requestId;
      this.url = args.url;
    }
  }

  return { ApiError };
});

type FetchMock = ReturnType<typeof vi.fn>;

function makeHeaders(map: Record<string, string>) {
  const lower = Object.fromEntries(Object.entries(map).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    get: (key: string) => lower[String(key).toLowerCase()] ?? null,
  } as unknown as Headers;
}

function makeResponse(params: {
  ok: boolean;
  status: number;
  headers?: Record<string, string>;
  json?: () => Promise<any>;
  text?: () => Promise<string>;
}) {
  return {
    ok: params.ok,
    status: params.status,
    headers: makeHeaders(params.headers ?? {}),
    json: params.json ?? (async () => { throw new Error("json() não mockado"); }),
    text: params.text ?? (async () => ""),
  } as unknown as Response;
}

function headerGet(headers: HeadersInit | undefined, key: string) {
  if (!headers) return null;
  const k = key.toLowerCase();
  if (typeof (headers as any).get === "function") {
    return (headers as any).get(key) ?? (headers as any).get(k) ?? null;
  }
  if (Array.isArray(headers)) {
    const found = (headers as [string, string][]).find(([hk]) => String(hk).toLowerCase() === k);
    return found ? String(found[1]) : null;
  }
  const obj = headers as Record<string, any>;
  for (const [hk, hv] of Object.entries(obj)) {
    if (hk.toLowerCase() === k) return String(hv);
  }
  return null;
}

function getNthFetchCall(n: number) {
  const calls = (globalThis.fetch as any)?.mock?.calls ?? [];
  if (calls.length <= n) throw new Error(`fetch foi chamado apenas ${calls.length} vez(es), esperava ao menos ${n + 1}`);
  const [url, init] = calls[n] as [string, RequestInit];
  return { url, init };
}

async function importClient() {
  vi.resetModules();
  return import("../../lib/apiClient");
}

describe("apiClient – CSRF token injection", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("deve injetar x-csrf-token no cabeçalho para requisições POST", async () => {
    const { apiClient } = await importClient();

    // 1st call: CSRF endpoint
    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ token: "csrf-abc123" }),
      })
    );

    // 2nd call: actual API call
    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ created: true }),
      })
    );

    await apiClient.post("/api/admin/test", { key: "value" });

    const { init } = getNthFetchCall(1);
    expect(headerGet(init.headers, "x-csrf-token")).toBe("csrf-abc123");
  });

  it("deve injetar x-csrf-token para requisições PUT, PATCH e DELETE", async () => {
    const methods = ["put", "patch", "del"] as const;

    for (const method of methods) {
      vi.resetModules();
      vi.stubGlobal("fetch", vi.fn());

      const { apiClient: client } = await importClient();

      // CSRF call
      (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
        makeResponse({
          ok: true,
          status: 200,
          headers: { "content-type": "application/json" },
          json: async () => ({ token: `token-${method}` }),
        })
      );

      // actual API call
      (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
        makeResponse({
          ok: true,
          status: 200,
          headers: { "content-type": "application/json" },
          json: async () => ({ ok: true }),
        })
      );

      if (method === "del") {
        await client.del("/api/admin/resource/1");
      } else {
        await client[method]("/api/admin/resource/1", { foo: "bar" });
      }

      const { init } = getNthFetchCall(1);
      expect(headerGet(init.headers, "x-csrf-token")).toBe(`token-${method}`);
    }
  });

  it("NÃO deve injetar x-csrf-token em requisições GET", async () => {
    const { apiClient } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ data: [] }),
      })
    );

    await apiClient.get("/api/admin/items");

    // Only one fetch call (no CSRF pre-fetch for GET)
    const calls = (globalThis.fetch as any)?.mock?.calls ?? [];
    expect(calls.length).toBe(1);

    const { init } = getNthFetchCall(0);
    expect(headerGet(init.headers, "x-csrf-token")).toBeNull();
  });

  it("deve continuar sem CSRF token quando o endpoint /api/csrf-token retorna erro (falha silenciosa)", async () => {
    const { apiClient } = await importClient();

    // CSRF endpoint not available
    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({ ok: false, status: 404, headers: {} })
    );

    // actual API call succeeds
    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ ok: true }),
      })
    );

    const result = await apiClient.post("/api/admin/test", { x: 1 });

    expect(result).toEqual({ ok: true });

    const { init } = getNthFetchCall(1);
    // CSRF header should be absent (not null-stringified)
    expect(headerGet(init.headers, "x-csrf-token")).toBeNull();
  });

  it("deve usar token CSRF em cache (não refazer fetch dentro do TTL)", async () => {
    const { apiClient } = await importClient();

    // First CSRF fetch
    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ token: "cached-token" }),
      })
    );

    // First API call
    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ n: 1 }),
      })
    );

    // Second API call (no CSRF fetch needed – should use cache)
    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ n: 2 }),
      })
    );

    await apiClient.post("/api/admin/first", { a: 1 });
    await apiClient.post("/api/admin/second", { b: 2 });

    const calls = (globalThis.fetch as any)?.mock?.calls ?? [];
    // Should be 3 total: 1 CSRF + 2 API calls
    expect(calls.length).toBe(3);

    // Both API calls should carry the same cached CSRF token
    const { init: init1 } = getNthFetchCall(1);
    const { init: init2 } = getNthFetchCall(2);
    expect(headerGet(init1.headers, "x-csrf-token")).toBe("cached-token");
    expect(headerGet(init2.headers, "x-csrf-token")).toBe("cached-token");
  });
});

describe("apiClient – CSRF fallback quando endpoint lança exceção", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("deve continuar sem CSRF token quando fetch lança erro de rede", async () => {
    vi.resetModules();
    const { apiClient } = await importClient();

    // CSRF endpoint throws network error
    (globalThis.fetch as unknown as FetchMock)
      .mockRejectedValueOnce(new TypeError("Network error"))
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          status: 200,
          headers: { "content-type": "application/json" },
          json: async () => ({ ok: true }),
        })
      );

    const result = await apiClient.post("/api/admin/save", { data: 1 });
    expect(result).toEqual({ ok: true });
  });
});
