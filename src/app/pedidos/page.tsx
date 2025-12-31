"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import CustomButton from "@/components/buttons/CustomButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ----- Tipos -----
type PedidoResumo = {
  id: number;
  usuario_id: number;
  forma_pagamento: string;
  status: string;
  data_pedido: string;
  total: number;
};

export default function PedidosClientePage() {
  const router = useRouter();
  const { user } = useAuth();

  const isLoggedIn = !!user?.id;

  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Se não estiver logado, manda para login
  useEffect(() => {
    if (!isLoggedIn) {
      setError("Você precisa estar logado para ver suas compras.");
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Buscar pedidos do cliente (via cookie HttpOnly)
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchPedidos = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data } = await axios.get<PedidoResumo[]>(`${API_BASE}/api/pedidos`, {
          withCredentials: true,
        });

        setPedidos(Array.isArray(data) ? data : []);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setError("Sessão expirada. Faça login novamente.");
          router.push("/login");
        } else {
          setError(
            err?.response?.data?.message || "Não foi possível carregar seus pedidos."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, [isLoggedIn, router]);

  // --------- RENDER ---------

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Painel de pedidos</h1>
        <p className="text-gray-600">Carregando seus pedidos.</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Painel de pedidos</h1>
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/">
          <CustomButton
            label="Voltar para a página inicial"
            variant="primary"
            size="medium"
            isLoading={false}
          />
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Painel de pedidos</h1>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Voltar
        </button>
      </div>

      {pedidos.length === 0 ? (
        <p className="text-gray-600">Você ainda não fez nenhuma compra.</p>
      ) : (
        <div className="grid gap-4">
          {pedidos.map((p) => (
            <Link
              key={p.id}
              href={`/pedidos/${p.id}`}
              className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">Pedido #{p.id}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(p.data_pedido).toLocaleString("pt-BR")}
                  </p>
                  <p className="text-sm text-gray-600">Status: {p.status}</p>
                </div>

                <div className="text-right">
                  <p className="font-semibold">
                    R$ {Number(p.total || 0).toFixed(2).replace(".", ",")}
                  </p>
                  <p className="text-sm text-gray-600">{p.forma_pagamento}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
