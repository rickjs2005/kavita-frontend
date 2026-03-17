"use client";

import useSWR from "swr";
import type { Product } from "@/types/product";
export type { Product } from "@/types/product";

import { getProducts, type GetProductsParams } from "@/services/products";

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

type SWRKey = [
  tag: string,
  category: string | undefined,
  subcategory: string | undefined,
  search: number | string | undefined,
  page: number | undefined,
  limit: number | undefined,
  sort: string | undefined,
  order: string | undefined,
];

const fetcher = ([, category, subcategory, search, page, limit, sort, order]: SWRKey) =>
  getProducts({ category, subcategory, search, page, limit, sort, order } as GetProductsParams);

function pickList(res: unknown): Product[] {
  const list = (res as any)?.products ?? (res as any)?.data ?? (res as any)?.items ?? res;
  return Array.isArray(list) ? (list as Product[]) : [];
}

export function useFetchProducts(opts: Opts = {}) {
  const {
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

  const key: SWRKey | null = enabled
    ? ["useFetchProducts", effectiveCategory, subcategory, search, page, limit, sort, order]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  });

  const list = pickList(data);

  return {
    data: list,
    products: list, // alias para não quebrar código antigo
    loading: isLoading,
    error: (error as any)?.message ?? (typeof error === "string" ? error : null),
    refetch: () => mutate(),
  };
}
