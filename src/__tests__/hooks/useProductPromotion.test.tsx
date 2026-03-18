// src/__tests__/hooks/useProductPromotion.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import * as swrModule from "swr";
import type { Cache } from "swr";
import { useProductPromotion } from "@/hooks/useProductPromotion";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

const mockGet = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: any[]) => mockGet(...args),
  },
}));

// Wrap useSWR in a vi.fn so we can inspect how the hook configures it.
// The wrapper passes through to the real implementation so all other tests
// continue to exercise SWR's actual behaviour.
vi.mock("swr", async (importActual) => {
  const mod = await importActual<typeof import("swr")>();
  const wrapped = vi.fn(
    (...args: Parameters<typeof mod.default>) => mod.default(...args),
  );
  Object.assign(wrapped, mod.default); // preserve .mutate, .preload, etc.
  return { ...mod, default: wrapped };
});

const PROMO = { id: 1, product_id: 42, final_price: 90, original_price: 100 };

// Shared cache: each test gets a fresh Map (reset in beforeEach), but both
// renderHook calls within the same test share the same Map so that SWR's
// dedupingInterval / TTL logic can see timestamps written by the first mount.
let sharedCache: Cache<any>;

const { SWRConfig } = swrModule;

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SWRConfig
        value={{
          provider: () => sharedCache,
          dedupingInterval: 0,
          revalidateOnFocus: false,
          shouldRetryOnError: false,
        }}
      >
        {children}
      </SWRConfig>
    );
  };
}

beforeEach(() => {
  sharedCache = new Map() as Cache<any>;
  mockGet.mockReset();
  vi.mocked(swrModule.default).mockClear();
  vi.useRealTimers();
});

describe("useProductPromotion", () => {
  it("retorna loading=true inicialmente e depois a promoção", async () => {
    mockGet.mockResolvedValueOnce(PROMO);

    const { result } = renderHook(() => useProductPromotion(42), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.promotion).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.promotion).toEqual(PROMO);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith("/api/public/promocoes/42");
  });

  it("retorna loading=false e promotion=null quando productId é undefined", () => {
    const { result } = renderHook(() => useProductPromotion(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.promotion).toBeNull();
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("configura o SWR com dedupingInterval de 5 min, sem retry e sem revalidação ao focar", () => {
    // Verifica que o hook repassa as opções certas ao useSWR — o comportamento
    // de cache/TTL em si é responsabilidade do SWR, não do hook.
    mockGet.mockResolvedValueOnce(PROMO);

    renderHook(() => useProductPromotion(42), { wrapper: createWrapper() });

    expect(vi.mocked(swrModule.default)).toHaveBeenCalledWith(
      "/api/public/promocoes/42",
      expect.any(Function),
      {
        dedupingInterval: 5 * 60 * 1000,
        shouldRetryOnError: false,
        revalidateOnFocus: false,
      },
    );
  });

  it("deduplica requests simultâneas para o mesmo id", async () => {
    let resolvePromise!: (value: any) => void;

    const pending = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    mockGet.mockReturnValueOnce(pending);

    // Both hooks must live in the same React tree (same SWRConfig provider) so
    // that SWR can deduplicate the in-flight request for the same key.
    const { result } = renderHook(
      () => ({
        r1: useProductPromotion(42),
        r2: useProductPromotion(42),
      }),
      { wrapper: createWrapper() },
    );

    expect(result.current.r1.loading).toBe(true);
    expect(result.current.r2.loading).toBe(true);

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    resolvePromise(PROMO);

    await waitFor(() => {
      expect(result.current.r1.loading).toBe(false);
      expect(result.current.r2.loading).toBe(false);
    });

    expect(result.current.r1.promotion).toEqual(PROMO);
    expect(result.current.r2.promotion).toEqual(PROMO);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it("retorna null quando o fetch falha e não entra em retry loop", async () => {
    mockGet.mockRejectedValueOnce(new Error("404"));

    const { result } = renderHook(() => useProductPromotion(42), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.promotion).toBeNull();
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
