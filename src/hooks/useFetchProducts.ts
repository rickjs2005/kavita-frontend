"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/types/product";
export type { Product } from "@/types/product";

type Opts = {
  categorySlug?: string;      // ex.: "medicamentos"
  subcategory?: string;       // opcional (third_category)
  search?: string;
  page?: number;
  limit?: number;
  sort?: "id" | "name" | "price" | "quantity";
  order?: "asc" | "desc";
  enabled?: boolean;
};

const API_ROOT =
  (process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:5000");
const API_BASE = `${API_ROOT}/api`;
const PATH_PRODUCTS = "/products";

function normalizeCategory(input?: string) {
  if (!input) return undefined;
  return String(input).trim().toLowerCase(); // evita 404 por capitalização
}

export function useFetchProducts(opts: Opts = {}) {
  const {
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

  const categoryForDB = useMemo(
    () => normalizeCategory(categorySlug),
    [categorySlug]
  );

  const url = useMemo(() => {
    const u = new URL(API_BASE + PATH_PRODUCTS);
    if (categoryForDB) u.searchParams.set("category", categoryForDB);
    if (subcategory)  u.searchParams.set("third_category", subcategory);
    if (search)       u.searchParams.set("search", search);
    u.searchParams.set("page", String(page));
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("sort", String(sort));
    u.searchParams.set("order", String(order));
    return u.toString();
  }, [categoryForDB, subcategory, search, page, limit, sort, order]);

  useEffect(() => {
    if (!enabled) return;

    const ctrl = new AbortController();
    let alive = true;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `HTTP ${res.status}`);
        }
        const payload = await res.json();

        // ✅ Suporta resposta paginada { data: Product[] } OU array Product[]
        const list: Product[] = Array.isArray(payload) ? payload : (payload?.data ?? []);
        if (alive) setData(list);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        if (alive) setError(e?.message || "Erro ao buscar produtos");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => { alive = false; ctrl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, enabled, trigger.current]);

  const refetch = () => { trigger.current += 1; setLoading(true); };

  return { data, loading, error, refetch };
}
