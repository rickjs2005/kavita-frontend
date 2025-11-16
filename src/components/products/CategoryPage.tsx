"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/products/ProductCard";
import { useFetchProducts } from "@/hooks/useFetchProducts";
import type { Product } from "@/types/product";

type Props = {
  categoria: string;
  title?: string;
};

function asProductList(payload: unknown): Product[] {
  if (Array.isArray(payload)) return payload as Product[];
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as any) &&
    Array.isArray((payload as any).data)
  ) {
    return (payload as any).data as Product[];
  }
  return [];
}

export default function CategoryPage({ categoria, title }: Props) {
  const { data, loading, error } = useFetchProducts({ categorySlug: categoria });
  const products: Product[] = asProductList(data);
  const [selected, setSelected] = useState<string>("");

  const subcategorias = useMemo(() => {
    const set = new Set(
      products.map((p) => p.third_category).filter(Boolean) as string[]
    );
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    if (!selected) return products;
    return products.filter((p) => p.third_category === selected);
  }, [products, selected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] px-4">
        <div className="flex flex-col items-center text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-emerald-500 mb-3" />
          <p className="text-gray-600 text-sm sm:text-base font-medium">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <p className="text-red-600 font-semibold mb-1 sm:mb-2">Erro ao carregar produtos</p>
        <p className="text-gray-500 text-xs sm:text-sm">{String(error)}</p>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-emerald-700 tracking-tight">
          {title ?? categoria}
        </h1>

        {subcategorias.length > 0 && (
          <select
            className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-emerald-500 transition"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Todas as Subcategorias</option>
            {subcategorias.map((sc) => (
              <option key={sc} value={sc}>
                {sc}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center text-gray-500 py-12 sm:py-16">
          <p className="text-base sm:text-lg font-medium">Nenhum item encontrado.</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Tente outra subcategoria ou volte mais tarde.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
