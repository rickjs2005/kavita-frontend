// src/hooks/useProductPromotion.ts
// SWR handles cache, deduplication and TTL natively — no manual _cache/_inflight needed.
import useSWR from "swr";
import apiClient from "@/lib/apiClient";
import type { ProductPromotion } from "@/types/product";

export type { ProductPromotion };

/** TTL de 5 minutos — promoções expiradas não ficam presas em cache. */
const PROMO_TTL_MS = 5 * 60 * 1000;

const fetcher = async (url: string): Promise<ProductPromotion | null> => {
  try {
    return await apiClient.get<ProductPromotion>(url);
  } catch {
    // 404 ou erro: sem promoção para este produto
    return null;
  }
};

export function useProductPromotion(productId?: number) {
  const { data, isLoading } = useSWR(
    productId != null ? `/api/public/promocoes/${productId}` : null,
    fetcher,
    {
      dedupingInterval: PROMO_TTL_MS,
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  );

  return { promotion: data ?? null, loading: isLoading };
}
