"use client";

import { useMemo } from "react";
import ProductCard from "@/components/products/ProductCard";
import CartCar from "@/components/cart/CartCar";
import { useCart } from "@/context/CartContext";
import { useFetchProducts } from "@/hooks/useFetchProducts";

export default function ProductsPageClient() {
  const { data: products, loading, error } = useFetchProducts();
  const { isCartOpen, closeCart } = useCart();

  const content = useMemo(() => {
    if (loading) {
      return (
        <p className="text-gray-500 col-span-full text-center">Carregando produtos...</p>
      );
    }

    if (error) {
      return (
        <p className="text-red-500 col-span-full text-center">
          Não foi possível carregar os produtos. Tente novamente mais tarde.
        </p>
      );
    }

    if (!products.length) {
      return (
        <p className="text-gray-500 col-span-full text-center">
          Nenhum produto encontrado.
        </p>
      );
    }

    return products.map(product => <ProductCard key={product.id} product={product} />);
  }, [error, loading, products]);

  return (
    <div className="relative px-4 md:px-6 lg:px-8 py-6">
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {content}
      </section>

      <CartCar isCartOpen={isCartOpen} closeCart={closeCart} />
    </div>
  );
}
