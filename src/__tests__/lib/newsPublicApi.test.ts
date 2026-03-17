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

  it("overview deve agregar clima + cotacoes + posts corretamente", async () => {
    mockGet
      .mockResolvedValueOnce({ ok: true, data: [{ id: 1 }] }) // clima
      .mockResolvedValueOnce({ ok: true, data: [{ id: 2 }] }) // cotacoes
      .mockResolvedValueOnce({ ok: true, data: [{ id: 3 }] }); // posts

    const result = await newsPublicApi.overview(6, "soja");

    expect(result).toEqual({
      ok: true,
      data: {
        clima: [{ id: 1 }],
        cotacoes: [{ id: 2 }],
        posts: [{ id: 3 }],
      },
      meta: {
        postsLimit: 6,
        groupKey: "soja",
      },
    });
  });

  it("overview deve tratar data undefined como []", async () => {
    mockGet
      .mockResolvedValueOnce({ ok: true }) // clima sem data
      .mockResolvedValueOnce({ ok: true }) // cotacoes
      .mockResolvedValueOnce({ ok: true }); // posts

    const result = await newsPublicApi.overview();

    expect(result.data.clima).toEqual([]);
    expect(result.data.cotacoes).toEqual([]);
    expect(result.data.posts).toEqual([]);
  });
});
