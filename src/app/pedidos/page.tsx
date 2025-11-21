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

  const token = user?.token;
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

  // Buscar pedidos do cliente
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchPedidos = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const { data } = await axios.get<PedidoResumo[]>(
          `${API_BASE}/api/pedidos`,
          { headers }
        );

        setPedidos(Array.isArray(data) ? data : []);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) {
          setError("Sessão expirada. Faça login novamente.");
          router.push("/login");
        } else {
          setError(
            err?.response?.data?.message ||
              "Não foi possível carregar seus pedidos."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPedidos();
  }, [isLoggedIn, token, router]);

  // --------- RENDER ---------

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Painel de pedidos</h1>
        <p className="text-gray-600">Carregando seus pedidos...</p>
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
          className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-[#EC5B20] text-white text-sm font-semibold hover:bg-[#d44f1c] transition-colors"
        >
          Voltar
        </button>
      </div>

      {/* Nenhum pedido */}
      {pedidos.length === 0 && (
        <div className="bg-white rounded-2xl border shadow p-6 sm:p-8 text-center">
          <p className="text-gray-700 mb-3">
            Você ainda não tem nenhum pedido.
          </p>
          <Link href="/">
            <CustomButton
              label="Começar as compras"
              variant="primary"
              isLoading={false}
              size="medium"
            />
          </Link>
        </div>
      )}

      {/* Lista de pedidos */}
      {pedidos.length > 0 && (
        <>
          {/* Tabela (desktop) */}
          <div className="hidden md:block bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="[&_th]:px-6 [&_th]:py-3 text-sm">
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Forma de pagamento</th>
                  <th>Total</th>
                  <th className="w-32 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pedidos.map((pedido) => (
                  <tr
                    key={pedido.id}
                    className="[&_td]:px-6 [&_td]:py-4 align-middle text-sm"
                  >
                    <td className="font-semibold text-gray-900">
                      #{pedido.id}
                    </td>

                    <td className="text-gray-700">
                      {new Date(pedido.data_pedido).toLocaleString("pt-BR")}
                    </td>

                    <td className="text-gray-800 capitalize">
                      {pedido.status}
                    </td>

                    <td className="text-gray-800">
                      {pedido.forma_pagamento}
                    </td>

                    <td className="text-gray-900 font-semibold">
                      {Number(pedido.total || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>

                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/pedidos/${pedido.id}`)}
                        className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-[#359293] text-white text-xs font-semibold hover:bg-[#2b7778] transition-colors"
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (mobile) */}
          <div className="md:hidden space-y-4">
            {pedidos.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-white rounded-2xl border shadow p-4 text-sm"
              >
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Pedido #{pedido.id}
                    </p>
                    <p className="text-gray-600">
                      {new Date(pedido.data_pedido).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <span className="inline-flex px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                    {pedido.status}
                  </span>
                </div>

                <p className="text-gray-700">
                  <span className="font-semibold">Pagamento:</span>{" "}
                  {pedido.forma_pagamento}
                </p>

                <p className="mt-1 text-gray-900 font-semibold">
                  Total:{" "}
                  {Number(pedido.total || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>

                <button
                  type="button"
                  onClick={() => router.push(`/pedidos/${pedido.id}`)}
                  className="mt-3 w-full px-4 py-2 rounded-lg bg-[#359293] text-white font-semibold text-xs hover:bg-[#2b7778] transition-colors"
                >
                  Ver detalhes
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Botão voltar no mobile */}
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mt-6 w-full md:hidden px-4 py-3 rounded-lg bg-[#EC5B20] text-white text-sm font-semibold hover:bg-[#d44f1c] transition-colors"
      >
        Voltar
      </button>
    </main>
  );
}
