// src/hooks/useProductPromotion.ts
// Cache em memória compartilhado entre todas as instâncias do hook.
// Múltiplos ProductCards pedindo o mesmo id fazem apenas 1 requisição.
import { useEffect, useState } from "react";
import { API_BASE } from "@/utils/absUrl";

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

// Cache compartilhado no módulo — persiste durante a sessão do browser
const _cache = new Map<number, ProductPromotion | null>();
const _inflight = new Map<number, Promise<ProductPromotion | null>>();

async function fetchPromotion(productId: number): Promise<ProductPromotion | null> {
  if (_cache.has(productId)) return _cache.get(productId)!;

  if (_inflight.has(productId)) return _inflight.get(productId)!;

  const promise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/public/promocoes/${productId}`, {
        cache: "default",
      });
      if (!res.ok) {
        _cache.set(productId, null);
        return null;
      }
      const data: ProductPromotion = await res.json();
      _cache.set(productId, data);
      return data;
    } catch {
      _cache.set(productId, null);
      return null;
    } finally {
      _inflight.delete(productId);
    }
  })();

  _inflight.set(productId, promise);
  return promise;
}

export function useProductPromotion(productId?: number) {
  const [promotion, setPromotion] = useState<ProductPromotion | null>(
    productId != null && _cache.has(productId)
      ? _cache.get(productId)!
      : null,
  );
  const [loading, setLoading] = useState(
    productId != null && !_cache.has(productId),
  );

  useEffect(() => {
    if (productId == null) return;

    // já está em cache — não faz nada
    if (_cache.has(productId)) {
      setPromotion(_cache.get(productId)!);
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
