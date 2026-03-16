// src/__tests__/hooks/useProductPromotion.test.ts
// Cada teste usa importação dinâmica para obter um módulo limpo
// (o cache é module-level, então resetModules + reimport isola os testes).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

const mockGet = vi.fn();

// O mock do apiClient precisa ser registrado antes de qualquer import dinâmico
vi.mock("@/lib/apiClient", () => ({
  default: { get: (...args: any[]) => mockGet(...args) },
}));

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

const PROMO = { id: 1, product_id: 42, final_price: 90, original_price: 100 };

// Importa o hook com cache fresco a cada teste
async function freshHook() {
  vi.resetModules();
  // Re-registra o mock após resetModules para que o novo módulo o encontre
  vi.mock("@/lib/apiClient", () => ({
    default: { get: (...args: any[]) => mockGet(...args) },
  }));
  const mod = await import("@/hooks/useProductPromotion");
  return mod.useProductPromotion;
}

beforeEach(() => {
  mockGet.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useProductPromotion", () => {
  it("retorna loading=true inicialmente e depois a promoção", async () => {
    const useProductPromotion = await freshHook();
    mockGet.mockResolvedValueOnce(PROMO);

    const { result } = renderHook(() => useProductPromotion(42));

    expect(result.current.loading).toBe(true);
    expect(result.current.promotion).toBeNull();

    await act(async () => {
      await flushPromises();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.promotion).toEqual(PROMO);
    expect(mockGet).toHaveBeenCalledWith("/api/public/promocoes/42");
  });

  it("retorna loading=false e promotion=null quando productId é undefined", async () => {
    const useProductPromotion = await freshHook();

    const { result } = renderHook(() => useProductPromotion(undefined));
    expect(result.current.loading).toBe(false);
    expect(result.current.promotion).toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("não faz segundo fetch se cache ainda é válido (dentro do TTL)", async () => {
    const useProductPromotion = await freshHook();
    mockGet.mockResolvedValue(PROMO);

    const { result: r1 } = renderHook(() => useProductPromotion(42));
    await act(async () => { await flushPromises(); });
    expect(r1.current.promotion).toEqual(PROMO);

    // Avança 4 min (dentro do TTL de 5 min)
    vi.advanceTimersByTime(4 * 60 * 1000);

    const { result: r2 } = renderHook(() => useProductPromotion(42));
    await act(async () => { await flushPromises(); });

    expect(r2.current.promotion).toEqual(PROMO);
    // Apenas 1 chamada — segunda usou cache
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("refaz o fetch após TTL expirado (5 minutos)", async () => {
    const useProductPromotion = await freshHook();
    const PROMO_V2 = { ...PROMO, final_price: 80 };
    mockGet.mockResolvedValueOnce(PROMO).mockResolvedValueOnce(PROMO_V2);

    const { result: r1 } = renderHook(() => useProductPromotion(42));
    await act(async () => { await flushPromises(); });
    expect(r1.current.promotion).toEqual(PROMO);

    // Avança 5 min + 1ms (TTL expirado)
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    const { result: r2 } = renderHook(() => useProductPromotion(42));
    await act(async () => { await flushPromises(); });

    expect(r2.current.promotion).toEqual(PROMO_V2);
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("deduplica requests simultâneas para o mesmo id", async () => {
    const useProductPromotion = await freshHook();
    let resolve!: (v: any) => void;
    const pending = new Promise((res) => { resolve = res; });
    mockGet.mockReturnValueOnce(pending);

    const { result: r1 } = renderHook(() => useProductPromotion(42));
    const { result: r2 } = renderHook(() => useProductPromotion(42));

    await act(async () => {
      resolve(PROMO);
      await flushPromises();
    });

    expect(r1.current.promotion).toEqual(PROMO);
    expect(r2.current.promotion).toEqual(PROMO);
    // Apenas 1 request de rede
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("armazena null em cache quando o fetch falha (sem loop de retry)", async () => {
    const useProductPromotion = await freshHook();
    mockGet.mockRejectedValueOnce(new Error("404"));

    const { result } = renderHook(() => useProductPromotion(42));
    await act(async () => { await flushPromises(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.promotion).toBeNull();

    // Segunda instância também obtém null sem novo request
    const { result: r2 } = renderHook(() => useProductPromotion(42));
    await act(async () => { await flushPromises(); });

    expect(r2.current.promotion).toBeNull();
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
