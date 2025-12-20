import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

/**
 * ============================
 * Mocks obrigatórios
 * ============================
 */

const getProductsMock = vi.fn();
vi.mock("@/services/products", () => ({
  getProducts: (params: any) => getProductsMock(params),
}));

const handleApiErrorMock = vi.fn();
vi.mock("@/lib/handleApiError", () => ({
  handleApiError: (err: any, opts: any) => handleApiErrorMock(err, opts),
}));

// Padrão fixo (mesmo que não use aqui)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("useFetchProducts (hook)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AAA: chama getProducts com params derivados e retorna data/meta; loading desliga no sucesso", async () => {
    // Arrange
    const apiResponse = {
      data: [{ id: 1, name: "Produto 1" }],
      meta: { total: 1, totalPages: 1, page: 1 },
    };

    getProductsMock.mockResolvedValueOnce(apiResponse);

    const { useFetchProducts } = await import("@/hooks/useFetchProducts");

    // Act
    const { result } = renderHook(() =>
      useFetchProducts({
        category: "medicamentos",
        subcategory: "bovinos",
        search: "vacina",
        page: 2,
        limit: 24,
        sort: "id",
        order: "desc",
      } as any)
    );

    await act(async () => {
      await flushPromises();
    });

    // Assert
    expect(getProductsMock).toHaveBeenCalledTimes(1);
    const calledParams = getProductsMock.mock.calls[0][0];

    // Verifica os campos mais importantes (estável, sem depender de implementação exata)
    expect(calledParams).toMatchObject({
      category: "medicamentos",
      subcategory: "bovinos",
      search: "vacina",
      page: 2,
      limit: 24,
      sort: "id",
      order: "desc",
    });

    // Estado final
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    // Seu hook retorna { data, loading, error, refetch }
    // data pode ser array direto ou um objeto; aqui validamos ser o array final exposto pelo hook:
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.data).toHaveLength(1);
  });

  it("AAA: suporta compatibilidade com categorySlug (quando category não é passado)", async () => {
    // Arrange
    getProductsMock.mockResolvedValueOnce({ data: [], meta: { total: 0, totalPages: 1, page: 1 } });

    const { useFetchProducts } = await import("@/hooks/useFetchProducts");

    // Act
    renderHook(() =>
      useFetchProducts({
        categorySlug: "pets",
        page: 1,
        limit: 12,
      } as any)
    );

    await act(async () => {
      await flushPromises();
    });

    // Assert
    expect(getProductsMock).toHaveBeenCalledTimes(1);
    const calledParams = getProductsMock.mock.calls[0][0];

    // A regra esperada: effectiveCategory = category ?? categorySlug
    // Se sua implementação usa outro nome no service (ex: categorySlug em vez de category),
    // me mande o arquivo completo do hook e eu ajusto o assert.
    expect(calledParams).toMatchObject({
      category: "pets",
      page: 1,
      limit: 12,
    });
  });

  it("AAA: quando enabled=false, não chama getProducts e mantém estado estável", async () => {
    // Arrange
    const { useFetchProducts } = await import("@/hooks/useFetchProducts");

    // Act
    const { result } = renderHook(() =>
      useFetchProducts({
        enabled: false,
        category: "medicamentos",
        page: 1,
      } as any)
    );

    await act(async () => {
      await flushPromises();
    });

    // Assert
    expect(getProductsMock).not.toHaveBeenCalled();

    // O hook pode iniciar loading como false quando disabled.
    // Validamos o que é estável: não executou fetch e data é array.
    expect(Array.isArray(result.current.data)).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("AAA: erro no getProducts -> chama handleApiError e seta error; loading desliga", async () => {
    // Arrange
    const err = new Error("boom");
    getProductsMock.mockRejectedValueOnce(err);

    handleApiErrorMock.mockReturnValue("Não foi possível carregar produtos.");

    const { useFetchProducts } = await import("@/hooks/useFetchProducts");

    // Act
    const { result } = renderHook(() =>
      useFetchProducts({
        category: "medicamentos",
        page: 1,
      } as any)
    );

    await act(async () => {
      await flushPromises();
    });

    // Assert
    expect(getProductsMock).toHaveBeenCalledTimes(1);
    expect(handleApiErrorMock).toHaveBeenCalledTimes(1);

    // O hook normalmente passa fallback; se você usa silent:true também, o teste continua ok
    const [calledErr, calledOpts] = handleApiErrorMock.mock.calls[0];
    expect(calledErr).toBe(err);
    expect(calledOpts).toMatchObject({
      fallback: expect.any(String),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Não foi possível carregar produtos.");
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it("AAA: refetch incrementa gatilho e chama getProducts novamente", async () => {
    // Arrange
    getProductsMock
      .mockResolvedValueOnce({ data: [{ id: 1 }], meta: { total: 1, totalPages: 1, page: 1 } })
      .mockResolvedValueOnce({ data: [{ id: 2 }], meta: { total: 1, totalPages: 1, page: 1 } });

    const { useFetchProducts } = await import("@/hooks/useFetchProducts");

    // Act
    const { result } = renderHook(() =>
      useFetchProducts({
        category: "medicamentos",
        page: 1,
        limit: 12,
      } as any)
    );

    await act(async () => {
      await flushPromises();
    });

    expect(getProductsMock).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(expect.arrayContaining([{ id: 1 }]));

    // Act: refetch
    await act(async () => {
      result.current.refetch();
      await flushPromises();
    });

    // Assert
    expect(getProductsMock).toHaveBeenCalledTimes(2);
    expect(result.current.data).toEqual(expect.arrayContaining([{ id: 2 }]));
    expect(result.current.error).toBeNull();
  });
});
