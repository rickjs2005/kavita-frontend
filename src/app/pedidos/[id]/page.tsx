"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { absUrl } from "@/utils/absUrl";
import apiClient from "@/lib/apiClient";
import { formatCurrency } from "@/utils/formatters";

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
  status_pagamento?: string | null;
  data_pedido: string;
  endereco: any;
  total: number;
  shipping_price?: number;
  itens: PedidoItem[];
};


export default function PedidoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pedidoId = params?.id;

  const { user } = useAuth();

  const isLoggedIn = !!user?.id;

  const [pedido, setPedido] = useState<PedidoDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleRetryPayment = async () => {
    if (!pedido) return;
    setRetrying(true);
    setRetryError(null);
    try {
      const data = await apiClient.post<{ init_point?: string; sandbox_init_point?: string }>(
        "/api/payment/start",
        { pedidoId: pedido.id }
      );
      const url =
        process.env.NODE_ENV === "production"
          ? data.init_point
          : (data.sandbox_init_point ?? data.init_point);
      if (url) {
        window.location.href = url;
      } else {
        setRetryError("Não foi possível obter o link de pagamento.");
        setRetrying(false);
      }
    } catch (err: any) {
      setRetryError(err?.message || "Erro ao iniciar pagamento. Tente novamente.");
      setRetrying(false);
    }
  };

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

        const data = await apiClient.get<PedidoDetalhe>(
          `/api/pedidos/${pedidoId}`,
        );

        setPedido(data);
      } catch (err: any) {
        const status = err?.status;
        if (status === 404) {
          setError("Pedido não encontrado.");
        } else if (status === 401 || status === 403) {
          setError(
            "Você não tem permissão para ver este pedido. Faça login novamente.",
          );
          router.push("/login");
        } else {
          setError(err?.message || "Não foi possível carregar esta compra.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [pedidoId, isLoggedIn, router]);

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
        {pedido.status_pagamento && (
          <p>
            <span className="font-semibold">Status do pagamento:</span>{" "}
            {pedido.status_pagamento}
          </p>
        )}
        <p>
          <span className="font-semibold">Data:</span>{" "}
          {new Date(pedido.data_pedido).toLocaleString("pt-BR")}
        </p>
      </section>

      {/* Botão de retentativa de pagamento */}
      {(pedido.status_pagamento === "falhou" || pedido.status_pagamento === "pendente") &&
        !pedido.forma_pagamento.toLowerCase().includes("prazo") && (
          <section className="mb-6">
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm text-orange-800 mb-3">
                {pedido.status_pagamento === "falhou"
                  ? "O pagamento deste pedido não foi concluído. Você pode tentar novamente."
                  : "Este pedido aguarda pagamento. Clique abaixo para pagar."}
              </p>
              {retryError && (
                <p className="text-sm text-red-600 mb-2">{retryError}</p>
              )}
              <button
                type="button"
                onClick={handleRetryPayment}
                disabled={retrying}
                className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {retrying ? "Redirecionando..." : "Pagar novamente"}
              </button>
            </div>
          </section>
        )}

      {/* Aviso de confirmação pendente para pedidos a prazo */}
      {pedido.forma_pagamento.toLowerCase().includes("prazo") &&
        pedido.status_pagamento === "pendente" && (
          <section className="mb-6">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">
                Pedido recebido — aguardando confirmação de pagamento
              </p>
              <p className="text-sm text-blue-700">
                Seu pedido foi registrado com pagamento a prazo. Nossa equipe
                entrará em contato para confirmar as condições e liberar o
                pedido. Nenhuma ação é necessária da sua parte agora.
              </p>
            </div>
          </section>
        )}

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
              item.produto_id ?? item.product_id ?? item.id_produto ?? item.id;

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
                    {item.quantidade} x {formatCurrency(item.preco)}
                  </p>
                </div>

                {/* Total + botão */}
                <div className="flex flex-col items-end gap-2">
                  <span className="font-semibold">
                    {formatCurrency(item.preco * item.quantidade)}
                  </span>

                  <button
                    type="button"
                    onClick={() => router.push(`/produtos/${productId}`)}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-semibold text-xs sm:text-sm hover:bg-primary-hover transition-colors"
                  >
                    Comprar novamente
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Frete e total geral */}
      <section className="mt-4 space-y-2 text-sm text-gray-700">
        {typeof pedido.shipping_price === "number" && pedido.shipping_price > 0 && (
          <div className="flex items-center justify-between">
            <span>Frete</span>
            <span>{formatCurrency(pedido.shipping_price)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-lg font-bold text-gray-900">
          <span>Total</span>
          <span className="text-accent">{formatCurrency(pedido.total)}</span>
        </div>
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
