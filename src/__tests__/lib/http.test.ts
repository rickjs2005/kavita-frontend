import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiPublic } from "../../lib/http";

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetchOnce(params: {
  ok: boolean;
  status: number;
  json?: () => Promise<any>;
}) {
  const fetchMock = global.fetch as unknown as FetchMock;

  fetchMock.mockResolvedValueOnce({
    ok: params.ok,
    status: params.status,
    json: params.json ?? (async () => ({})),
  } as unknown as Response);
}

describe("lib/api/http.ts -> apiPublic()", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...OLD_ENV };
    global.fetch = vi.fn() as any;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("deve usar NEXT_PUBLIC_API_URL quando definido", async () => {
    // Arrange
    process.env.NEXT_PUBLIC_API_URL = "https://api.kavita.com";
    delete process.env.NEXT_PUBLIC_BACKEND_URL;

    const payload = { ok: true };
    mockFetchOnce({ ok: true, status: 200, json: async () => payload });

    // Act
    const result = await apiPublic("/api/ping");

    // Assert
    expect(result).toEqual(payload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://api.kavita.com/api/ping");
  });

  it("deve usar NEXT_PUBLIC_BACKEND_URL quando NEXT_PUBLIC_API_URL não existir", async () => {
    // Arrange
    delete process.env.NEXT_PUBLIC_API_URL;
    process.env.NEXT_PUBLIC_BACKEND_URL = "https://backend.kavita.com";

    mockFetchOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });

    // Act
    await apiPublic("/api/health");

    // Assert
    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://backend.kavita.com/api/health");
  });

  it("deve usar base default http://localhost:5000 quando não houver env", async () => {
    // Arrange
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_BACKEND_URL;

    mockFetchOnce({ ok: true, status: 200, json: async () => ({ ok: true }) });

    // Act
    await apiPublic("/api/test");

    // Assert
    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("http://localhost:5000/api/test");
  });

  it("deve repassar init para o fetch (ex: method/body/headers custom)", async () => {
    // Arrange
    const payload = { created: true };
    mockFetchOnce({ ok: true, status: 200, json: async () => payload });

    const init: RequestInit = {
      method: "POST",
      body: JSON.stringify({ name: "Produto" }),
      headers: { "X-Test": "1" },
    };

    // Act
    const result = await apiPublic("/api/produtos", init);

    // Assert
    expect(result).toEqual(payload);

    const [, calledInit] = (global.fetch as any).mock.calls[0];
    expect(calledInit.method).toBe("POST");
    expect(calledInit.body).toBe(init.body);
    // não assume merge profundo; apenas que o init chegou
    expect(calledInit.headers).toEqual(init.headers);
  });

  it("quando res.ok=false e JSON tiver message, deve lançar Error com essa message", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Dados inválidos" }),
    });

    // Act + Assert
    await expect(apiPublic("/api/fail")).rejects.toThrow("Dados inválidos");
  });

  it("quando res.ok=false e JSON tiver mensagem, deve lançar Error com essa mensagem", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 401,
      json: async () => ({ mensagem: "Credenciais inválidas" }),
    });

    // Act + Assert
    await expect(apiPublic("/api/login")).rejects.toThrow("Credenciais inválidas");
  });

  it("quando res.ok=false e JSON não tiver message/mensagem, deve usar fallback HTTP <status>", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 500,
      json: async () => ({ code: "SERVER_ERROR" }),
    });

    // Act + Assert
    await expect(apiPublic("/api/crash")).rejects.toThrow("HTTP 500");
  });

  it("quando res.ok=false e res.json falhar, deve usar fallback HTTP <status>", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("invalid json");
      },
    });

    // Act + Assert
    await expect(apiPublic("/api/bad-gateway")).rejects.toThrow("HTTP 502");
  });

  it("quando res.ok=true, deve retornar o resultado de res.json()", async () => {
    // Arrange
    const payload = { items: [1, 2], ok: true };
    mockFetchOnce({ ok: true, status: 200, json: async () => payload });

    // Act
    const result = await apiPublic<typeof payload>("/api/items");

    // Assert
    expect(result).toEqual(payload);
  });
});
