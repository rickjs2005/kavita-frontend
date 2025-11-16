"use client";

import { useEffect, useState, useRef } from "react";
import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function DestaquesSection() {
  const [destaques, setDestaques] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDestaques = async () => {
      try {
        const data = await api("/api/public/destaques");
        setDestaques(data);
      } catch (err) {
        console.error("Erro ao buscar destaques:", err);
      }
    };
    fetchDestaques();
  }, []);

  const scroll = (offset: number) => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += offset;
    }
  };

  if (destaques.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 lg:px-10 mb-10">
      <h2 className="text-2xl sm:text-3xl font-bold text-[#359293] mb-2 sm:mb-4">Destaques</h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
        Confira os produtos em destaque do mês, escolhidos especialmente para você com as melhores condições.
      </p>

      <div className="relative">
        {/* Botões: fixos no desktop, ocultos no mobile para não cobrir o conteúdo */}
        <button
          onClick={() => scroll(-300)}
          className="hidden md:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm shadow-md w-9 h-9 rounded-full z-10 hover:bg-gray-100"
          aria-label="Voltar"
        >
          ◀
        </button>

        <div
          ref={containerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 sm:px-3 lg:px-6 py-1 [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
          {destaques.map((produto) => (
            <div
              key={produto.id}
              className="min-w-[200px] max-w-[200px] sm:min-w-[240px] sm:max-w-[240px] lg:min-w-[250px] lg:max-w-[250px] flex-shrink-0 snap-start"
            >
              <ProductCard product={produto} />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll(300)}
          className="hidden md:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm shadow-md w-9 h-9 rounded-full z-10 hover:bg-gray-100"
          aria-label="Avançar"
        >
          ▶
        </button>
      </div>
    </section>
  );
}
