import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiPublic } from "../../lib/http";
import { newsPublicApi } from "../../lib/newsPublicApi";

vi.mock("../../lib/http", () => ({
  apiPublic: vi.fn(),
}));

type ApiPublicMock = ReturnType<typeof vi.fn>;

describe("src/lib/api/newsPublicApi.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===============================
  // CLIMA
  // ===============================

  it("climaList deve chamar endpoint correto", async () => {
    (apiPublic as unknown as ApiPublicMock).mockResolvedValueOnce({
      ok: true,
      data: [],
    });

    await newsPublicApi.climaList();

    expect(apiPublic).toHaveBeenCalledWith("/api/news/clima");
  });

  it("climaBySlug deve fazer encode do slug", async () => {
    (apiPublic as unknown as ApiPublicMock).mockResolvedValueOnce({
      ok: true,
      data: { id: 1 },
    });

    await newsPublicApi.climaBySlug("são paulo");

    expect(apiPublic).toHaveBeenCalledWith(
      "/api/news/clima/s%C3%A3o%20paulo"
    );
  });

  // ===============================
  // COTAÇÕES
  // ===============================

  it("cotacoesList sem groupKey não deve adicionar query", async () => {
    (apiPublic as unknown as ApiPublicMock).mockResolvedValueOnce({
      ok: true,
      data: [],
    });

    await newsPublicApi.cotacoesList();

    expect(apiPublic).toHaveBeenCalledWith("/api/news/cotacoes");
  });

  it("cotacoesList com groupKey deve adicionar query e encode", async () => {
    (apiPublic as unknown as ApiPublicMock).mockResolvedValueOnce({
      ok: true,
      data: [],
    });

    await newsPublicApi.cotacoesList("soja futura");

    expect(apiPublic).toHaveBeenCalledWith(
      "/api/news/cotacoes?group_key=soja%20futura"
    );
  });

  it("cotacaoBySlug deve fazer encode", async () => {
    (apiPublic as unknown as ApiPublicMock).mockResolvedValueOnce({
      ok: true,
      data: { id: 1 },
    });

    await newsPublicApi.cotacaoBySlug("milho-2025");

    expect(apiPublic).toHaveBeenCalledWith(
      "/api/news/cotacoes/milho-2025"
    );
  });

  // ===============================
  // POSTS
  // ===============================

  it("postsList deve montar query limit/offset", async () => {
    (apiPublic as unknown as ApiPublicMock).mockResolvedValueOnce({
      ok: true,
      data: [],
    });

    await newsPublicApi.postsList(20, 5);

    expect(apiPublic).toHaveBeenCalledWith(
      "/api/news/posts?limit=20&offset=5"
    );
  });

  it("postBySlug deve fazer encode", async () => {
    (apiPublic as unknown as ApiPublicMock).mockResolvedValueOnce({
      ok: true,
      data: { id: 1 },
    });

    await newsPublicApi.postBySlug("notícia especial");

    expect(apiPublic).toHaveBeenCalledWith(
      "/api/news/posts/not%C3%ADcia%20especial"
    );
  });

  // ===============================
  // OVERVIEW
  // ===============================

  it("overview deve agregar clima + cotacoes + posts corretamente", async () => {
    (apiPublic as unknown as ApiPublicMock)
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
    (apiPublic as unknown as ApiPublicMock)
      .mockResolvedValueOnce({ ok: true }) // clima sem data
      .mockResolvedValueOnce({ ok: true }) // cotacoes
      .mockResolvedValueOnce({ ok: true }); // posts

    const result = await newsPublicApi.overview();

    expect(result.data.clima).toEqual([]);
    expect(result.data.cotacoes).toEqual([]);
    expect(result.data.posts).toEqual([]);
  });
});