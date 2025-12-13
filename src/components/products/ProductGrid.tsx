"use client";

import Link from "next/link";

type UiProduct = {
  id: number;
  name: string;
  description?: string;
  image: string;
  original_price: number | null;
  final_price: number | null;
  discount_percent: number | null;
  isPromo: boolean;
};

type Props = {
  loading: boolean;
  products: UiProduct[];
  empty: React.ReactNode;
};

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductGrid({ loading, products, empty }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-56 rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="h-32 w-full animate-pulse rounded-t-xl bg-zinc-100" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100" />
              <div className="h-4 w-2/5 animate-pulse rounded bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) return <>{empty}</>;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => {
        const hasDiscount =
          p.original_price != null &&
          p.final_price != null &&
          p.final_price < p.original_price;

        return (
          <Link
            key={p.id}
            href={`/produto/${p.id}`}
            className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative h-40 w-full bg-zinc-50">
              <img
                src={p.image}
                alt={p.name}
                className="h-full w-full object-contain p-3 transition group-hover:scale-[1.02]"
                loading="lazy"
              />
              {p.isPromo || hasDiscount ? (
                <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
                  Promo
                </span>
              ) : null}
            </div>

            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900">{p.name}</h3>

              <div className="mt-2">
                {hasDiscount ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-emerald-700">
                      {formatBRL(p.final_price!)}
                    </span>
                    <span className="text-xs text-zinc-500 line-through">
                      {formatBRL(p.original_price!)}
                    </span>
                  </div>
                ) : p.final_price != null ? (
                  <span className="text-sm font-bold text-zinc-900">{formatBRL(p.final_price)}</span>
                ) : null}

                {p.discount_percent != null && p.discount_percent > 0 ? (
                  <p className="mt-1 text-xs font-medium text-emerald-700">{p.discount_percent}% OFF</p>
                ) : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
