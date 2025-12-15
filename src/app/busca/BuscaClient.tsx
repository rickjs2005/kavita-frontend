"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { FiltersPanel, type FiltersState } from "../../components/search/FiltersPanel";
import { SortSelect, type SortKey } from "../../components/search/SortSelect";
import { Pagination } from "../../components/search/Pagination";
import ProductCard from "../../components/products/ProductCard";

import type { Product } from "@/types/product";
import CloseButton from "../../components/buttons/CloseButton";
import LoadingButton from "../../components/buttons/LoadingButton";

import type { Category, ProductsResponse } from "@/types/search";
import { absUrl } from "@/utils/absUrl";
import { buildQueryString, clamp, parseIntList, toNum, toNumberParam } from "@/utils/search";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PLACEHOLDER = "/placeholder.png";

type Params = {
    q: string;
    categories: number[];
    minPrice: number | null;
    maxPrice: number | null;
    promo: boolean;
    sort: string;
    page: number;
    limit: number;
};

function safeJsonParse(text: string) {
    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
}

function normalizeCategories(payload: any): Category[] {
    const arr: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.categories)
                ? payload.categories
                : [];

    return arr
        .map((c: any) => ({
            id: Number(c?.id),
            name: String(c?.name ?? c?.nome ?? ""),
            slug: c?.slug ? String(c.slug) : undefined,
            total_products:
                typeof c?.total_products === "number"
                    ? c.total_products
                    : typeof c?.totalProducts === "number"
                        ? c.totalProducts
                        : undefined,
            active: c?.active ?? c?.is_active ?? c?.isActive ?? undefined,
        }))
        .filter((c) => Number.isFinite(c.id) && Boolean(c.name))
        .filter((c: any) => (c.active === undefined ? true : Boolean(c.active)))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

function readCategoriesFromSearchParams(sp: ReturnType<typeof useSearchParams>) {
    // 1) prioridade: categories=1,2,3
    const fromList = parseIntList(sp.get("categories"));
    if (fromList.length) return fromList;

    // 2) fallback: category_id=7
    const cid = sp.get("category_id");
    if (cid) {
        const n = Number(cid);
        if (Number.isFinite(n) && n > 0) return [n];
    }

    // 3) fallback: category=7 (ou outro backend)
    const c = sp.get("category");
    if (c) {
        const n = Number(c);
        if (Number.isFinite(n) && n > 0) return [n];
    }

    return [];
}

export default function BuscaClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const abortRef = useRef<AbortController | null>(null);

    const params: Params = useMemo(() => {
        const q = searchParams.get("q") || "";
        const categories = readCategoriesFromSearchParams(searchParams);
        const minPrice = toNumberParam(searchParams.get("minPrice"));
        const maxPrice = toNumberParam(searchParams.get("maxPrice"));
        const promo = (searchParams.get("promo") || "").toLowerCase() === "true";
        const sort = searchParams.get("sort") || "relevance";
        const page = clamp(Number(searchParams.get("page") || 1), 1, 10_000);
        const limit = clamp(Number(searchParams.get("limit") || 12), 1, 60);

        return { q, categories, minPrice, maxPrice, promo, sort, page, limit };
    }, [searchParams]);

    const [debouncedQ, setDebouncedQ] = useState(params.q);
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(params.q), 350);
        return () => clearTimeout(t);
    }, [params.q]);

    const effectiveParams: Params = useMemo(() => ({ ...params, q: debouncedQ }), [params, debouncedQ]);

    const [cats, setCats] = useState<Category[]>([]);
    const [catsLoading, setCatsLoading] = useState(false);

    const [productsData, setProductsData] = useState<ProductsResponse | null>(null);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [errorProducts, setErrorProducts] = useState<string | null>(null);

    const [filtersOpen, setFiltersOpen] = useState(false);

    const pushParams = (patch: Partial<Params>) => {
        const merged: Params = { ...params, ...patch };

        const filterKeys: (keyof Params)[] = ["q", "categories", "minPrice", "maxPrice", "promo", "sort", "limit"];
        const shouldResetPage = filterKeys.some((k) => k in patch) && !("page" in patch);
        if (shouldResetPage) merged.page = 1;

        const sp = new URLSearchParams();

        if (merged.q?.trim()) sp.set("q", merged.q.trim());

        // ✅ compat total: categories + category_id + category
        if (merged.categories?.length) {
            sp.set("categories", merged.categories.join(","));

            if (merged.categories.length === 1) {
                const id = merged.categories[0];
                sp.set("category_id", String(id));
                sp.set("category", String(id));
            } else {
                sp.delete("category_id");
                sp.delete("category");
            }
        } else {
            sp.delete("categories");
            sp.delete("category_id");
            sp.delete("category");
        }

        if (typeof merged.minPrice === "number") sp.set("minPrice", String(merged.minPrice));
        if (typeof merged.maxPrice === "number") sp.set("maxPrice", String(merged.maxPrice));
        if (merged.promo) sp.set("promo", "true");
        if (merged.sort) sp.set("sort", merged.sort);
        sp.set("page", String(merged.page || 1));
        sp.set("limit", String(merged.limit || 12));

        router.push(`/busca?${sp.toString()}`, { scroll: false });
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

    useEffect(() => {
        let mounted = true;

        (async () => {
            setCatsLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/public/categorias`, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                const text = await res.text();
                if (!res.ok) throw new Error(text || res.statusText);

                const json = safeJsonParse(text) ?? [];
                const normalized = normalizeCategories(json);

                if (!mounted) return;
                setCats(normalized);
            } catch (e) {
                if (!mounted) return;
                console.warn("Categorias (BuscaClient):", e);
                setCats([]);
            } finally {
                if (mounted) setCatsLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        (async () => {
            setLoadingProducts(true);
            setErrorProducts(null);

            try {
                const qs = buildQueryString({
                    ...effectiveParams,
                    page: params.page,
                });

                const res = await fetch(`${API_BASE}/api/products/search?${qs}`, {
                    method: "GET",
                    credentials: "include",
                    signal: ctrl.signal,
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    let msg = `HTTP ${res.status}`;
                    try {
                        const j = await res.json();
                        msg = j?.message || j?.mensagem || msg;
                    } catch { }
                    throw new Error(msg);
                }

                const json = (await res.json()) as ProductsResponse;
                setProductsData(json);
            } catch (e: any) {
                if (e?.name === "AbortError") return;
                setProductsData(null);
                setErrorProducts(e?.message || "Erro ao buscar produtos");
            } finally {
                setLoadingProducts(false);
            }
        })();

        return () => ctrl.abort();
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

    const activeFiltersCount = useMemo(() => {
        let c = 0;
        if (params.q?.trim()) c++;
        if (params.categories?.length) c++;
        if (params.minPrice != null || params.maxPrice != null) c++;
        if (params.promo) c++;
        return c;
    }, [params.q, params.categories, params.minPrice, params.maxPrice, params.promo]);

    const DesktopFilters = (
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
                                className="
                  relative inline-flex items-center justify-center gap-2
                  rounded-xl border border-zinc-200 bg-white
                  px-3 py-2 text-sm font-semibold text-zinc-800
                  shadow-sm hover:bg-zinc-50
                  transition
                  lg:hidden
                "
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                <span>Filtros</span>

                                {activeFiltersCount > 0 && (
                                    <span
                                        className="
                      ml-1 inline-flex h-5 min-w-[20px] items-center justify-center
                      rounded-full bg-emerald-600 px-1.5
                      text-[11px] font-bold text-white
                    "
                                        aria-label={`${activeFiltersCount} filtros ativos`}
                                    >
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>

                            <SortSelect value={params.sort as SortKey} onChange={(v) => pushParams({ sort: v })} />
                        </div>
                    </div>

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

                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
                    <aside className="hidden lg:block lg:sticky lg:top-24">{DesktopFilters}</aside>

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
                                    <p className="mt-1 text-sm text-zinc-600">Tente ajustar os filtros.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                                    {list.map((p) => {
                                        const allImgsRaw = [p.image ?? null, ...(Array.isArray(p.images) ? p.images : [])].filter(Boolean) as string[];
                                        const allImgs = Array.from(new Set(allImgsRaw)).map(absUrl).filter(Boolean);
                                        const cover = allImgs[0] ?? PLACEHOLDER;

                                        const finalPrice = toNum(p.final_price);
                                        const basePrice = toNum(p.price);
                                        const originalPrice = toNum(p.original_price);
                                        const priceCandidate = finalPrice ?? basePrice ?? originalPrice ?? 0;

                                        const productForCard = {
                                            id: p.id,
                                            name: p.name,
                                            description: p.description || "",
                                            image: cover,
                                            images: allImgs,
                                            price: priceCandidate,
                                        } as unknown as Product;

                                        return <ProductCard key={p.id} product={productForCard} images={allImgs.length ? allImgs : [cover]} />;
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex items-center justify-center">
                            <Pagination page={pag.page} totalPages={pag.totalPages} onPageChange={(nextPage) => pushParams({ page: nextPage })} />
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

                    <div className="absolute right-0 top-0 h-full w-[92%] max-w-md overflow-auto bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4">
                            <div className="min-w-0">
                                <h2 className="text-base font-semibold text-zinc-900">Filtros</h2>
                                {activeFiltersCount > 0 ? (
                                    <p className="mt-0.5 text-xs text-zinc-500">{activeFiltersCount} ativo(s)</p>
                                ) : (
                                    <p className="mt-0.5 text-xs text-zinc-500">Nenhum filtro ativo</p>
                                )}
                            </div>

                            <CloseButton onClose={() => setFiltersOpen(false)} className="text-3xl" />
                        </div>

                        <div className="px-4 py-4">
                            <FiltersPanel
                                categories={cats}
                                categoriesLoading={catsLoading}
                                value={filtersState}
                                onChange={(patch) => pushParams(patch as any)}
                                onClear={clearAll}
                                onApply={() => setFiltersOpen(false)}
                                stickyActions
                                applyLabel="Ver resultados"
                            />

                            <div className="mt-4 border-t border-zinc-200 pt-4">
                                <Link href="/" className="text-sm font-medium text-emerald-700 hover:text-emerald-800">
                                    Voltar para Home
                                </Link>
                            </div>
                        </div>

                        <div className="sticky bottom-0 border-t border-zinc-200 bg-white px-4 py-4">
                            <LoadingButton isLoading={false} onClick={() => setFiltersOpen(false)} className="w-full">
                                Ver resultados
                            </LoadingButton>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
