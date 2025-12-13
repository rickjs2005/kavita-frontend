"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FiltersPanel, type FiltersState } from "../../components/search/FiltersPanel";
import { SortSelect, type SortKey } from "../../components/search/SortSelect";
import { Pagination } from "../../components/search/Pagination";
import ProductCard from "../../components/products/ProductCard";
import type { Product } from "@/types/product";

type Category = { id: number; name: string; slug?: string; total_products?: number };

type ApiProduct = {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  sold_count?: number | null;
  created_at?: string | null;
  category_name?: string | null;
  promo_id?: number | null;
  promo_name?: string | null;
  images?: string[];
  image?: string | null;
  rating_avg?: number | string | null;
  rating_count?: number | string | null;
  price?: number | string | null; // DECIMAL pode vir string
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ProductsResponse = {
  products: ApiProduct[];
  pagination: PaginationMeta;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/placeholder.png";

/** normaliza URL de imagem */
function absUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const src = String(raw).trim().replace(/\\/g, "/");
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("data:")) return src;
  if (src.startsWith("/")) return `${API_BASE}${src}`;
  return `${API_BASE}/${src}`;
}

/** converte number/string (DECIMAL) -> number */
function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const s = v.trim().replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toNumberParam(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseIntList(csv: string | null): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildQueryString(params: {
  q?: string;
  categories?: number[];
  minPrice?: number | null;
  maxPrice?: number | null;
  promo?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const sp = new URLSearchParams();

  // marketplace: q é opcional
  if (params.q && params.q.trim()) sp.set("q", params.q.trim());

  if (params.categories && params.categories.length > 0) {
    sp.set("categories", params.categories.join(","));
  }

  if (typeof params.minPrice === "number") sp.set("minPrice", String(params.minPrice));
  if (typeof params.maxPrice === "number") sp.set("maxPrice", String(params.maxPrice));

  if (params.promo) sp.set("promo", "true");
  if (params.sort) sp.set("sort", params.sort);

  sp.set("page", String(params.page || 1));
  sp.set("limit", String(params.limit || 12));

  return sp.toString();
}

export default function BuscaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ---- estado derivado da URL (single source of truth) ----
  const params = useMemo(() => {
    const q = searchParams.get("q") || "";
    const categories = parseIntList(searchParams.get("categories"));
    const minPrice = toNumberParam(searchParams.get("minPrice"));
    const maxPrice = toNumberParam(searchParams.get("maxPrice"));
    const promo = (searchParams.get("promo") || "").toLowerCase() === "true";
    const sort = searchParams.get("sort") || "relevance";
    const page = clamp(Number(searchParams.get("page") || 1), 1, 10_000);
    const limit = clamp(Number(searchParams.get("limit") || 12), 1, 60);

    return { q, categories, minPrice, maxPrice, promo, sort, page, limit };
  }, [searchParams]);

  // debounce do texto (UX + performance)
  const [debouncedQ, setDebouncedQ] = useState(params.q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(params.q), 350);
    return () => clearTimeout(t);
  }, [params.q]);

  const effectiveParams = useMemo(() => ({ ...params, q: debouncedQ }), [params, debouncedQ]);

  // ---- categorias (para o filtro) ----
  const [cats, setCats] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);

  // ---- produtos ----
  const [productsData, setProductsData] = useState<ProductsResponse | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // mobile drawer
  const [filtersOpen, setFiltersOpen] = useState(false);

  // carregar categorias
  useEffect(() => {
    let mounted = true;
    setCatsLoading(true);

    (async () => {
      try {
        const res = await fetch(`/api/categories`, { method: "GET" });
        const json = await res.json();
        if (!mounted) return;
        setCats(Array.isArray(json) ? json : []);
      } catch {
        if (!mounted) return;
        setCats([]);
      } finally {
        if (mounted) setCatsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // carregar produtos: SEM exigir q
  useEffect(() => {
    const qs = buildQueryString({
      ...effectiveParams,
      page: params.page, // página real (não debounce)
    });

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoadingProducts(true);
    setErrorProducts(null);

    fetch(`${API_BASE}/api/products/search?${qs}`, {
      method: "GET",
      credentials: "include",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const j = await res.json();
            msg = j?.message || j?.mensagem || msg;
          } catch {}
          throw new Error(msg);
        }
        return res.json();
      })
      .then((json: ProductsResponse) => setProductsData(json))
      .catch((e: any) => {
        if (e?.name === "AbortError") return;
        setProductsData(null);
        setErrorProducts(e?.message || "Erro ao buscar produtos");
      })
      .finally(() => setLoadingProducts(false));
  }, [
    effectiveParams.q,
    effectiveParams.categories.join(","),
    effectiveParams.minPrice,
    effectiveParams.maxPrice,
    effectiveParams.promo,
    effectiveParams.sort,
    params.page,
    effectiveParams.limit,
  ]);

  // ---- helpers para atualizar URL (sem reload) ----
  function pushParams(patch: Partial<typeof params>) {
    const merged = { ...params, ...patch };

    const filterKeys = ["q", "categories", "minPrice", "maxPrice", "promo", "sort", "limit"] as const;
    const shouldResetPage = filterKeys.some((k) => k in patch) && !("page" in patch);
    if (shouldResetPage) merged.page = 1;

    const sp = new URLSearchParams();

    if (merged.q?.trim()) sp.set("q", merged.q.trim());
    if (merged.categories?.length) sp.set("categories", merged.categories.join(","));
    if (typeof merged.minPrice === "number") sp.set("minPrice", String(merged.minPrice));
    if (typeof merged.maxPrice === "number") sp.set("maxPrice", String(merged.maxPrice));
    if (merged.promo) sp.set("promo", "true");
    if (merged.sort) sp.set("sort", merged.sort);
    sp.set("page", String(merged.page || 1));
    sp.set("limit", String(merged.limit || 12));

    router.push(`/busca?${sp.toString()}`, { scroll: false });
  }

  const list = productsData?.products || [];
  const pag = productsData?.pagination || {
    page: params.page,
    limit: params.limit,
    total: 0,
    totalPages: 1,
  };

  const filtersState: FiltersState = {
    q: params.q,
    categories: params.categories,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    promo: params.promo,
  };

  const clearAll = () =>
    pushParams({
      q: "",
      categories: [],
      minPrice: null,
      maxPrice: null,
      promo: false,
      sort: "relevance",
      page: 1,
    });

  // chips de categorias (nome)
  const catIdToName = useMemo(() => {
    const m = new Map<number, string>();
    for (const c of cats) m.set(c.id, c.name);
    return m;
  }, [cats]);

  const hasAnyFilter =
    Boolean(params.q?.trim()) ||
    params.categories.length > 0 ||
    params.minPrice != null ||
    params.maxPrice != null ||
    params.promo;

  const FiltersBox = (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <FiltersPanel
        categories={cats}
        categoriesLoading={catsLoading}
        value={filtersState}
        onChange={(patch) => pushParams(patch as any)}
        onClear={clearAll}
      />

      <div className="mt-4 border-t border-zinc-200 pt-4">
        <Link href="/" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
          Voltar para Home
        </Link>
      </div>
    </div>
  );

  return (
    <section className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:py-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-zinc-900">Busca</h1>
              <p className="text-sm text-zinc-600">
                {loadingProducts
                  ? "Buscando..."
                  : `${pag.total} produto${pag.total === 1 ? "" : "s"} encontrado${pag.total === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 lg:hidden"
              >
                Filtros
              </button>

              <SortSelect value={params.sort as SortKey} onChange={(v) => pushParams({ sort: v })} />
            </div>
          </div>

          {/* Chips (filtros aplicados) */}
          <div className="flex flex-wrap items-center gap-2">
            {hasAnyFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Limpar tudo
              </button>
            )}

            {params.q?.trim() && (
              <span className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                Busca: “{params.q.trim()}”
              </span>
            )}

            {params.promo && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                Promoções
              </span>
            )}

            {params.minPrice != null && (
              <span className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                Mín: R$ {params.minPrice}
              </span>
            )}

            {params.maxPrice != null && (
              <span className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                Máx: R$ {params.maxPrice}
              </span>
            )}

            {params.categories.map((id) => (
              <span
                key={id}
                className="rounded-full bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200"
              >
                {catIdToName.get(id) || `Categoria ${id}`}
              </span>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
          <aside className="hidden lg:block lg:sticky lg:top-24">{FiltersBox}</aside>

          <main>
            {errorProducts ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorProducts}
              </div>
            ) : null}

            <div className="mt-3">
              {loadingProducts ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: Math.min(12, params.limit) }).map((_, i) => (
                    <div key={i} className="h-72 rounded-2xl border border-zinc-200 bg-white shadow-sm">
                      <div className="h-40 w-full animate-pulse rounded-t-2xl bg-zinc-100" />
                      <div className="space-y-2 p-3">
                        <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
                        <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
                        <div className="h-4 w-2/5 animate-pulse rounded bg-zinc-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : list.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
                  <h3 className="text-lg font-semibold text-zinc-900">Nenhum produto encontrado</h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Tente ajustar os filtros ou remover restrições como preço/promoção.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {list.map((p) => {
                    // imagens (dedupe e normaliza)
                    const allImgsRaw = [
                      p.image ?? null,
                      ...(Array.isArray(p.images) ? p.images : []),
                    ].filter(Boolean) as string[];

                    const allImgs = Array.from(new Set(allImgsRaw))
                      .map((x) => absUrl(x))
                      .filter(Boolean) as string[];

                    const cover = allImgs[0] ?? PLACEHOLDER;

                    // preço: suporta DECIMAL string
                    const finalPrice = toNum(p.final_price);
                    const basePrice = toNum(p.price);
                    const originalPrice = toNum(p.original_price);

                    const priceCandidate = finalPrice ?? basePrice ?? originalPrice ?? 0;

                    // rating: suporta string também
                    const ratingAvg = toNum(p.rating_avg);
                    const ratingCount = toNum(p.rating_count);

                    const productForCard = {
                      id: p.id,
                      name: p.name,
                      description: p.description || "",
                      image: cover,
                      images: allImgs,
                      price: priceCandidate,
                      rating_avg: ratingAvg ?? undefined,
                      rating_count: (ratingCount ?? undefined) as any,
                    } as unknown as Product;

                    return <ProductCard key={p.id} product={productForCard} images={allImgs.length ? allImgs : [cover]} />;
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-center">
              <Pagination
                page={pag.page}
                totalPages={pag.totalPages}
                onPageChange={(nextPage) => pushParams({ page: nextPage })}
              />
            </div>
          </main>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar filtros"
            className="absolute inset-0 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[92%] max-w-md overflow-auto bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-900">Filtros</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Fechar
              </button>
            </div>

            <div className="mt-4">{FiltersBox}</div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Ver resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
