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
      const res = await fetch(API_BASE, { headers: authHeader, cache: "no-store" });
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
    <div className="w-full">
      {/* Header + Voltar */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Serviços Cadastrados
          </h1>
          <p className="text-gray-600 mt-1">
            Adicione, edite ou remova serviços e colaboradores.
          </p>
        </div>
        <Link href="/admin" className="shrink-0">
          <CustomButton label="Voltar" variant="secondary" size="small" isLoading={false} />
        </Link>
      </div>

      {/* Form em card responsivo */}
      <section
        ref={formRef}
        className="bg-white rounded-2xl shadow p-4 sm:p-6 md:p-8 mb-6 sm:mb-8"
      >
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
          {servicoEditado ? "Editar Serviço" : "Adicionar Serviço e Colaborador"}
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
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 text-gray-600">
          Carregando serviços…
        </div>
      )}

      {!loading && erro && (
        <div className="rounded-2xl border border-red-300 bg-red-50 text-red-700 p-4 sm:p-5">
          {erro}
        </div>
      )}

      {!loading && !erro && servicos.length === 0 && (
        <div className="bg-white rounded-2xl shadow p-4 sm:p-6 text-gray-600">
          Nenhum serviço cadastrado.
        </div>
      )}

      {/* Grid de cards responsiva */}
      {!loading && !erro && servicos.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Lista de serviços</h3>
            <span className="text-sm text-gray-500">{servicos.length} itens</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
  );
}
