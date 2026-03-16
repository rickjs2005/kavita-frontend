// src/hooks/useProductPromotion.ts
// Cache em memória compartilhado entre todas as instâncias do hook.
// Múltiplos ProductCards pedindo o mesmo id fazem apenas 1 requisição.
// TTL de 5 minutos: promoções expiradas não ficam presas em cache.
import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

export type ProductPromotion = {
  id: number;
  product_id?: number;
  title?: string | null;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  promo_price?: number | string | null;
  ends_at?: string | null;
};

/** TTL de 5 minutos para entradas de promoção em cache. */
const CACHE_TTL_MS = 5 * 60 * 1000;

type CacheEntry = { value: ProductPromotion | null; fetchedAt: number };

// Cache compartilhado no módulo — persiste durante a sessão do browser
const _cache = new Map<number, CacheEntry>();
const _inflight = new Map<number, Promise<ProductPromotion | null>>();

function getCached(productId: number): { hit: true; value: ProductPromotion | null } | { hit: false } {
  const entry = _cache.get(productId);
  if (!entry) return { hit: false };
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    _cache.delete(productId);
    return { hit: false };
  }
  return { hit: true, value: entry.value };
}

async function fetchPromotion(productId: number): Promise<ProductPromotion | null> {
  const cached = getCached(productId);
  if (cached.hit) return cached.value;

  if (_inflight.has(productId)) return _inflight.get(productId)!;

  const promise = (async () => {
    try {
      const data = await apiClient.get<ProductPromotion>(
        `/api/public/promocoes/${productId}`,
      );
      _cache.set(productId, { value: data, fetchedAt: Date.now() });
      return data;
    } catch {
      _cache.set(productId, { value: null, fetchedAt: Date.now() });
      return null;
    } finally {
      _inflight.delete(productId);
    }
  })();

  _inflight.set(productId, promise);
  return promise;
}

export function useProductPromotion(productId?: number) {
  const cached = productId != null ? getCached(productId) : { hit: false as const };

  const [promotion, setPromotion] = useState<ProductPromotion | null>(
    cached.hit ? cached.value : null,
  );
  const [loading, setLoading] = useState(
    productId != null && !cached.hit,
  );

  useEffect(() => {
    if (productId == null) return;

    // verifica cache com TTL (pode ter expirado desde o render inicial)
    const hit = getCached(productId);
    if (hit.hit) {
      setPromotion(hit.value);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchPromotion(productId).then((promo) => {
      if (!cancelled) {
        setPromotion(promo);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return { promotion, loading };
}
