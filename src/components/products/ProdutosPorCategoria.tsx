// src/components/products/ProdutosPorCategoria.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "./ProductCard";

type Product = {
  id: number;
  name: string;
  price: number | string;
  quantity?: number | string;
  image?: string | null;
  images?: string[];
  [k: string]: any;
};

type Props = { categoria: string; limit?: number };

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function normalizeProducts(payload: any): Product[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const cands = ["items", "data", "results", "rows", "products", "list", "content"] as const;
  for (const key of cands) {
    if (Array.isArray(payload?.[key])) return payload[key] as Product[];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key] as Product[];
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

        const url = `${API}/api/products?category=${encodeURIComponent(categoria)}`;
        const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
        const text = await res.text();

        if (!res.ok) throw new Error(text || res.statusText);

        const json = text ? JSON.parse(text) : [];
        const arr = normalizeProducts(json).slice(0, limit);
        setList(arr);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErrorMsg("Não foi possível carregar produtos.");
        console.warn("ProdutosPorCategoria:", e);
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [categoria, limit]);

  const skeletons = useMemo(() => new Array(Math.min(5, limit)).fill(0), [limit]);

  const scroll = (dx: number) => {
    const el = wrapRef.current;
    if (!el) return;
    el.scrollBy({ left: dx, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      {hasOverflow && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 h-full w-8 sm:w-10 bg-gradient-to-r from-white/80 to-transparent rounded-l-2xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 sm:w-10 bg-gradient-to-l from-white/80 to-transparent rounded-r-2xl" />
        </>
      )}

      {hasOverflow && (
        <>
          <button
            onClick={() => scroll(-320)}
            className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full border bg-white/90 backdrop-blur-sm p-2 shadow-sm hover:bg-gray-50"
            aria-label="Voltar"
          >
            ◀
          </button>
          <button
            onClick={() => scroll(320)}
            className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full border bg-white/90 backdrop-blur-sm p-2 shadow-sm hover:bg-gray-50"
            aria-label="Avançar"
          >
            ▶
          </button>
        </>
      )}

      <div
        ref={wrapRef}
        className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-2 sm:px-3 lg:px-4 py-2 [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

        {loading &&
          skeletons.map((_, i) => (
            <div
              key={i}
              className="min-w-[200px] max-w-[200px] sm:min-w-[240px] sm:max-w-[240px] snap-start rounded-xl border bg-white p-3 shadow-sm"
            >
              <div className="h-40 w-full animate-pulse rounded-lg bg-gray-200" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-10 w-full animate-pulse rounded bg-gray-200" />
            </div>
          ))}

        {!loading && errorMsg && (
          <div className="py-6 text-sm text-red-600">{errorMsg}</div>
        )}
        {!loading && !errorMsg && list.length === 0 && (
          <div className="py-6 text-sm text-gray-500">Sem produtos nessa categoria.</div>
        )}

        {!loading &&
          !errorMsg &&
          list.map((p) => (
            <div
              key={p.id}
              className="min-w-[200px] max-w-[200px] sm:min-w-[240px] sm:max-w-[240px] snap-start"
            >
              <ProductCard product={p as any} />
            </div>
          ))}
      </div>
    </div>
  );
}
