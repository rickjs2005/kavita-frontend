"use client";

import { useMemo } from "react";
import ProductCard from "@/components/products/ProductCard";
import CartCar from "@/components/cart/CartCar";
import { useCart } from "@/context/CartContext";
import { useFetchProducts } from "@/hooks/useFetchProducts";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ProductsPageClient() {
  const { data: products, loading, error } = useFetchProducts();
  const { isCartOpen, closeCart } = useCart();

  const content = useMemo(() => {
    if (loading) {
      return <LoadingState message="Carregando produtos…" variant="inline" />;
    }

    if (error) {
      return (
        <ErrorState
          message="Não foi possível carregar os produtos. Tente novamente mais tarde."
          variant="inline"
        />
      );
    }

    if (!products.length) {
      return (
        <EmptyState message="Nenhum produto encontrado." variant="inline" />
      );
    }

    return products.map((product) => (
      <ProductCard key={product.id} product={product} />
    ));
  }, [error, loading, products]);

  return (
    <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-6">
      <section className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {content}
      </section>

      <CartCar isCartOpen={isCartOpen} closeCart={closeCart} />
    </div>
  );
}
