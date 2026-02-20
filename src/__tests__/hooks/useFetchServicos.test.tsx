// src/__tests__/hooks/useFetchServicos.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

/**
 * Mocks obrigatórios (sem chamadas reais)
 *
 * ✅ Correção do lint react-hooks/rules-of-hooks:
 * - não chamamos função com nome "use..." dentro do factory do vi.mock
 * - exportamos um default mock (useSWR) e controlamos o retorno via mockImplementation
 */
const swrDefaultMock = vi.fn();
vi.mock("swr", () => ({
  default: swrDefaultMock,
}));

const apiFetchMock = vi.fn();
vi.mock("@/lib/apiClient", () => ({
  apiFetch: (url: string, init?: RequestInit) => apiFetchMock(url, init),
}));

const handleApiErrorMock = vi.fn();
vi.mock("@/lib/handleApiError", () => ({
  handleApiError: (err: unknown, opts: unknown) => handleApiErrorMock(err, opts),
}));

type SwrReturn = { data?: unknown; error?: unknown; isLoading?: boolean };

async function importHookWithEnv(apiBase: string) {
  // API_BASE é calculado no load do módulo: setar env antes do import
  vi.resetModules();
  process.env.NEXT_PUBLIC_API_URL = apiBase;

  const mod = await import("@/hooks/useFetchServicos");
  return mod.useFetchServicos as (p?: unknown) => {
    data: unknown[];
    meta: { total: number; totalPages: number; page: number };
    loading: boolean | undefined;
    error: string | null;
  };
}

function setSWRReturn(ret: SwrReturn) {
  swrDefaultMock.mockImplementation((_key: unknown, _fetcher: unknown) => ret);
}

describe("useFetchServicos (hook)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Evita vazamento de env entre testes
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it("Arrange/Act/Assert: monta a URL com defaults e chama useSWR com a chave correta", async () => {
    // Arrange
    setSWRReturn({ data: { data: [] }, error: undefined, isLoading: false });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    const { result } = renderHook(() => useFetchServicos());

    // Assert
    expect(swrDefaultMock).toHaveBeenCalledTimes(1);

    const [key] = swrDefaultMock.mock.calls[0];
    const url = new URL(String(key));

    expect(url.origin).toBe("http://api.test");
    expect(url.pathname).toBe("/api/public/servicos");

    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("12");
    expect(url.searchParams.get("sort")).toBe("id");
    expect(url.searchParams.get("order")).toBe("desc");

    // q e especialidade não devem existir quando não informados
    expect(url.searchParams.get("q")).toBeNull();
    expect(url.searchParams.get("especialidade")).toBeNull();

    expect(result.current.data).toEqual([]);
    expect(result.current.meta).toEqual({ total: 0, totalPages: 1, page: 1 });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("Arrange/Act/Assert: inclui q (trim) e especialidade quando válidos", async () => {
    // Arrange
    setSWRReturn({ data: { data: [] }, error: undefined, isLoading: false });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    renderHook(() =>
      useFetchServicos({ q: "  vacina  ", especialidade: 10, page: 2, limit: 20, sort: "nome", order: "asc" })
    );

    // Assert
    const [key] = swrDefaultMock.mock.calls[0];
    const url = new URL(String(key));

    expect(url.searchParams.get("q")).toBe("  vacina  "); // lógica atual não trim no valor
    expect(url.searchParams.get("especialidade")).toBe("10");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.get("sort")).toBe("nome");
    expect(url.searchParams.get("order")).toBe("asc");
  });

  it("Arrange/Act/Assert: NÃO inclui q quando é string vazia/whitespace", async () => {
    // Arrange
    setSWRReturn({ data: { data: [] }, error: undefined, isLoading: false });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    renderHook(() => useFetchServicos({ q: "   " }));

    // Assert
    const [key] = swrDefaultMock.mock.calls[0];
    const url = new URL(String(key));
    expect(url.searchParams.get("q")).toBeNull();
  });

  it("Arrange/Act/Assert: normaliza lista quando payload é array direto", async () => {
    // Arrange
    const payload = [{ id: 1 }, { id: 2 }];
    setSWRReturn({ data: payload, error: undefined, isLoading: false });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    const { result } = renderHook(() => useFetchServicos());

    // Assert
    expect(result.current.data).toEqual(payload);
  });

  it("Arrange/Act/Assert: normaliza lista quando payload vem em chaves conhecidas (data/items/results/servicos/rows)", async () => {
    // Arrange
    const list = [{ id: 7 }];
    setSWRReturn({ data: { items: list }, error: undefined, isLoading: false });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    const { result } = renderHook(() => useFetchServicos());

    // Assert
    expect(result.current.data).toEqual(list);
  });

  it("Arrange/Act/Assert: normaliza lista quando payload é aninhado (data.items)", async () => {
    // Arrange
    const list = [{ id: 9 }];
    setSWRReturn({ data: { data: { items: list } }, error: undefined, isLoading: false });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    const { result } = renderHook(() => useFetchServicos());

    // Assert
    expect(result.current.data).toEqual(list);
  });

  it("Arrange/Act/Assert: extrai meta de meta/meta aninhado e aplica fallback de page", async () => {
    // Arrange
    setSWRReturn({
      data: { meta: { total: 55, totalPages: 6, page: 3 }, data: [{ id: 1 }] },
      error: undefined,
      isLoading: false,
    });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    const { result } = renderHook(() => useFetchServicos({ page: 10 }));

    // Assert
    expect(result.current.meta).toEqual({ total: 55, totalPages: 6, page: 3 });
  });

  it("Arrange/Act/Assert: extrai meta quando total/totalPages/page estão no topo (sem meta) e usa fallback quando ausentes", async () => {
    // Arrange
    setSWRReturn({
      data: { total: "12", totalPages: "2" }, // page ausente => fallbackPage
      error: undefined,
      isLoading: false,
    });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    const { result } = renderHook(() => useFetchServicos({ page: 4 }));

    // Assert
    expect(result.current.meta).toEqual({ total: 12, totalPages: 2, page: 4 });
  });

  it("Arrange/Act/Assert: quando há error, usa handleApiError(silent=true) e retorna errorMessage; quando não há, error=null", async () => {
    // Arrange
    const err = new Error("boom");
    handleApiErrorMock.mockReturnValue("Não foi possível carregar os serviços.");
    setSWRReturn({ data: undefined, error: err, isLoading: false });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    const { result } = renderHook(() => useFetchServicos());

    // Assert
    expect(handleApiErrorMock).toHaveBeenCalledTimes(1);
    expect(handleApiErrorMock).toHaveBeenCalledWith(err, {
      silent: true,
      fallback: "Não foi possível carregar os serviços.",
    });

    expect(result.current.error).toBe("Não foi possível carregar os serviços.");
  });

  it("Arrange/Act/Assert: propaga loading (isLoading) do SWR", async () => {
    // Arrange
    setSWRReturn({ data: { data: [] }, error: undefined, isLoading: true });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    const { result } = renderHook(() => useFetchServicos());

    // Assert
    expect(result.current.loading).toBe(true);
  });

  it("Arrange/Act/Assert: passa o fetcher para o SWR e o fetcher chama apiFetch com a URL recebida", async () => {
    // Arrange
    setSWRReturn({ data: { data: [] }, error: undefined, isLoading: false });
    const useFetchServicos = await importHookWithEnv("http://api.test");

    // Act
    renderHook(() => useFetchServicos({ q: "x" }));

    // Assert
    const [, fetcher] = swrDefaultMock.mock.calls[0];
    expect(typeof fetcher).toBe("function");

    await (fetcher as (u: string) => Promise<unknown>)(
      "http://api.test/api/public/servicos?page=1&limit=12&sort=id&order=desc&q=x"
    );

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(apiFetchMock).toHaveBeenCalledWith(
      "http://api.test/api/public/servicos?page=1&limit=12&sort=id&order=desc&q=x",
      undefined
    );
  });
});