import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  is_active?: 0 | 1 | boolean;
  sort_order?: number;
};

async function importModule() {
  return import("@/server/data/categories");
}

describe("fetchPublicCategories (src/server/data/categories.ts)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(process, "env", {
      value: { ...ORIGINAL_ENV },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // @ts-expect-error
    delete global.fetch;
    Object.defineProperty(process, "env", {
      value: ORIGINAL_ENV,
      writable: true,
      configurable: true,
    });
  });

  it("positivo: sucesso no primeiro endpoint, filtra inativas e ordena por sort_order e nome", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, API_BASE: "http://api.test", NODE_ENV: "test" },
      writable: true,
    });
    vi.resetModules();

    const payload: any[] = [
      { id: 1, name: "Zebra", slug: "zebra", is_active: 1, sort_order: 2 },
      { id: 2, name: "Abelha", slug: "abelha", is_active: true, sort_order: 2 },
      { id: 3, name: "Inativa", slug: "inativa", is_active: 0, sort_order: 1 },
      { id: 4, name: "Alpha", slug: "alpha", sort_order: 1 }, // is_active undefined => passa
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(payload),
      text: vi.fn(),
    }) as any;

    const { fetchPublicCategories } = await importModule();

    // Act
    const result = await fetchPublicCategories();

    // Assert
    expect(result.map((c: any) => c.id)).toEqual([4, 2, 1]); // sort_order 1: Alpha; sort_order 2: Abelha, Zebra
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const [calledUrl, calledOpts] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).toBe("http://api.test/api/public/categorias");
    expect(calledOpts).toEqual(
      expect.objectContaining({
        next: { revalidate: 60 },
        headers: { Accept: "application/json" },
      })
    );
  });

  it("positivo: fallback de rota: primeira falha (res.ok=false) e segunda funciona", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, NEXT_PUBLIC_API_URL: "http://api.test", NODE_ENV: "test" },
      writable: true,
    });
    vi.resetModules();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue("Not Found"),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          categories: [{ id: 10, name: "Ativa", slug: "ativa", is_active: 1, sort_order: 0 }],
        }),
        text: vi.fn(),
      });

    global.fetch = fetchMock as any;

    const { fetchPublicCategories } = await importModule();

    // Act
    const result = await fetchPublicCategories();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ id: 10, name: "Ativa", slug: "ativa" }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/public/categorias");
    expect(fetchMock.mock.calls[1][0]).toBe("http://api.test/api/categorias");
  });

  it("positivo: aceita payload em data[] quando API responde { data: [...] }", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, NEXT_PUBLIC_API_BASE: "http://api.test", NODE_ENV: "test" },
      writable: true,
    });
    vi.resetModules();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        data: [
          { id: 1, name: "A", slug: "a", is_active: 1, sort_order: 0 },
          { id: 2, name: "B", slug: "b", is_active: 0, sort_order: 0 },
        ],
      }),
      text: vi.fn(),
    }) as any;

    const { fetchPublicCategories } = await importModule();

    // Act
    const result = await fetchPublicCategories();

    // Assert
    expect(result.map((c: any) => c.id)).toEqual([1]);
  });

  it("negativo: todas as rotas falham e NODE_ENV !== production => lança erro", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, NEXT_PUBLIC_API_URL: "http://api.test", NODE_ENV: "test" },
      writable: true,
    });
    vi.resetModules();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("boom"),
    });
    global.fetch = fetchMock as any;

    const { fetchPublicCategories } = await importModule();

    // Act + Assert
    await expect(fetchPublicCategories()).rejects.toThrow(/Erro ao carregar categorias \(500\):/);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("negativo: todas as rotas falham e NODE_ENV === production => retorna []", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, NEXT_PUBLIC_API_URL: "http://api.test", NODE_ENV: "production" },
      writable: true,
    });
    vi.resetModules();

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("boom"),
    });
    global.fetch = fetchMock as any;

    const { fetchPublicCategories } = await importModule();

    // Act
    const result = await fetchPublicCategories();

    // Assert
    expect(result).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("negativo: res.ok=false e res.text() falha -> cobre res.text().catch (linhas 26–27)", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, API_BASE: "http://api.test", NODE_ENV: "test" },
      writable: true,
    });
    vi.resetModules();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockRejectedValue(new Error("text-fail")),
    }) as any;

    const { fetchPublicCategories } = await importModule();

    // Act + Assert
    await expect(fetchPublicCategories()).rejects.toThrow(
      /Erro ao carregar categorias \(400\):/
    );
  });

  it("negativo: lastErr não-Error -> lança new Error('Falha ao buscar categorias.') (linha 79)", async () => {
    // Arrange
    Object.defineProperty(process, "env", {
      value: { ...process.env, API_BASE: "http://api.test", NODE_ENV: "test" },
      writable: true,
    });
    vi.resetModules();

    // Faz o fetch "rejeitar" com string (não Error) => lastErr vira string
    global.fetch = vi.fn().mockRejectedValue("boom-string") as any;

    const { fetchPublicCategories } = await importModule();

    // Act + Assert
    await expect(fetchPublicCategories()).rejects.toThrow("Falha ao buscar categorias.");
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });
});
