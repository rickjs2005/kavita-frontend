"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import ProductCard from "./ProductCard";
import { api } from "@/lib/api";

export const Produtos = () => {
  const [produtos, setProdutos] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // ✅ usa diretamente api()
        const data = await api<Product[]>("/api/products");
        setProdutos(data);
      } catch (err) {
        console.error("Erro ao buscar produtos:", err);
      }
    })();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Produtos</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {produtos.map((produto) => (
          <ProductCard key={produto.id} product={produto} />
        ))}
      </div>
    </div>
  );
};
