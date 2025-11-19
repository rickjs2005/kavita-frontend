"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type PedidoItem = {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  imagem?: string | null;
};

type PedidoDetalhe = {
  id: number;
  usuario_id: number;
  forma_pagamento: string;
  status: string;
  data_pedido: string;
  endereco: any;
  total: number;
  itens: PedidoItem[];
};

const money = (v: number) =>
  `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

export default function PedidoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pedidoId = params?.id;

  const { user } = useAuth();
  const token = user?.token;
  const isLoggedIn = !!user?.id;

  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Se não estiver logado, manda para login
  useEffect(() => {
    if (!isLoggedIn) {
      setError("Você precisa estar logado para ver o detalhe da compra.");
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!pedidoId || !isLoggedIn) return;

    const fetchPedido = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers: any = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const { data } = await axios.get<PedidoDetalhe>(
          `${API_BASE}/api/pedidos/${pedidoId}`,
          { headers }
        );

        setPedido(data);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404) {
          setError("Pedido não encontrado.");
        } else if (status === 401 || status === 403) {
          setError("Você não tem permissão para ver este pedido. Faça login novamente.");
          router.push("/login");
        } else {
          setError(
            err?.response?.data?.message ||
              "Não foi possível carregar esta compra."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [pedidoId, token, isLoggedIn, router]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Detalhe da compra</h1>
        <p className="text-gray-600">Carregando informações do pedido...</p>
      </main>
    );
  }

  if (error || !pedido) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Detalhe da compra</h1>
        <p className="text-red-600">{error || "Não foi possível carregar esta compra."}</p>
      </main>
    );
  }

  const endereco = (() => {
    // backend manda endereco como string JSON, então normalizamos
    if (!pedido.endereco) return null;
    if (typeof pedido.endereco === "string") {
      try {
        return JSON.parse(pedido.endereco);
      } catch {
        return pedido.endereco;
      }
    }
    return pedido.endereco;
  })();

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Detalhe da compra</h1>

      {/* Dados gerais */}
      <section className="mb-6 space-y-2 text-sm text-gray-800">
        <p>
          <span className="font-semibold">Pedido:</span> #{pedido.id}
        </p>
        <p>
          <span className="font-semibold">Status:</span> {pedido.status}
        </p>
        <p>
          <span className="font-semibold">Forma de pagamento:</span>{" "}
          {pedido.forma_pagamento}
        </p>
        <p>
          <span className="font-semibold">Data:</span>{" "}
          {new Date(pedido.data_pedido).toLocaleString("pt-BR")}
        </p>
      </section>

      {/* Endereço */}
      {endereco && (
        <section className="mb-6">
          <h2 className="font-semibold mb-2">Endereço de entrega</h2>
          <div className="text-sm text-gray-800">
            <p>
              {endereco.rua}, {endereco.numero}
            </p>
            <p>
              {endereco.bairro} - {endereco.cidade}/{endereco.estado}
            </p>
            {endereco.complemento && <p>{endereco.complemento}</p>}
            {endereco.cep && <p>CEP: {endereco.cep}</p>}
          </div>
        </section>
      )}

      {/* Itens */}
      <section className="mb-6">
        <h2 className="font-semibold mb-2">Itens do pedido</h2>
        <div className="border rounded-lg divide-y">
          {pedido.itens.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{item.nome}</p>
                <p className="text-gray-500">
                  {item.quantidade} x {money(item.preco)}
                </p>
              </div>
              <span className="font-semibold">
                {money(item.preco * item.quantidade)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Total */}
      <section className="flex items-center justify-between mt-4 text-lg font-bold">
        <span>Total</span>
        <span className="text-[#EC5B20]">{money(pedido.total)}</span>
      </section>
    </main>
  );
}
