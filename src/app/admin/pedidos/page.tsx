"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import CustomButton from "@/components/buttons/CustomButton";

// --------- Tipos ---------
interface Endereco {
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  rua: string;
  numero: string;
  referencia?: string;
}

interface ItemPedido {
  produto: string;
  quantidade: number;
  preco_unitario: number | string;
}

type StatusPagamento = "pendente" | "pago" | "falhou" | "estornado";
type StatusEntrega =
  | "em_separacao"
  | "processando"
  | "enviado"
  | "entregue"
  | "cancelado";

interface Pedido {
  id: number;
  usuario: string;
  forma_pagamento: string;
  status_pagamento: StatusPagamento;
  status_entrega: StatusEntrega;
  data_pedido: string;
  endereco: Endereco | null;
  itens: ItemPedido[];
}

// --------- Constantes ---------

const STATUS_ENTREGA_OPCOES: StatusEntrega[] = [
  "em_separacao",
  "processando",
  "enviado",
  "entregue",
  "cancelado",
];

const LABEL_STATUS_PAGAMENTO: Record<StatusPagamento, string> = {
  pendente: "Pagamento pendente",
  pago: "Pago",
  falhou: "Pagamento falhou",
  estornado: "Estornado",
};

const LABEL_STATUS_ENTREGA: Record<StatusEntrega, string> = {
  em_separacao: "Em separação",
  processando: "Processando",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const CLASSE_BADGE_PAGAMENTO: Record<StatusPagamento, string> = {
  pendente: "bg-yellow-100 text-yellow-800 border-yellow-300",
  pago: "bg-green-100 text-green-800 border-green-300",
  falhou: "bg-red-100 text-red-800 border-red-300",
  estornado: "bg-orange-100 text-orange-800 border-orange-300",
};

const CLASSE_BADGE_ENTREGA: Record<StatusEntrega, string> = {
  em_separacao: "bg-blue-100 text-blue-800 border-blue-300",
  processando: "bg-indigo-100 text-indigo-800 border-indigo-300",
  enviado: "bg-sky-100 text-sky-800 border-sky-300",
  entregue: "bg-green-100 text-green-800 border-green-300",
  cancelado: "bg-red-100 text-red-800 border-red-300",
};

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// helper para deixar o código mais legível
const formatEndereco = (endereco?: Endereco | null) => {
  if (!endereco) return "Endereço não informado";

  const { rua, numero, bairro, cidade, estado, cep } = endereco;

  return `${rua}, ${numero} — ${bairro}, ${cidade} — ${estado}, CEP ${cep}`;
};

// =======================================================
//                      COMPONENTE
// =======================================================
export default function PedidosAdminPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Buscar pedidos ----
  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("adminToken")
            : null;

        const res = await axios.get(`${API}/api/admin/pedidos`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        });

        // Backend já manda endereco como objeto e itens já prontos
        const dados: Pedido[] = (Array.isArray(res.data) ? res.data : []).map((p: any) => ({
          id: p.id,
          usuario: p.usuario,
          forma_pagamento: p.forma_pagamento,
          status_pagamento: p.status_pagamento as StatusPagamento,
          status_entrega: p.status_entrega as StatusEntrega,
          data_pedido: p.data_pedido,
          endereco: p.endereco ?? null,
          itens: (p.itens ?? []).map((item: any) => ({
            produto: item.produto,
            quantidade: item.quantidade,
            preco_unitario: item.preco_unitario,
          })),
        }));

        setPedidos(dados);
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarPedidos();
  }, []);

  // ---- Atualizar status de ENTREGA ----
  const atualizarStatusEntrega = async (
    id: number,
    novoStatus: StatusEntrega
  ) => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("adminToken")
          : null;

      await axios.put(
        `${API}/api/admin/pedidos/${id}/entrega`,
        { status_entrega: novoStatus },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );

      setPedidos((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, status_entrega: novoStatus } : p
        )
      );
    } catch (err) {
      console.error("Erro ao atualizar status de entrega:", err);
    }
  };

  // =====================================================
  //                       RENDER
  // =====================================================

  // Loading
  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Painel de Pedidos</h1>
          <Link href="/admin" className="shrink-0">
            <CustomButton
              label="Voltar"
              variant="secondary"
              isLoading={false}
              size="small"
            />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 sm:p-8">
          <p className="text-gray-700">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  //                    CONTEÚDO PRINCIPAL
  // =====================================================

  return (
    <div className="w-full">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Painel de Pedidos</h1>
        <Link href="/admin" className="shrink-0">
          <CustomButton
            label="Voltar"
            variant="secondary"
            isLoading={false}
            size="small"
          />
        </Link>
      </div>

      {/* Nenhum pedido */}
      {pedidos.length === 0 && (
        <div className="bg-white rounded-2xl border shadow p-6 sm:p-8 text-center">
          <p className="text-gray-700 mb-3">Nenhum pedido encontrado.</p>
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
                  <th>Cliente</th>
                  <th>Data</th>
                  <th className="w-60">Status</th>
                  <th>Forma de pagamento</th>
                  <th>Endereço</th>
                  <th>Itens</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pedidos.map((pedido) => (
                  <tr
                    key={pedido.id}
                    className="[&_td]:px-6 [&_td]:py-4 align-top"
                  >
                    <td className="font-semibold text-gray-900">
                      #{pedido.id}
                    </td>

                    <td className="text-gray-800">{pedido.usuario}</td>

                    <td className="text-gray-700">
                      {new Date(pedido.data_pedido).toLocaleString("pt-BR")}
                    </td>

                    {/* Status (pagamento + entrega) */}
                    <td>
                      <div className="flex flex-col gap-2">
                        {/* Pagamento */}
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${CLASSE_BADGE_PAGAMENTO[pedido.status_pagamento]}`}
                        >
                          Pagamento: {LABEL_STATUS_PAGAMENTO[pedido.status_pagamento]}
                        </span>

                        {/* Entrega + select */}
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${CLASSE_BADGE_ENTREGA[pedido.status_entrega]}`}
                          >
                            Entrega: {LABEL_STATUS_ENTREGA[pedido.status_entrega]}
                          </span>

                          <select
                            value={pedido.status_entrega}
                            onChange={(e) =>
                              atualizarStatusEntrega(
                                pedido.id,
                                e.target.value as StatusEntrega
                              )
                            }
                            className="mt-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-800"
                          >
                            {STATUS_ENTREGA_OPCOES.map((status) => (
                              <option key={status} value={status}>
                                {LABEL_STATUS_ENTREGA[status]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </td>

                    <td className="text-gray-800">{pedido.forma_pagamento}</td>

                    <td className="text-gray-800 text-sm">
                      {formatEndereco(pedido.endereco ?? undefined)}
                    </td>

                    <td className="text-gray-800">
                      <ul className="list-disc pl-5 space-y-1">
                        {pedido.itens.map((item, idx) => (
                          <li key={idx}>
                            <span className="font-medium">{item.produto}</span>{" "}
                            — {item.quantidade}x{" "}
                            {Number(item.preco_unitario).toLocaleString(
                              "pt-BR",
                              {
                                style: "currency",
                                currency: "BRL",
                              }
                            )}
                          </li>
                        ))}
                      </ul>
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
                className="bg-white rounded-2xl border shadow p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Pedido #{pedido.id} — {pedido.usuario}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(pedido.data_pedido).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  {/* Select de entrega no mobile */}
                  <select
                    value={pedido.status_entrega}
                    onChange={(e) =>
                      atualizarStatusEntrega(
                        pedido.id,
                        e.target.value as StatusEntrega
                      )
                    }
                    className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                  >
                    {STATUS_ENTREGA_OPCOES.map((status) => (
                      <option key={status} value={status}>
                        {LABEL_STATUS_ENTREGA[status]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pagamento / entrega */}
                <div className="mt-3 flex flex-col gap-2 text-xs">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 font-medium ${CLASSE_BADGE_PAGAMENTO[pedido.status_pagamento]}`}
                  >
                    Pagamento: {LABEL_STATUS_PAGAMENTO[pedido.status_pagamento]}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 font-medium ${CLASSE_BADGE_ENTREGA[pedido.status_entrega]}`}
                  >
                    Entrega: {LABEL_STATUS_ENTREGA[pedido.status_entrega]}
                  </span>
                </div>

                {/* Endereço */}
                <p className="mt-3 text-sm text-gray-700">
                  📍 {formatEndereco(pedido.endereco ?? undefined)}
                </p>

                {/* Itens */}
                <div className="mt-3">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Itens
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-800">
                    {pedido.itens.map((item, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{item.produto}</span> —{" "}
                        {item.quantidade}x{" "}
                        {Number(item.preco_unitario).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Forma de pagamento */}
                <p className="mt-3 text-sm text-gray-700">
                  💳{" "}
                  <span className="font-medium">
                    {pedido.forma_pagamento}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
