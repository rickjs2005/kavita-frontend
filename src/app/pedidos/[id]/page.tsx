"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Normaliza qualquer caminho vindo do backend para uma URL de imagem válida */
function absUrl(raw?: string | null): string {
  if (!raw) return "/placeholder.png";
  const s = String(raw).trim().replace(/\\/g, "/");

  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/uploads")) return `${API_BASE}${s}`;
  if (s.startsWith("uploads")) return `${API_BASE}/${s}`;
  if (!s.startsWith("/")) return `${API_BASE}/uploads/${s}`;
  return `${API_BASE}${s}`;
}

type PedidoItem = {
  id: number; // id na tabela pedidos_produtos

  // possíveis nomes que o backend pode usar para o id do produto
  produto_id?: number;
  product_id?: number;
  id_produto?: number;

  nome: string;
  preco: number;
  quantidade: number;

  // possíveis nomes para a imagem
  imagem?: string | null;
  image?: string | null;
  product_image?: string | null;
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

  // Redireciona se não estiver logado
  useEffect(() => {
    if (!isLoggedIn) {
      setError("Você precisa estar logado para ver o detalhe da compra.");
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Busca os dados do pedido
  useEffect(() => {
    if (!pedidoId || !isLoggedIn) return;

    const fetchPedido = async () => {
      try {
        setLoading(true);
        setError(null);

        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

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
          setError(
            "Você não tem permissão para ver este pedido. Faça login novamente."
          );
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
        <p className="text-red-600">
          {error || "Não foi possível carregar esta compra."}
        </p>
      </main>
    );
  }

  // endereço vem como JSON string ou objeto
  const endereco = (() => {
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
      {/* Título */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Detalhe da compra</h1>

        <button
          type="button"
          onClick={() => router.push("/pedidos")}
          className="hidden sm:inline-flex px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Voltar para minhas compras
        </button>
      </div>

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
          <div className="text-sm text-gray-800 space-y-0.5">
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
        <div className="border rounded-lg divide-y bg-white">
          {pedido.itens.map((item) => {
            // tenta pegar o id do produto; se não tiver, cai pro id do item (fallback)
            const productId =
              item.produto_id ??
              item.product_id ??
              item.id_produto ??
              item.id;

            const rawImage =
              item.imagem ?? item.image ?? item.product_image ?? null;

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                {/* Imagem */}
                <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                  <img
                    src={rawImage ? absUrl(rawImage) : "/placeholder.png"}
                    alt={item.nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.png";
                    }}
                  />
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0 self-stretch flex flex-col justify-center">
                  <p className="font-medium truncate">{item.nome}</p>
                  <p className="text-gray-500">
                    {item.quantidade} x {money(item.preco)}
                  </p>
                </div>

                {/* Total + botão */}
                <div className="flex flex-col items-end gap-2">
                  <span className="font-semibold">
                    {money(item.preco * item.quantidade)}
                  </span>

                  <button
                    type="button"
                    onClick={() => router.push(`/produtos/${item.produto_id}`)}
                    className="px-4 py-2 rounded-lg bg-[#359293] text-white font-semibold text-xs sm:text-sm hover:bg-[#2b7778] transition-colors"
                  >
                    Comprar novamente
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Total geral */}
      <section className="flex items-center justify-between mt-4 text-lg font-bold">
        <span>Total</span>
        <span className="text-[#EC5B20]">{money(pedido.total)}</span>
      </section>

      {/* Botão voltar em mobile */}
      <button
        type="button"
        onClick={() => router.push("/pedidos")}
        className="mt-6 w-full sm:hidden px-4 py-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Voltar para minhas compras
      </button>
    </main>
  );
}
