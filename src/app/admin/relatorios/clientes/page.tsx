"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import CloseButton from "@/components/buttons/CloseButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminToken");
}

type ClienteTop = {
  id: number;
  nome: string;
  email: string;
  pedidos: number;
  total_gasto: number;
};

type ClientesResponse = {
  rows: ClienteTop[];
};

export default function RelatorioClientesPage() {
  const [data, setData] = useState<ClientesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get<ClientesResponse>(
          `${API_BASE}/api/admin/relatorios/clientes-top`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setData(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar clientes top.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalGastoGeral =
    data?.rows?.reduce((acc, c) => acc + Number(c.total_gasto), 0) ?? 0;

  return (
    <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#359293]">
              Clientes Top
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Clientes que mais compraram em valor total.
            </p>
            {!loading && (
              <p className="mt-2 text-sm text-gray-200">
                <span className="font-semibold">Total gasto pelo top 20:</span>{" "}
                R$ {totalGastoGeral.toFixed(2)}
              </p>
            )}
          </div>
          <div className="mt-1 flex md:hidden">
            <CloseButton className="text-3xl text-slate-400 hover:text-slate-100" />
          </div>
        </header>

        {loading ? (
          <p className="text-sm text-gray-300">Carregando...</p>
        ) : !data || data.rows.length === 0 ? (
          <p className="text-sm text-gray-300">
            Nenhum cliente com compras registradas.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#020617]">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">
                    #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">
                    E-mail
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-300">
                    Pedidos
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-300">
                    Total gasto (R$)
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((c, index) => (
                  <tr
                    key={c.id}
                    className="border-t border-slate-800/80 hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-2 text-gray-100">{index + 1}</td>
                    <td className="px-4 py-2 text-gray-100">{c.nome}</td>
                    <td className="px-4 py-2 text-gray-100">{c.email}</td>
                    <td className="px-4 py-2 text-right text-gray-100">
                      {c.pedidos}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-100">
                      {Number(c.total_gasto).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
