"use client"; // Indica que esse componente será renderizado no lado do cliente (necessário para hooks como useState)

import { useEffect, useState, useRef } from "react";
import { Product } from "@/types/product"; // Tipo que define a estrutura de um produto
import ProductCard from "./ProductCard"; // Componente que exibe visualmente um produto

const API_URL = process.env.NEXT_PUBLIC_API_URL; // Endereço base da API (definido no .env)

export default function DestaquesSection() {
  // Estado que armazena os produtos destacados
  const [destaques, setDestaques] = useState<Product[]>([]);

  // Referência ao container de rolagem horizontal
  const containerRef = useRef<HTMLDivElement>(null);

  // Quando o componente é montado, busca os dados da API
  useEffect(() => {
    const fetchDestaques = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/destaques`);
        const data = await res.json();
        setDestaques(data); // Salva os destaques no estado
      } catch (err) {
        console.error("Erro ao buscar destaques:", err);
      }
    };

    fetchDestaques(); // Chama a função de busca
  }, []);

  // Função para rolar os produtos horizontalmente
  const scroll = (offset: number) => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += offset;
    }
  };

  // Se não tiver destaques, não renderiza nada
  if (destaques.length === 0) return null;

  return (
    <section className="px-4 md:px-10 mb-10">
      {/* Título da seção */}
      <h2 className="text-2xl font-bold text-[#359293] mb-4">Destaques</h2>
      <p className="text-sm text-gray-600 mb-6">
        Confira os produtos em destaque do mês, escolhidos especialmente para você com as melhores condições.
      </p>

      {/* Container com botões de rolagem lateral */}
      <div className="relative">
        {/* Botão esquerdo */}
        <button
          onClick={() => scroll(-300)}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full z-10 hover:bg-gray-100"
        >
          ◀
        </button>

        {/* Lista de produtos em carrossel */}
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-6"
        >
          {destaques.map((produto) => (
            <div
              key={produto.id}
              className="min-w-[250px] max-w-[250px] flex-shrink-0"
            >
              <ProductCard product={produto} /> {/* Cartão do produto */}
            </div>
          ))}
        </div>

        {/* Botão direito */}
        <button
          onClick={() => scroll(300)}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white shadow-md p-2 rounded-full z-10 hover:bg-gray-100"
        >
          ▶
        </button>
      </div>
    </section>
  );
}
