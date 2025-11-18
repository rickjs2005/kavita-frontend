"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types/product";
export type { Product } from "@/types/product";

import { getProducts, type GetProductsParams } from "@/services/products";

type Opts = GetProductsParams & {
  categorySlug?: string; // compatível com versão antiga
  enabled?: boolean;
};

export function useFetchProducts(opts: Opts = {}) {
  const {
    category,
    categorySlug,
    subcategory,
    search,
    page = 1,
    limit = 12,
    sort = "id",
    order = "desc",
    enabled = true,
  } = opts;

  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const trigger = useRef(0);

  // prioridade: categorySlug (antigo) > category (novo)
  const effectiveCategory = categorySlug ?? category;

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    setLoading(true);
    setError(null);

    async function run() {
      try {
        const list = await getProducts({
          category: effectiveCategory,
          subcategory,
          search,
          page,
          limit,
          sort,
          order,
        });

        if (alive) setData(list);
      } catch (e: any) {
        if (alive) {
          setError(e?.message || "Erro ao buscar produtos");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    effectiveCategory,
    subcategory,
    search,
    page,
    limit,
    sort,
    order,
    enabled,
    trigger.current,
  ]);

  const refetch = () => {
    trigger.current += 1;
    setLoading(true);
  };

  return { data, loading, error, refetch };
}
