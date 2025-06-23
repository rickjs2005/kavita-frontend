import { useEffect, useState } from "react";
import { Product } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Hook para buscar produtos por categoria
export const useFetchProducts = (category: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/produtos?categoria=${category}`);
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Erro ao buscar produtos.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  return { products, loading, error };
};
