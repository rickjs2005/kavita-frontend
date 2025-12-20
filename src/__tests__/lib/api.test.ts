import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "../../lib/api";

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetchOnce(response: Partial<Response> & { ok: boolean; status: number }) {
  const fetchMock = global.fetch as unknown as FetchMock;

  fetchMock.mockResolvedValueOnce({
    ok: response.ok,
    status: response.status,
    json: response.json ?? (async () => ({})),
  } as unknown as Response);
}

describe("lib/api.ts -> api()", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...OLD_ENV };

    global.fetch = vi.fn() as any;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("deve chamar fetch com base default (localhost:5000) e retornar JSON em 200", async () => {
    // Arrange
    delete process.env.NEXT_PUBLIC_API_URL;

    const payload = { ok: true, data: [1, 2, 3] };
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    // Act
    const result = await api("/api/ping");

    // Assert
    expect(result).toEqual(payload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as any).mock.calls[0];

    expect(url).toBe("http://localhost:5000/api/ping");
    expect(init).toBeTruthy();

    // Headers default
    expect(init.headers).toEqual({ "Content-Type": "application/json" });

    // Credentials default
    expect(init.credentials).toBe("include");
  });

  it("deve usar NEXT_PUBLIC_API_URL quando definido", async () => {
    // Arrange
    process.env.NEXT_PUBLIC_API_URL = "https://api.kavita.com";

    const payload = { hello: "world" };
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    // Act
    const result = await api("/v1/health");

    // Assert
    expect(result).toEqual(payload);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("https://api.kavita.com/v1/health");
  });

  it("deve passar init (ex: method/body) para o fetch", async () => {
    // Arrange
    const payload = { created: true };
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => payload,
    });

    const init: RequestInit = {
      method: "POST",
      body: JSON.stringify({ name: "Produto" }),
    };

    // Act
    const result = await api("/api/produtos", init);

    // Assert
    expect(result).toEqual(payload);

    const [, calledInit] = (global.fetch as any).mock.calls[0];
    expect(calledInit.method).toBe("POST");
    expect(calledInit.body).toBe(init.body);
  });

  it("quando res.ok=false e a resposta tem JSON com `mensagem`, deve lançar Error com essa mensagem", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 400,
      json: async () => ({ mensagem: "Dados inválidos" }),
    });

    // Act + Assert
    await expect(api("/api/teste")).rejects.toThrow("Dados inválidos");
  });

  it("quando res.ok=false e a resposta tem JSON com `message`, deve lançar Error com essa mensagem", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: "Não autorizado" }),
    });

    // Act + Assert
    await expect(api("/api/me")).rejects.toThrow("Não autorizado");
  });

  it("quando res.ok=false e o JSON não tem mensagem reconhecida, deve usar fallback `HTTP <status>`", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 500,
      json: async () => ({ foo: "bar" }),
    });

    // Act + Assert
    await expect(api("/api/falha")).rejects.toThrow("HTTP 500");
  });

  it("quando res.ok=false e res.json falha (payload não-JSON), deve usar fallback `HTTP <status>`", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("invalid json");
      },
    });

    // Act + Assert
    await expect(api("/api/bad-gateway")).rejects.toThrow("HTTP 502");
  });

  it("deve retornar null quando o backend responde 204 e json() retorna null (mock)", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 204,
      json: async () => null,
    });

    // Act
    const result = await api<null>("/api/empty");

    // Assert
    expect(result).toBeNull();
  });

  it("deve manter credentials include por padrão (quando init não sobrescreve)", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    // Act
    await api("/api/test", { method: "GET" });

    // Assert
    const [, calledInit] = (global.fetch as any).mock.calls[0];
    expect(calledInit.credentials).toBe("include");
  });

  it("deve permitir sobrescrever credentials via init (comportamento atual do spread)", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    // Act
    await api("/api/test", { credentials: "omit" });

    // Assert
    const [, calledInit] = (global.fetch as any).mock.calls[0];
    expect(calledInit.credentials).toBe("omit");
  });

  it("deve enviar Content-Type application/json por padrão", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    // Act
    await api("/api/test");

    // Assert
    const [, calledInit] = (global.fetch as any).mock.calls[0];
    expect(calledInit.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("se init.headers for fornecido, deve refletir o comportamento atual (init pode sobrescrever headers)", async () => {
    // Arrange
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    // Act
    await api("/api/test", { headers: { "X-Test": "1" } });

    // Assert
    const [, calledInit] = (global.fetch as any).mock.calls[0];

    // Observação: devido ao spread `...init` após headers default,
    // o `init.headers` pode sobrescrever o objeto de headers.
    expect(calledInit.headers).toEqual({ "X-Test": "1" });
  });
});
