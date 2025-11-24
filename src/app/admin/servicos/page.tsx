"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import CustomButton from "@/components/buttons/CustomButton";
import ServiceFormUnificado from "@/components/admin/servicos/ServiceFormUnificado";
import ServiceCard from "@/components/admin/servicos/ServiceCard";
import { Service } from "@/types/service";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}`
    : "http://localhost:5000") + "/api/admin/servicos";

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [servicoEditado, setServicoEditado] = useState<Service | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  const authHeader: HeadersInit | undefined = token
    ? { Authorization: `Bearer ${token}` }
    : undefined;

  const carregarServicos = async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(API_BASE, {
        headers: authHeader,
        cache: "no-store",
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Falha ao buscar serviços (${res.status}). ${txt}`);
      }
      const data = await res.json();
      const lista = Array.isArray(data)
        ? data.map((s: any) => ({
          ...s,
          images: Array.isArray(s.images) ? s.images : [],
        }))
        : [];
      setServicos(lista);
    } catch (err: any) {
      console.error("Erro ao carregar serviços:", err);
      setErro(err?.message || "Erro ao carregar serviços.");
      setServicos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarServicos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removerServico = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este serviço?")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Erro ao remover serviço.");
      }
      setServicos((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Erro ao remover:", err);
      alert("Erro ao remover serviço.");
    }
  };

  const editarServico = (servico: Service) => {
    setServicoEditado(servico);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const limparEdicao = () => setServicoEditado(null);

  return (
    <div className="w-full px-3 py-5 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header com botão Voltar só no mobile */}
        <div className="relative mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#359293] sm:text-3xl">
              Serviços Cadastrados
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Adicione, edite ou remova serviços e colaboradores.
            </p>
          </div>

          {/* Botão Voltar – só mobile, topo direito do header */}
          <Link
            href="/admin"
            className="absolute -right-1 -top-3 z-10 block sm:hidden"
          >
            <CustomButton
              label="Voltar"
              variant="secondary"
              size="small"
              isLoading={false}
            />
          </Link>
        </div>

        {/* Form em card responsivo */}
        <section
          ref={formRef}
          className="mb-6 rounded-2xl bg-white p-4 shadow sm:mb-8 sm:p-6 md:p-8"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900 sm:text-xl">
            {servicoEditado
              ? "Editar Serviço"
              : "Adicionar Serviço e Colaborador"}
          </h2>

          <ServiceFormUnificado
            servicoEditado={servicoEditado}
            onSaved={() => {
              limparEdicao();
              carregarServicos();
            }}
            onCancel={limparEdicao}
          />
        </section>

        {/* Estados */}
        {loading && (
          <div className="rounded-2xl bg-white/95 p-4 text-gray-700 shadow-sm sm:p-6">
            Carregando serviços…
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700 sm:p-5">
            {erro}
          </div>
        )}

        {!loading && !erro && servicos.length === 0 && (
          <div className="rounded-2xl bg-white/95 p-4 text-gray-700 shadow-sm sm:p-6">
            Nenhum serviço cadastrado.
          </div>
        )}

        {/* Grid de cards responsiva */}
        {!loading && !erro && servicos.length > 0 && (
          <section className="mt-4">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h3 className="text-lg font-semibold text-gray-50">
                Lista de serviços
              </h3>
              <span className="text-sm text-gray-300">
                {servicos.length} itens
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {servicos.map((servico) => (
                <ServiceCard
                  key={servico.id}
                  servico={servico}
                  onRemover={removerServico}
                  onEditar={editarServico}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
