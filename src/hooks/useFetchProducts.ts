"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types/product";
export type { Product } from "@/types/product";

import { getProducts, type GetProductsParams } from "@/services/products";
import { handleApiError } from "@/lib/handleApiError";

/**
 * Opções do hook.
 * - Mantém compatibilidade com a versão antiga via `categorySlug`.
 * - `enabled` permite pausar o fetch (útil para páginas que ainda não têm categoria definida).
 */
type Opts = GetProductsParams & {
  categorySlug?: string; // compatível com versão antiga
  enabled?: boolean;
  search?: number | string;
};

export function useFetchProducts(opts: Opts = {}) {
  const {
    // compatibilidade: alguns lugares ainda passam categorySlug
    category,
    categorySlug,
    subcategory,
    search,
    page,
    limit,
    sort,
    order,
    enabled = true,
  } = opts;

  const effectiveCategory = category ?? categorySlug;

  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mantém a lógica atual de refetch via incremento em ref + rerender por setLoading(true)
  const trigger = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    let alive = true;
    setLoading(true);
    setError(null);

    async function run() {
      try {
        const res = await getProducts({
          category: effectiveCategory,
          subcategory,
          search,
          page,
          limit,
          sort,
          order,
        } as GetProductsParams);

        // getProducts pode retornar:
        // - array direto
        // - { products: [...] }
        // - { data: [...] }
        const list: unknown = (res as any)?.products ?? (res as any)?.data ?? res;

        if (alive) {
          setData(Array.isArray(list) ? (list as Product[]) : []);
        }
      } catch (e) {
        const ui = handleApiError(e, {
          silent: true,
          fallback: "Não foi possível carregar os produtos.",
        });

        // handleApiError pode retornar objeto (UiError) ou string.
        // Normalizamos para string para manter error: string | null
        const msg =
          typeof ui === "string"
            ? ui
            : (ui as any)?.message ??
              (ui as any)?.fallback ??
              "Não foi possível carregar os produtos.";

        if (alive) setError(msg);
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

  // `products` é alias para não quebrar código antigo
  return { data, products: data, loading, error, refetch };
}
