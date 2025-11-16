"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import CustomButton from "@/components/buttons/CustomButton"; // ajuste o caminho se diferente

// Tipos
interface Endereco {
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  referencia?: string;
}
interface ItemPedido {
  produto: string;
  quantidade: number;
  preco_unitario: number | string;
}
interface Pedido {
  id: number;
  usuario: string;
  forma_pagamento: string;
  status: string;
  data_pedido: string;
  endereco: Endereco;
  itens: ItemPedido[];
}

const statusOpcoes = ["pendente", "processando", "enviado", "entregue", "cancelado"] as const;
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/api/admin/pedidos`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
          withCredentials: true,
        });
        setPedidos(res.data as Pedido[]);
      } catch (err) {
        console.error("Erro ao buscar pedidos:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      await axios.put(
        `${API}/api/admin/pedidos/${id}/status`,
        { status: novoStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` } }
      );
      setPedidos(prev => prev.map(p => (p.id === id ? { ...p, status: novoStatus } : p)));
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Painel de Pedidos</h1>
          <Link href="/admin">
            <CustomButton label="Voltar" variant="secondary" isLoading={false} size="small" />
          </Link>
        </div>
        <p className="text-gray-600">Carregando pedidos…</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header com botão Voltar */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
          Painel de Pedidos
        </h1>
        <Link href="/admin" className="shrink-0">
          <CustomButton label="Voltar" variant="secondary" isLoading={false} size="small" />
        </Link>
      </div>

      {/* Zero-state */}
      {pedidos.length === 0 && (
        <div className="bg-white rounded-2xl border shadow p-6 sm:p-8 text-center">
          <p className="text-gray-700 mb-3">Nenhum pedido encontrado.</p>
          <Link href="/">
            <CustomButton label="Começar as compras" variant="primary" isLoading={false} size="medium" />
          </Link>
        </div>
      )}

      {pedidos.length > 0 && (
        <>
          {/* Tabela (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="[&_th]:px-6 [&_th]:py-3 text-sm">
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th className="w-48">Status</th>
                  <th>Pagamento</th>
                  <th>Itens</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pedidos.map((pedido) => (
                  <tr key={pedido.id} className="[&_td]:px-6 [&_td]:py-4 align-top">
                    <td className="font-semibold text-gray-900">#{pedido.id}</td>
                    <td className="text-gray-800">{pedido.usuario}</td>
                    <td className="text-gray-700">
                      {new Date(pedido.data_pedido).toLocaleString("pt-BR")}
                    </td>
                    <td>
                      <select
                        value={pedido.status}
                        onChange={(e) => atualizarStatus(pedido.id, e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        {statusOpcoes.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-gray-800">{pedido.forma_pagamento}</td>
                    <td className="text-gray-800">
                      <ul className="list-disc pl-5 space-y-1">
                        {pedido.itens.map((item, i) => (
                          <li key={i} className="text-sm">
                            {item.quantidade}× {item.produto} —{" "}
                            {Number(item.preco_unitario).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards (< md) */}
          <div className="md:hidden space-y-4">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="bg-white rounded-2xl border shadow p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Pedido #{pedido.id} — {pedido.usuario}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(pedido.data_pedido).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <select
                    value={pedido.status}
                    onChange={(e) => atualizarStatus(pedido.id, e.target.value)}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    {statusOpcoes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 text-sm text-gray-700">
                  <p className="font-medium text-gray-800">Endereço de entrega</p>
                  <p>
                    {pedido.endereco.logradouro}, {pedido.endereco.numero} — {pedido.endereco.bairro},{" "}
                    {pedido.endereco.cidade} — {pedido.endereco.estado}, CEP {pedido.endereco.cep}
                  </p>
                  {pedido.endereco.referencia && (
                    <p className="text-gray-500">Referência: {pedido.endereco.referencia}</p>
                  )}
                </div>

                <div className="mt-3">
                  <p className="font-medium text-gray-800">Itens</p>
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {pedido.itens.map((item, i) => (
                      <li key={i}>
                        {item.quantidade}× {item.produto} —{" "}
                        {Number(item.preco_unitario).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-3 text-sm text-gray-700">
                  💳 <span className="font-medium">{pedido.forma_pagamento}</span>
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
