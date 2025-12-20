import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { newsPublicApi } from "../../lib/newsPublicApi";

type FetchMock = ReturnType<typeof vi.fn>;

function mockFetchOnce(params: { ok: boolean; status: number; json: any }) {
  const fetchMock = global.fetch as unknown as FetchMock;

  fetchMock.mockResolvedValueOnce({
    ok: params.ok,
    status: params.status,
    json: async () => params.json,
  } as unknown as Response);
}

describe("lib/api/newsPublicApi.ts -> newsPublicApi", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...OLD_ENV };
    process.env.NEXT_PUBLIC_API_URL = "http://test-base"; // controla base do apiPublic
    global.fetch = vi.fn() as any; // sem rede real
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("overview: deve usar posts_limit padrão=6 e chamar fetch com URL correta", async () => {
    // Arrange
    const payload = { ok: true, data: { clima: [], cotacoes: [], posts: [] } };
    mockFetchOnce({ ok: true, status: 200, json: payload });

    // Act
    const result = await newsPublicApi.overview();

    // Assert
    expect(result).toEqual(payload);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("http://test-base/api/news/overview?posts_limit=6");
  });

  it("overview: deve aceitar posts_limit custom e chamar fetch com URL correta", async () => {
    // Arrange
    const payload = { ok: true, data: { clima: [], cotacoes: [], posts: [] } };
    mockFetchOnce({ ok: true, status: 200, json: payload });

    // Act
    const result = await newsPublicApi.overview(12);

    // Assert
    expect(result).toEqual(payload);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("http://test-base/api/news/overview?posts_limit=12");
  });

  it("climaList: deve chamar fetch na rota correta", async () => {
    // Arrange
    const payload = { ok: true, data: [{ id: 1, city_name: "X", slug: "x", uf: "MG" }] };
    mockFetchOnce({ ok: true, status: 200, json: payload });

    // Act
    const result = await newsPublicApi.climaList();

    // Assert
    expect(result).toEqual(payload);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("http://test-base/api/news/clima");
  });

  it("climaBySlug: deve aplicar encodeURIComponent no slug", async () => {
    // Arrange
    const payload = { ok: true, data: { id: 1, city_name: "X", slug: "x", uf: "MG" } };
    mockFetchOnce({ ok: true, status: 200, json: payload });

    const slug = "sao paulo/sp?x=1";

    // Act
    const result = await newsPublicApi.climaBySlug(slug);

    // Assert
    expect(result).toEqual(payload);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe(`http://test-base/api/news/clima/${encodeURIComponent(slug)}`);
  });

  it("cotacoesList: sem groupKey deve chamar rota base", async () => {
    // Arrange
    const payload = { ok: true, data: [{ id: 1, slug: "dolar", name: "Dólar", unit: "R$" }] };
    mockFetchOnce({ ok: true, status: 200, json: payload });

    // Act
    const result = await newsPublicApi.cotacoesList();

    // Assert
    expect(result).toEqual(payload);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("http://test-base/api/news/cotacoes");
  });

  it("cotacoesList: com groupKey deve incluir query param group_key com encodeURIComponent", async () => {
    // Arrange
    const groupKey = "café & açúcar";
    const payload = { ok: true, data: [], meta: { group_key: groupKey } };
    mockFetchOnce({ ok: true, status: 200, json: payload });

    // Act
    const result = await newsPublicApi.cotacoesList(groupKey);

    // Assert
    expect(result).toEqual(payload);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe(`http://test-base/api/news/cotacoes?group_key=${encodeURIComponent(groupKey)}`);
  });

  it("cotacaoBySlug: deve aplicar encodeURIComponent no slug", async () => {
    // Arrange
    const payload = { ok: true, data: { slug: "soja", name: "Soja" } };
    mockFetchOnce({ ok: true, status: 200, json: payload });

    const slug = "soja/mt?ref=1";

    // Act
    const result = await newsPublicApi.cotacaoBySlug(slug);

    // Assert
    expect(result).toEqual(payload);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe(`http://test-base/api/news/cotacoes/${encodeURIComponent(slug)}`);
  });

  it("postsList: deve usar defaults (limit=10, offset=0)", async () => {
    // Arrange
    const payload = { ok: true, data: [{ id: 1, slug: "post", title: "Post" }], meta: { limit: 10, offset: 0 } };
    mockFetchOnce({ ok: true, status: 200, json: payload });

    // Act
    const result = await newsPublicApi.postsList();

    // Assert
    expect(result).toEqual(payload);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("http://test-base/api/news/posts?limit=10&offset=0");
  });

  it("postsList: deve aceitar limit/offset custom", async () => {
    // Arrange
    const payload = { ok: true, data: [], meta: { limit: 25, offset: 50 } };
    mockFetchOnce({ ok: true, status: 200, json: payload });

    // Act
    const result = await newsPublicApi.postsList(25, 50);

    // Assert
    expect(result).toEqual(payload);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe("http://test-base/api/news/posts?limit=25&offset=50");
  });

  it("postBySlug: deve aplicar encodeURIComponent no slug", async () => {
    // Arrange
    const payload = { ok: true, data: { id: 1, slug: "x", title: "x" } };
    mockFetchOnce({ ok: true, status: 200, json: payload });

    const slug = "post legal/2025?utm=1";

    // Act
    const result = await newsPublicApi.postBySlug(slug);

    // Assert
    expect(result).toEqual(payload);

    const [url] = (global.fetch as any).mock.calls[0];
    expect(url).toBe(`http://test-base/api/news/posts/${encodeURIComponent(slug)}`);
  });

  it("deve propagar erro quando API responder !ok (ex: overview)", async () => {
    // Arrange
    mockFetchOnce({
      ok: false,
      status: 400,
      json: { message: "Falha" },
    });

    // Act + Assert
    await expect(newsPublicApi.overview(6)).rejects.toThrow("Falha");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
