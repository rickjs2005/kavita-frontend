import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock do módulo de erros usado pelo apiClient (SEM dependências novas)
vi.mock("../../lib/api/errors", () => {
  class ApiError extends Error {
    status?: number;
    code?: string;
    details?: unknown;
    requestId?: string;

    constructor(args: { status: number; code?: string; message: string; details?: unknown; requestId?: string }) {
      super(args.message);
      this.name = "ApiError";
      this.status = args.status;
      this.code = args.code;
      this.details = args.details;
      this.requestId = args.requestId;
    }
  }

  return { ApiError };
});

import { apiFetch } from "../../lib/apiClient";

type FetchMock = ReturnType<typeof vi.fn>;

function makeHeaders(map: Record<string, string>) {
  return {
    get: (key: string) => map[key.toLowerCase()] ?? null,
  } as unknown as Headers;
}

function mockFetchOnce(params: {
  ok: boolean;
  status: number;
  headers?: Record<string, string>;
  json?: () => Promise<any>;
}) {
  const fetchMock = global.fetch as unknown as FetchMock;

  fetchMock.mockResolvedValueOnce({
    ok: params.ok,
    status: params.status,
    headers: makeHeaders(
      Object.fromEntries(Object.entries(params.headers ?? {}).map(([k, v]) => [k.toLowerCase(), v]))
    ),
    json: params.json ?? (async () => ({})),
  } as unknown as Response);
}

describe("lib/api/apiClient.ts -> apiFetch()", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...OLD_ENV };
    global.fetch = vi.fn() as any;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("deve usar base default (http://localhost:5000) quando não houver env e retornar JSON em 200", async () => {
    // Arrange
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;

    const payload = { ok: true, items: [1, 2, 3] };

    mockFetchOnce({
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      json: async () => payload,
    });

    // Act
    const result = await apiFetch("/api/ping");

    // Assert
    expect(result).toEqual(payload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as any).mock.calls[0];

    expect(url).toBe("http://localhost:5000/api/ping");
    expect(init.credentials).toBe("include");
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });

  it("deve priorizar NEXT_PUBLIC_API_URL sobre NEXT_PUBLIC_API_BASE_URL", async () => {
    // Arrange
    process.env.NEXT_PUBLIC_API_URL = "https://api.kavita.com";
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://base.kavita.com";

    mockFetchOnce({
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      json: async () => ({ ok: true }),
    });

    // Act
    await apiFetch("/v1/health");

    // Assert
    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://api.kavita.com/v1/health");
  });

  it("deve montar URL corretamente removendo/evitando barras duplicadas", async () => {
    // Arrange
    process.env.NEXT_PUBLIC_API_URL = "https://api.kavita.com/";

    mockFetchOnce({
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      json: async () => ({ ok: true }),
    });

    // Act
    await apiFetch("/api/produtos");

    // Assert
    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://api.kavita.com/api/produtos");
  });

  it("se path já for http(s), deve usar o path diretamente (sem prefixar base)", async () => {
    // Arrange
    process.env.NEXT_PUBLIC_API_URL = "https://api.kavita.com";

    mockFetchOnce({
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      json: async () => ({ ok: true }),
    });

    // Act
    await apiFetch("https://external.service.com/echo");

    // Assert
    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://external.service.com/echo");
  });

  it("deve mesclar headers default com options.headers (mantendo Content-Type padrão)", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      json: async () => ({ ok: true }),
    });

    // Act
    await apiFetch("/api/test", {
      headers: { "X-Test": "1" },
    });

    // Assert
    const [, init] = (global.fetch as any).mock.calls[0];
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      "X-Test": "1",
    });
  });

  it("deve permitir sobrescrever Content-Type via options.headers", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      json: async () => ({ ok: true }),
    });

    // Act
    await apiFetch("/api/test", {
      headers: { "Content-Type": "text/plain" },
    });

    // Assert
    const [, init] = (global.fetch as any).mock.calls[0];
    expect(init.headers).toEqual({
      "Content-Type": "text/plain",
    });
  });

  it("deve manter credentials include por padrão, mas permitir sobrescrever via options.credentials", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      json: async () => ({ ok: true }),
    });

    // Act
    await apiFetch("/api/test", { credentials: "omit" });

    // Assert
    const [, init] = (global.fetch as any).mock.calls[0];
    expect(init.credentials).toBe("omit");
  });

  it("quando content-type não for application/json, deve retornar null (parse seguro)", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 200,
      headers: { "content-type": "text/html" },
      json: async () => {
        throw new Error("não deveria chamar json em ct != json");
      },
    });

    // Act
    const result = await apiFetch("/api/html");

    // Assert
    expect(result).toBeNull();
  });

  it("quando content-type for JSON mas json() falhar, deve retornar null (parse seguro)", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
      json: async () => {
        throw new Error("invalid json");
      },
    });

    // Act
    const result = await apiFetch("/api/bad-json");

    // Assert
    expect(result).toBeNull();
  });

  it("quando options.raw=true, deve retornar o Response (sem tentar parse)", async () => {
    // Arrange
    const responseLike = {
      ok: true,
      status: 200,
      headers: makeHeaders({ "content-type": "application/json" }),
      json: async () => ({ shouldNot: "be used" }),
    } as unknown as Response;

    (global.fetch as unknown as FetchMock).mockResolvedValueOnce(responseLike);

    // Act
    const res = await apiFetch<Response>("/api/download", { raw: true });

    // Assert
    expect(res).toBe(responseLike);
  });

  it("quando res.ok=false e payload tiver message, deve lançar ApiError com status/code/message/details e requestId do payload", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 400,
      headers: { "content-type": "application/json" },
      json: async () => ({
        code: "VALIDATION_ERROR",
        message: "Dados inválidos",
        details: { field: "name" },
        requestId: "req-123",
      }),
    });

    // Act + Assert
    await expect(apiFetch("/api/fail")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Dados inválidos",
      details: { field: "name" },
      requestId: "req-123",
    });
  });

  it("quando res.ok=false e payload NÃO tiver message, deve usar fallback `HTTP <status>`", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 500,
      headers: { "content-type": "application/json" },
      json: async () => ({ code: "SERVER_ERROR" }),
    });

    // Act + Assert
    await expect(apiFetch("/api/fail")).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
      code: "SERVER_ERROR",
      message: "HTTP 500",
    });
  });

  it("quando res.ok=false e não conseguir parsear JSON, deve lançar ApiError com fallback e requestId vindo do header x-request-id", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 401,
      headers: { "content-type": "application/json", "x-request-id": "hdr-req-9" },
      json: async () => {
        throw new Error("invalid json");
      },
    });

    // Act + Assert
    await expect(apiFetch("/api/unauthorized")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "HTTP 401",
      requestId: "hdr-req-9",
    });
  });

  it("quando res.ok=false e não houver x-request-id, deve tentar request-id", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 403,
      headers: { "content-type": "application/json", "request-id": "hdr-req-77" },
      json: async () => {
        throw new Error("invalid json");
      },
    });

    // Act + Assert
    await expect(apiFetch("/api/forbidden")).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "HTTP 403",
      requestId: "hdr-req-77",
    });
  });

  it("deve repassar options (ex: method/body) para o fetch", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 200,
      headers: { "content-type": "application/json" },
      json: async () => ({ created: true }),
    });

    const body = JSON.stringify({ name: "Produto" });

    // Act
    const result = await apiFetch("/api/produtos", { method: "POST", body });

    // Assert
    expect(result).toEqual({ created: true });

    const [, init] = (global.fetch as any).mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(body);
  });
});
