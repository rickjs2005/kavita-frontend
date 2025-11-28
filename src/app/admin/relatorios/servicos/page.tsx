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

type EspecialidadeStats = {
  especialidade_id: number | null;
  especialidade_nome: string | null;
  total_servicos: number;
};

type ServicosResponse = {
  totalServicos: number;
  labels: string[];
  values: number[];
  porEspecialidade: EspecialidadeStats[];
};

export default function RelatorioServicosPage() {
  const [data, setData] = useState<ServicosResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    const fetchData = async () => {
      try {
        const res = await axios.get<ServicosResponse>(
          `${API_BASE}/api/admin/relatorios/servicos`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setData(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar relatório de serviços.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#359293]">
              Serviços / Colaboradores
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Quantidade de serviços por especialidade dos colaboradores.
            </p>
            {!loading && data && (
              <p className="mt-2 text-sm text-gray-200">
                <span className="font-semibold">Total de serviços:</span>{" "}
                {data.totalServicos}
              </p>
            )}
          </div>
          <div className="mt-1 flex md:hidden">
            <CloseButton className="text-3xl text-slate-400 hover:text-slate-100" />
          </div>
        </header>

        {loading ? (
          <p className="text-sm text-gray-300">Carregando...</p>
        ) : !data || data.porEspecialidade.length === 0 ? (
          <p className="text-sm text-gray-300">
            Nenhum serviço cadastrado no momento.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#020617]">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/60">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">
                    Especialidade
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-300">
                    Total de serviços
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.porEspecialidade.map((e) => (
                  <tr
                    key={e.especialidade_id ?? e.especialidade_nome ?? "sem"}
                    className="border-t border-slate-800/80 hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-2 text-gray-100">
                      {e.especialidade_nome || "Sem categoria"}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-100">
                      {e.total_servicos}
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
