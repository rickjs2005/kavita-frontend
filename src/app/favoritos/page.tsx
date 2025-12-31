"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import ProductCard from "@/components/products/ProductCard";
import { useAuth } from "@/context/AuthContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function FavoritosPage() {
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [favoritos, setFavoritos] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // se ainda está carregando o auth, espera
    if (authLoading) return;

    // se não tem usuário logado, não tenta buscar nada
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchFavorites() {
      try {
        const res = await fetch(`${API_BASE}/api/favorites`, {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${user!}`, 
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            setError("Faça login novamente para ver seus favoritos.");
          } else {
            setError("Não foi possível carregar seus favoritos.");
          }
          setLoading(false);
          return;
        }

        const json = await res.json();

        // aceita { data: [...] } ou [...]
        const data: Product[] = Array.isArray(json)
          ? (json as Product[])
          : ((json as any)?.data ?? []);

        setFavoritos(data ?? []);
      } catch (err) {
        console.error("Erro ao buscar favoritos:", err);
        setError("Erro ao carregar seus favoritos.");
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [user, authLoading]);

  // ======================
  // RENDER
  // ======================

  if (!user) {
    return (
      <main className="min-h-svh max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Meus Favoritos</h1>
        <p className="text-gray-700 mb-4">
          Você precisa estar logado para ver seus favoritos.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-[#2F7E7F] text-white px-4 py-2 text-sm font-semibold hover:bg-[#2a6f70]"
        >
          Fazer login
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-svh max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-2 mb-6 flex-wrap">
        <h1 className="text-2xl font-semibold">Meus Favoritos</h1>

        <Link
          href="/"
          className="text-sm text-[#2F7E7F] hover:underline"
        >
          Voltar para a loja
        </Link>
      </div>

      {loading && (
        <p className="text-gray-600">Carregando favoritos...</p>
      )}

      {!loading && error && (
        <p className="text-red-600">{error}</p>
      )}

      {!loading && !error && favoritos.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center">
          <p className="text-gray-700 mb-3">
            Você ainda não adicionou nenhum produto aos favoritos.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-[#2F7E7F] text-white px-4 py-2 text-sm font-semibold hover:bg-[#2a6f70]"
          >
            Começar a comprar
          </Link>
        </div>
      )}

      {!loading && !error && favoritos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {favoritos.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              images={(product as any).images}
              initialIsFavorite
            />
          ))}
        </div>
      )}
    </main>
  );
}
