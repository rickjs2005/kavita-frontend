"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CustomButton from "@/components/buttons/CustomButton";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") +
  "/api/admin/colaboradores";

type ColaboradorPendente = {
  id: number;
  nome: string;
  cargo: string | null;
  whatsapp: string;
  descricao: string | null;
  especialidade_id: number;
  verificado: number | boolean;
  created_at: string;
};

export default function ColaboradoresPendentesPage() {
  const [items, setItems] = useState<ColaboradorPendente[]>([]);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  async function carregar() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/pending`, {
        headers,
        cache: "no-store",
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao carregar colaboradores pendentes:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function aprovar(id: number) {
    if (!confirm("Confirmar verificação deste profissional?")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}/verify`, {
        method: "PUT",
        headers,
      });
      if (!res.ok) throw new Error();
      await carregar();
    } catch (err) {
      console.error("Erro ao verificar colaborador:", err);
      alert("Erro ao verificar colaborador.");
    }
  }

  async function remover(id: number) {
    if (!confirm("Deseja remover este cadastro pendente?")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error();
      await carregar();
    } catch (err) {
      console.error("Erro ao remover colaborador:", err);
      alert("Erro ao remover colaborador.");
    }
  }

  return (
    <div className="w-full px-3 py-5 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* header */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#359293] sm:text-3xl">
              Colaboradores pendentes
            </h1>
            <p className="mt-1 text-sm text-gray-300 max-w-xl">
              Cadastros enviados via <strong>Trabalhe com a Kavita</strong>.
              Aprove ou remova antes de liberar o profissional para aparecer na
              lista de serviços.
            </p>
          </div>

          <Link href="/admin/servicos">
            <CustomButton
              label="Voltar para serviços"
              variant="secondary"
              size="small"
              isLoading={false}
            />
          </Link>
        </div>

        {/* estados */}
        {loading ? (
          <div className="rounded-2xl bg-white/90 p-4 text-gray-700 shadow">
            Carregando...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white/90 p-4 text-gray-700 shadow">
            Nenhum colaborador pendente no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((c) => (
              <article
                key={c.id}
                className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
              >
                <div className="mb-2 flex-1">
                  <h2 className="text-base font-semibold text-gray-900">
                    {c.nome}
                  </h2>
                  {c.cargo && (
                    <p className="text-xs text-gray-600">Cargo: {c.cargo}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    WhatsApp: {c.whatsapp}
                  </p>
                  {c.descricao && (
                    <p className="mt-2 text-xs text-gray-700 whitespace-pre-line">
                      {c.descricao}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-gray-400">
                    Criado em:{" "}
                    {new Date(c.created_at).toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => aprovar(c.id)}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                  >
                    Aprovar e liberar
                  </button>
                  <button
                    onClick={() => remover(c.id)}
                    className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800"
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
