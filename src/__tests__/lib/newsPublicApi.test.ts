import { describe, it, expect, vi, beforeEach } from "vitest";
import { newsPublicApi } from "../../lib/newsPublicApi";

const mockGet = vi.fn();

vi.mock("../../lib/apiClient", () => ({
  default: { get: (...args: any[]) => mockGet(...args) },
}));

describe("src/lib/api/newsPublicApi.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===============================
  // CLIMA
  // ===============================

  it("climaList deve chamar endpoint correto", async () => {
    mockGet.mockResolvedValueOnce({ ok: true, data: [] });

    await newsPublicApi.climaList();

    expect(mockGet).toHaveBeenCalledWith("/api/news/clima");
  });

  it("climaBySlug deve fazer encode do slug", async () => {
    mockGet.mockResolvedValueOnce({ ok: true, data: { id: 1 } });

    await newsPublicApi.climaBySlug("são paulo");

    expect(mockGet).toHaveBeenCalledWith("/api/news/clima/s%C3%A3o%20paulo");
  });

  // ===============================
  // COTAÇÕES
  // ===============================

  it("cotacoesList sem groupKey não deve adicionar query", async () => {
    mockGet.mockResolvedValueOnce({ ok: true, data: [] });

    await newsPublicApi.cotacoesList();

    expect(mockGet).toHaveBeenCalledWith("/api/news/cotacoes");
  });

  it("cotacoesList com groupKey deve adicionar query e encode", async () => {
    mockGet.mockResolvedValueOnce({ ok: true, data: [] });

    await newsPublicApi.cotacoesList("soja futura");

    expect(mockGet).toHaveBeenCalledWith(
      "/api/news/cotacoes?group_key=soja%20futura",
    );
  });

  it("cotacaoBySlug deve fazer encode", async () => {
    mockGet.mockResolvedValueOnce({ ok: true, data: { id: 1 } });

    await newsPublicApi.cotacaoBySlug("milho-2025");

    expect(mockGet).toHaveBeenCalledWith("/api/news/cotacoes/milho-2025");
  });

  // ===============================
  // POSTS
  // ===============================

  it("postsList deve montar query limit/offset", async () => {
    mockGet.mockResolvedValueOnce({ ok: true, data: [] });

    await newsPublicApi.postsList(20, 5);

    expect(mockGet).toHaveBeenCalledWith("/api/news/posts?limit=20&offset=5");
  });

  it("postBySlug deve fazer encode", async () => {
    mockGet.mockResolvedValueOnce({ ok: true, data: { id: 1 } });

    await newsPublicApi.postBySlug("notícia especial");

    expect(mockGet).toHaveBeenCalledWith(
      "/api/news/posts/not%C3%ADcia%20especial",
    );
  });

  // ===============================
  // OVERVIEW
  // ===============================

  // O apiClient passou a desempacotar automaticamente o envelope
  // `{ ok: true, data: ... }` — ver `apiRequest` em src/lib/apiClient.ts.
  // Por isso o mock devolve direto o que o service consome (array).
  // E o `overview` retorna PublicOverview puro (sem envelope) — os
  // metadados foram removidos quando o service estabilizou.

  it("overview deve agregar clima + cotacoes + posts corretamente", async () => {
    mockGet
      .mockResolvedValueOnce([{ id: 1 }]) // clima (ja unwrapped)
      .mockResolvedValueOnce([{ id: 2 }]) // cotacoes
      .mockResolvedValueOnce([{ id: 3 }]); // posts

    const result = await newsPublicApi.overview(6, "soja");

    expect(result).toEqual({
      clima: [{ id: 1 }],
      cotacoes: [{ id: 2 }],
      posts: [{ id: 3 }],
    });
  });

  it("overview deve tratar resposta nao-array como []", async () => {
    // Quando o backend retorna algo que nao e array (envelope antigo,
    // erro silencioso, etc.), os helpers caem para [] — defesa em
    // profundidade contra regressao no contrato.
    mockGet
      .mockResolvedValueOnce(null) // clima
      .mockResolvedValueOnce(undefined) // cotacoes
      .mockResolvedValueOnce({ unexpected: "shape" }); // posts

    const result = await newsPublicApi.overview();

    expect(result.clima).toEqual([]);
    expect(result.cotacoes).toEqual([]);
    expect(result.posts).toEqual([]);
  });
});
