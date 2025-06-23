"use client"; // Esse componente será renderizado no lado do cliente (navegador)

import React, { FC } from "react"; // Importa o React e o tipo FC (FunctionComponent)
import ProductCard from "@/components/products/ProductCard"; // Componente para exibir cada produto
import CartCar from "@/components/cart/CartCar"; // Componente visual do carrinho flutuante
import { Product } from "@/types/product"; // Tipo TypeScript para produtos
import { useCart } from "@/context/CartContext"; // Hook que gerencia o estado do carrinho

// Define a tipagem das props recebidas pelo componente
interface ProductsPageProps {
  products: Product[]; // Lista de produtos a ser exibida
}

// Componente principal da página de listagem de produtos
const ProductsPage: FC<ProductsPageProps> = ({ products }) => {
  // Estado global do carrinho, via Context API
  const { isCartOpen, closeCart } = useCart();

  return (
    <div className="relative px-4 md:px-6 lg:px-8 py-6">
      
      {/* Seção de produtos em grade responsiva */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.length > 0 ? (
          // Se houver produtos, mapeia e exibe cada um usando o ProductCard
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          // Caso não tenha produtos, mostra mensagem amigável
          <p className="text-gray-500 col-span-full text-center">
            Nenhum produto encontrado.
          </p>
        )}
      </section>

      {/* Carrinho flutuante (aparece ao clicar em ícone do carrinho, por exemplo) */}
      <CartCar isCartOpen={isCartOpen} closeCart={closeCart} />
    </div>
  );
};

export default ProductsPage;
// O componente ProductsPage recebe uma lista de produtos como props
// e renderiza uma grade responsiva de cartões de produtos.