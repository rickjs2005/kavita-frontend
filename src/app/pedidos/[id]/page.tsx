"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Item = { id: number; nome: string; preco: number; quantidade: number; imagem?: string | null };
type Pedido = {
  id: number;
  forma_pagamento: string;
  status: string;
  data_pedido: string;
  itens: Item[];
  total: number;
  endereco?: string | null;
  vendedor?: string | null;
};

export default function PedidoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get<Pedido>(`${API_BASE}/api/pedidos/${id}`);
        if (mounted) setPedido(data);
      } catch (e) {
        setError("Não foi possível carregar esta compra.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const first = useMemo(() => pedido?.itens?.[0], [pedido]);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8">
        <h1 className="text-2xl font-bold mb-4">Detalhe da compra</h1>

        {loading ? (
          <div className="rounded-xl border p-6 animate-pulse space-y-3">
            <div className="h-4 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-40 bg-gray-200 rounded" />
            <div className="h-24 w-full bg-gray-200 rounded" />
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : !pedido ? (
          <p>Compra não encontrada.</p>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-gray-100 overflow-hidden">
                <img
                  src={first?.imagem || "/placeholder.png"}
                  alt={first?.nome || `Pedido #${pedido.id}`}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.png"; }}
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{first?.nome || `Pedido #${pedido.id}`}</p>
                <p className="text-xs text-gray-600">{first ? `${first.quantidade} un.` : "1 un."} | Ver detalhe</p>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-green-700 font-semibold">
                {pedido.status?.toLowerCase().includes("entreg") ? "Entregue" : "Status da compra"}
              </p>
              <p className="text-sm mt-1">
                {pedido.status?.toLowerCase().includes("entreg")
                  ? `Chegou no dia ${new Date(pedido.data_pedido).toLocaleDateString("pt-BR")}`
                  : `Status: ${pedido.status}`}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {pedido.endereco
                  ? `Correios entregou seu pacote em ${pedido.endereco}.`
                  : "Correios entregou seu pacote."}
              </p>

              <div className="mt-3">
                <button
                  className="px-4 py-2 rounded-lg bg-[#359293] text-white font-medium hover:bg-[#c94a16] transition-colors"
                  onClick={() => (window.location.href = "/")}
                >
                  Comprar novamente
                </button>
              </div>
            </div>

            <div className="rounded-xl border">
              <button className="w-full text-left px-4 py-3 font-semibold">
                O que você achou do produto?
              </button>
            </div>

            <div className="rounded-xl border divide-y">
              <p className="px-4 py-3 font-semibold">Ajuda com a compra</p>
              <button className="w-full text-left px-4 py-3 hover:bg-black/5">
                Preciso de ajuda com a NF-e
              </button>
              <button className="w-full text-left px-4 py-3 hover:bg-black/5">
                O pagamento foi duplicado no meu cartão
              </button>
            </div>

            <div className="rounded-xl border p-4">
              <p className="font-semibold mb-2">
                Mensagens com o vendedor {pedido.vendedor ? `(${pedido.vendedor})` : ""}
              </p>
              <button
                className="px-4 py-2 rounded-lg border border-black/10 font-semibold hover:bg-black/5"
                onClick={() => alert("Abrir chat do vendedor (implementar rota/whatsapp)")}
              >
                Enviar mensagem
              </button>
            </div>
          </div>
        )}
      </div>

      <aside className="lg:col-span-4">
        {pedido && (
          <div className="rounded-xl border p-4">
            <p className="font-semibold mb-2">Detalhe da compra</p>
            <p className="text-sm text-gray-600">
              {new Date(pedido.data_pedido).toLocaleDateString("pt-BR")} • #{pedido.id}
            </p>

            <dl className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-700">Produto</dt>
                <dd className="text-sm font-semibold">
                  {(pedido.total ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-700">Frete</dt>
                <dd className="text-sm font-semibold">R$ 0,00</dd>
              </div>
              <div className="pt-2 flex items-center justify-between border-t">
                <dt className="text-gray-800 font-semibold">Total</dt>
                <dd className="text-lg font-extrabold text-[#EC5B20]">
                  {(pedido.total ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </dd>
              </div>
            </dl>

            <details className="mt-3">
              <summary className="text-sm text-[#359293] cursor-pointer">Detalhes do pagamento e envio</summary>
              <p className="text-sm text-gray-600 mt-2">
                {pedido.forma_pagamento?.toUpperCase()} • {pedido.status?.toUpperCase()}
              </p>
            </details>
          </div>
        )}
      </aside>
    </div>
  );
}
