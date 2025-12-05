"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import type { Product } from "@/types/product";

type Props = { categoria: string; limit?: number };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function normalizeProducts(payload: any): Product[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const cands = [
    "items",
    "data",
    "results",
    "rows",
    "products",
    "list",
    "content",
  ] as const;
  for (const key of cands) {
    if (Array.isArray(payload?.[key])) return payload[key] as Product[];
    if (Array.isArray(payload?.data?.[key]))
      return payload.data[key] as Product[];
  }
  return [];
}

export default function ProdutosPorCategoria({ categoria, limit = 12 }: Props) {
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth + 8);
    check();
    const obs = new ResizeObserver(check);
    obs.observe(el);
    return () => obs.disconnect();
  }, [list.length]);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        setList([]);

        const url = `${API}/api/products?category=${encodeURIComponent(
          categoria
        )}`;
        const res = await fetch(url, {
          signal: ctrl.signal,
          cache: "no-store",
        });
        const text = await res.text();

        if (!res.ok) throw new Error(text || res.statusText);

        const json = text ? JSON.parse(text) : [];
        const arr = normalizeProducts(json).slice(0, limit);
        setList(arr);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setErrorMsg("Não foi possível carregar produtos.");
        console.warn("ProdutosPorCategoria:", e);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [categoria, limit]);

  const skeletons = useMemo(
    () => new Array(Math.min(5, limit)).fill(0),
    [limit]
  );

  const handleScroll = (direction: "left" | "right") => {
    const el = wrapRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div className="rounded-3xl border border-emerald-50 bg-emerald-50/50 px-2 py-3 shadow-sm sm:px-3 lg:px-4">
        <div className="relative group">
          {hasOverflow && (
            <>
              <div className="pointer-events-none absolute left-0 top-0 h-full w-10 rounded-l-3xl bg-gradient-to-r from-emerald-50 via-emerald-50/70 to-transparent" />
              <div className="pointer-events-none absolute right-0 top-0 h-full w-10 rounded-r-3xl bg-gradient-to-l from-emerald-50 via-emerald-50/70 to-transparent" />
            </>
          )}

          {/* SETAS – um pouco para fora e com visual melhor */}
          {hasOverflow && !loading && list.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => handleScroll("left")}
                className="hidden md:flex absolute -left-4 top-1/2 z-30 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-emerald-700 shadow-lg ring-1 ring-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                aria-label="Voltar produtos"
              >
                <span className="text-xl leading-none">&lsaquo;</span>
              </button>

              <button
                type="button"
                onClick={() => handleScroll("right")}
                className="hidden md:flex absolute -right-4 top-1/2 z-30 h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-emerald-700 shadow-lg ring-1 ring-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                aria-label="Avançar produtos"
              >
                <span className="text-xl leading-none">&rsaquo;</span>
              </button>
            </>
          )}

          <div
            ref={wrapRef}
            className="no-scrollbar flex snap-x snap-mandatory scroll-smooth gap-4 overflow-x-auto py-1 pl-1 pr-6 sm:gap-5 sm:py-2 sm:pl-1 sm:pr-8 lg:gap-6 lg:py-3 lg:pl-1 lg:pr-10 [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

            {loading &&
              skeletons.map((_, i) => (
                <div
                  key={i}
                  className="min-w-[220px] max-w-[220px] snap-start rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-emerald-100 sm:min-w-[240px] sm:max-w-[240px] lg:min-w-[250px] lg:max-w-[250px]"
                >
                  <div className="h-40 w-full animate-pulse rounded-xl bg-emerald-100/80 sm:h-44" />
                  <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-emerald-100/80" />
                  <div className="mt-2 h-4 w-1/2 animate-pulse rounded-full bg-emerald-100/70" />
                  <div className="mt-4 h-10 w-full animate-pulse rounded-full bg-emerald-100/80" />
                </div>
              ))}

            {!loading && errorMsg && (
              <div className="py-6 text-sm font-medium text-red-600">
                {errorMsg}
              </div>
            )}

            {!loading && !errorMsg && list.length === 0 && (
              <div className="py-6 text-sm text-emerald-900/80">
                Sem produtos nessa categoria.
              </div>
            )}

            {!loading &&
              !errorMsg &&
              list.map((p) => (
                <div
                  key={p.id}
                  className="min-w-[220px] max-w-[220px] snap-start sm:min-w-[240px] sm:max-w-[240px] lg:min-w-[250px] lg:max-w-[250px]"
                >
                  <ProductCard product={p as any} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
