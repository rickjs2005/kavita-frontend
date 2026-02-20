import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Mock do módulo de erros usado pelo apiClient (SEM dependências novas)
 * (mantém ApiError compatível com o construtor usado em apiClient.ts)
 */
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
    json:
      params.json ??
      (async () => {
        throw new Error("json() não mockado");
      }),
    text:
      params.text ??
      (async () => {
        return "";
      }),
  } as unknown as Response;
}

function getFirstFetchCall() {
  const calls = (globalThis.fetch as any)?.mock?.calls ?? [];
  if (!calls.length) throw new Error("fetch não foi chamado");
  const [url, init] = calls[0] as [string, RequestInit];
  return { url, init };
}

function headerGet(headers: HeadersInit | undefined, key: string) {
  if (!headers) return null;

  const k = key.toLowerCase();

  // Headers instance
  if (typeof (headers as any).get === "function") {
    return (headers as any).get(key) ?? (headers as any).get(k) ?? null;
  }

  // Array of tuples
  if (Array.isArray(headers)) {
    const found = headers.find(([hk]) => String(hk).toLowerCase() === k);
    return found ? String(found[1]) : null;
  }

  // Plain object
  const obj = headers as Record<string, any>;
  for (const [hk, hv] of Object.entries(obj)) {
    if (hk.toLowerCase() === k) return String(hv);
  }
  return null;
}

async function importClient() {
  // IMPORTANT: reimporta pra recalcular DEFAULT_BASE_URL com env atual
  const mod = await import("../../lib/apiClient");
  return mod;
}

describe("lib/apiClient.ts -> apiFetch()/apiRequest()", () => {
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

  it("deve usar base default (http://localhost:5000) quando não houver env e retornar JSON em 200", async () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ ok: true, items: [1, 2, 3] }),
      })
    );

    const result = await apiFetch("/api/ping");

    expect(result).toEqual({ ok: true, items: [1, 2, 3] });

    const { url, init } = getFirstFetchCall();
    expect(url).toBe("http://localhost:5000/api/ping");
    expect(init.credentials).toBe("include");

    // headers são Headers(), em lowercase:
    expect(headerGet(init.headers, "accept")).toBe("application/json");
    // GET sem body => não força content-type
    expect(headerGet(init.headers, "content-type")).toBeNull();
  });

  it("deve priorizar NEXT_PUBLIC_API_URL sobre NEXT_PUBLIC_API_BASE_URL", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.kavita.com";
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://base.kavita.com";

    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ ok: true }),
      })
    );

    await apiFetch("/v1/health");

    const { url } = getFirstFetchCall();
    expect(url).toBe("https://api.kavita.com/v1/health");
  });

  it("deve montar URL corretamente removendo/evitando barras duplicadas", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.kavita.com/";

    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ ok: true }),
      })
    );

    await apiFetch("/api/produtos");

    const { url } = getFirstFetchCall();
    expect(url).toBe("https://api.kavita.com/api/produtos");
  });

  it("se path já for http(s), deve usar o path diretamente (sem prefixar base)", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.kavita.com";

    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ ok: true }),
      })
    );

    await apiFetch("https://external.service.com/echo");

    const { url } = getFirstFetchCall();
    expect(url).toBe("https://external.service.com/echo");
  });

  it("deve setar accept=application/json por padrão", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ ok: true }),
      })
    );

    await apiFetch("/api/test");

    const { init } = getFirstFetchCall();
    expect(headerGet(init.headers, "accept")).toBe("application/json");
  });

  it("quando body for objeto/array, deve JSON.stringify e setar content-type application/json", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ created: true }),
      })
    );

    const result = await apiFetch("/api/produtos", { method: "POST", body: JSON.stringify({ name: "Produto" }) });

    expect(result).toEqual({ created: true });

    const { init } = getFirstFetchCall();
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Produto" }));
    expect(headerGet(init.headers, "content-type")).toBe("application/json");
  });

  it("deve mesclar headers do caller e manter accept default", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ ok: true }),
      })
    );

    await apiFetch("/api/test", { headers: { "X-Test": "1" } });

    const { init } = getFirstFetchCall();
    expect(headerGet(init.headers, "x-test")).toBe("1");
    expect(headerGet(init.headers, "accept")).toBe("application/json");
  });

  it("deve permitir sobrescrever content-type via headers do caller", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ ok: true }),
      })
    );

    await apiFetch("/api/test", { headers: { "content-type": "text/plain" } });

    const { init } = getFirstFetchCall();
    expect(headerGet(init.headers, "content-type")).toBe("text/plain");
  });

  it("deve manter credentials include por padrão, mas permitir sobrescrever via options.credentials", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ ok: true }),
      })
    );

    await apiFetch("/api/test", { credentials: "omit" });

    const { init } = getFirstFetchCall();
    expect(init.credentials).toBe("omit");
  });

  it("quando options.raw=true, deve retornar o Response (sem tentar parse)", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    const responseLike = makeResponse({
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      json: async () => ({ shouldNot: "be used" }),
    });

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(responseLike);

    const res = await apiFetch<Response>("/api/download", { raw: true });
    expect(res).toBe(responseLike);
  });

  it("parse seguro: ct json + json() ok => retorna objeto", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
        json: async () => ({ ok: true }),
      })
    );

    const data = await apiFetch("/api/json");
    expect(data).toEqual({ ok: true });
  });

  it("parse seguro: ct json mas json() falha => cai pra text()", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => {
          throw new Error("invalid json");
        },
        text: async () => "ok-text",
      })
    );

    const data = await apiFetch("/api/bad-json");
    expect(data).toBe("ok-text");
  });

  it("parse seguro: ct não-json => retorna texto", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "text/html" },
        text: async () => "<h1>ok</h1>",
      })
    );

    const data = await apiFetch("/api/html");
    expect(data).toBe("<h1>ok</h1>");
  });

  it("quando res.ok=false e payload tiver message/code/details/requestId, deve lançar ApiError completo", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: false,
        status: 400,
        headers: { "content-type": "application/json" },
        json: async () => ({
          code: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: { field: "name" },
          requestId: "req-123",
        }),
      })
    );

    await expect(apiFetch("/api/fail")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: { field: "name" },
      requestId: "req-123",
    });
  });

  it("quando res.ok=false e JSON não parsear, deve usar requestId de header (x-request-id)", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: false,
        status: 401,
        headers: { "content-type": "application/json", "x-request-id": "hdr-req-9" },
        json: async () => {
          throw new Error("invalid json");
        },
        text: async () => "",
      })
    );

    await expect(apiFetch("/api/unauthorized")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "HTTP 401",
      requestId: "hdr-req-9",
    });
  });

  it("deve respeitar skipContentType=true (não setar content-type automaticamente)", async () => {
    vi.resetModules();
    const { apiFetch } = await importClient();

    (globalThis.fetch as unknown as FetchMock).mockResolvedValueOnce(
      makeResponse({
        ok: true,
        status: 200,
        headers: { "content-type": "application/json" },
        json: async () => ({ ok: true }),
      })
    );

    const body = JSON.stringify({ a: 1 });

    await apiFetch("/api/test", { method: "POST", body, skipContentType: true });

    const { init } = getFirstFetchCall();
    expect(init.body).toBe(body);
    expect(headerGet(init.headers, "content-type")).toBeNull();
    expect(headerGet(init.headers, "accept")).toBe("application/json");
  });
});