// src/components/products/ProdutosPorCategoria.tsx
"use client"; // Indica que esse componente é renderizado no cliente

import { useEffect, useState, useRef } from "react";
import { Product } from "@/types/product"; // Tipo que define um produto
import ProductCard from "./ProductCard";   // Componente que exibe cada produto individualmente

// Props esperadas: uma string que representa o nome da categoria
interface Props {
  categoria: string;
}

// Componente que exibe produtos de uma categoria específica em carrossel horizontal
export default function ProdutosPorCategoria({ categoria }: Props) {
  const [produtos, setProdutos] = useState<Product[]>([]); // Lista de produtos da categoria
  const containerRef = useRef<HTMLDivElement>(null);       // Referência para o carrossel

  // Quando a categoria muda, busca novos produtos da API
  useEffect(() => {
    fetch(`http://localhost:5000/api/products?category=${categoria}`)
      .then((res) => res.json())
      .then((data) => setProdutos(data))
      .catch((err) => console.error("Erro ao buscar produtos:", err));
  }, [categoria]);

  // Função que faz o scroll horizontal do carrossel
  const scroll = (offset: number) => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += offset;
    }
  };

  return (
    <div className="relative">
      {/* Botão para rolar para a esquerda */}
      <button
        onClick={() => scroll(-300)}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border border-gray-300 shadow-md p-2 rounded-full z-10 hover:bg-gray-100"
      >
        ◀
      </button>

      {/* Carrossel com os produtos */}
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8"
      >
        {produtos.map((produto) => (
          <div
            key={produto.id}
            className="min-w-[250px] max-w-[250px] flex-shrink-0"
          >
            <ProductCard product={produto} />
          </div>
        ))}
      </div>

      {/* Botão para rolar para a direita */}
      <button
        onClick={() => scroll(300)}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white border border-gray-300 shadow-md p-2 rounded-full z-10 hover:bg-gray-100"
      >
        ▶
      </button>
    </div>
  );
}
// Estilos adicionais para esconder a barra de rolagem
// .scrollbar-hide::-webkit-scrollbar {
//   display: none;