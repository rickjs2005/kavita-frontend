"use client"; // Isso aqui avisa que a tela vai funcionar no navegador do usuário

import { useEffect, useState } from "react"; // usamos para guardar informações e fazer algo quando a página abre
import axios from "axios"; // biblioteca que ajuda a conversar com o servidor

// 💌 Aqui explicamos como é o endereço da entrega
interface Endereco {
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  referencia?: string; // esse é opcional, pode ter ou não
}

// 📦 Aqui mostramos como é um item do pedido
interface ItemPedido {
  produto: string;
  quantidade: number;
  preco_unitario: number | string; // pode ser número ou texto
}

// 📋 E aqui como é o pedido inteiro
interface Pedido {
  id: number;
  usuario: string;
  forma_pagamento: string;
  status: string;
  data_pedido: string;
  endereco: Endereco;
  itens: ItemPedido[];
}

// 🛠️ Lista de status possíveis para o pedido
const statusOpcoes = ["pendente", "processando", "enviado", "entregue", "cancelado"];

const PedidosAdminPage = () => {
  // Aqui guardamos todos os pedidos que vierem do servidor
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  // Serve para mostrar a mensagem "carregando..." até os dados chegarem
  const [loading, setLoading] = useState(true);

  // Quando a página abrir, vamos buscar os pedidos
  useEffect(() => {
    buscarPedidos();
  }, []);

  // Essa função vai até o servidor pegar os pedidos salvos
  const buscarPedidos = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/pedidos", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`, // usamos o token do admin
        },
        withCredentials: true, // mandamos cookies se precisar
      });
      setPedidos(res.data as Pedido[]); // guardamos os pedidos na caixinha
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
    } finally {
      setLoading(false); // quando acabar, tiramos o "carregando"
    }
  };

  // Essa função atualiza o status de um pedido (ex: de "pendente" para "enviado")
  const atualizarStatus = async (id: number, novoStatus: string) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/pedidos/${id}/status`,
        { status: novoStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      // Atualiza na tela o status do pedido também
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: novoStatus } : p))
      );
    } catch (err) {
      console.error("Erro ao atualizar status:", err);
    }
  };

  // Enquanto os dados não chegam, mostramos "Carregando..."
  if (loading) return <p className="p-4">Carregando pedidos...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Painel de Pedidos</h1>

      {/* Se não tiver nenhum pedido, mostramos uma mensagem */}
      {pedidos.length === 0 ? (
        <p className="text-gray-600">Nenhum pedido encontrado.</p>
      ) : (
        // Aqui mostramos cada pedido da lista
        pedidos.map((pedido) => (
          <div
            key={pedido.id}
            className="border border-gray-300 rounded-xl p-6 mb-6 shadow-md"
          >
            {/* Cabeçalho do pedido */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="font-semibold text-lg">
                  Pedido #{pedido.id} - {pedido.usuario}
                </p>
                <p className="text-sm text-gray-600">
                  Realizado em:{" "}
                  {new Date(pedido.data_pedido).toLocaleString("pt-BR")}
                </p>
              </div>

              {/* Aqui é o menu para mudar o status do pedido */}
              <select
                value={pedido.status}
                onChange={(e) => atualizarStatus(pedido.id, e.target.value)}
                className="border rounded px-3 py-1"
              >
                {statusOpcoes.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Endereço do pedido */}
            <div className="mb-4">
              <h2 className="font-semibold text-gray-800">Endereço de entrega:</h2>
              <p className="text-sm text-gray-700">
                {pedido.endereco.logradouro}, {pedido.endereco.numero} -{" "}
                {pedido.endereco.bairro}, {pedido.endereco.cidade} -{" "}
                {pedido.endereco.estado}, CEP {pedido.endereco.cep}
              </p>
              {pedido.endereco.referencia && (
                <p className="text-sm text-gray-500">
                  Referência: {pedido.endereco.referencia}
                </p>
              )}
            </div>

            {/* Itens comprados */}
            <div className="mb-4">
              <h2 className="font-semibold text-gray-800">Itens:</h2>
              <ul className="list-disc pl-6 text-sm text-gray-700">
                {pedido.itens.map((item, idx) => (
                  <li key={idx}>
                    {item.quantidade}x {item.produto} —{" "}
                    {Number(item.preco_unitario).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </li>
                ))}
              </ul>
            </div>

            {/* Forma de pagamento */}
            <p className="text-sm text-gray-600">
              💳 Forma de pagamento:{" "}
              <span className="font-medium">{pedido.forma_pagamento}</span>
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default PedidosAdminPage; // Exportamos para que o Next.js possa mostrar essa tela
// Assim, quando o admin acessar /admin/pedidos, verá essa página com todos os pedidos
// Ele pode ver os detalhes, mudar o status e acompanhar tudo de forma fácil