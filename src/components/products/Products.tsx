"use client"; // Indica que o componente será executado no lado do cliente

import { useEffect, useState } from "react";
import { Product } from "../../types/product"; // Tipo do produto
import ProductCard from "./ProductCard"; // Card visual para exibir produto

// Componente que busca e exibe todos os produtos da API
export const Produtos = () => {
  const [produtos, setProdutos] = useState<Product[]>([]); // Estado que armazena os produtos

  // Busca os produtos da API ao carregar a página
  useEffect(() => {
    fetch("http://localhost:5000/api/products") // Rota da API que retorna os produtos
      .then((response) => response.json())
      .then((data) => setProdutos(data)) // Salva os produtos no estado
      .catch((error) => console.error("Erro ao buscar produtos:", error));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Produtos</h1>

      {/* Exibe os produtos em grid responsivo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {produtos.map((produto) => (
          <ProductCard key={produto.id} product={produto} />
        ))}
      </div>
    </div>
  );
};
