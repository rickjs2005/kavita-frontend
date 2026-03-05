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

// Tipos mínimos para parsear o retorno da API sem usar `any`
type ServiceApiItem = Service & {
  images?: unknown;
  verificado?: unknown;
};

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [servicoEditado, setServicoEditado] = useState<Service | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  /* ==========================
     Carregar lista de serviços
  ========================== */
  const carregarServicos = async () => {
    setLoading(true);
    setErro(null);

    try {
      const res = await fetch(API_BASE, {
        cache: "no-store",
        credentials: "include", // ✅ envia cookie HttpOnly
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        if (res.status === 401 || res.status === 403) {
          throw new Error(
            txt ||
              "Você não tem permissão para listar serviços. Faça login novamente.",
          );
        }
        throw new Error(`Falha ao buscar serviços (${res.status}). ${txt}`);
      }

      const data: unknown = await res.json();

      const lista: Service[] = Array.isArray(data)
        ? (data as ServiceApiItem[]).map((s) => ({
            ...(s as Service),
            images: Array.isArray(s.images)
              ? (s.images as Service["images"])
              : [],
            verificado: s.verificado === true || s.verificado === 1,
          }))
        : [];

      setServicos(lista);
    } catch (err: unknown) {
      console.error("Erro ao carregar serviços:", err);
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar serviços.";
      setErro(msg);
      setServicos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarServicos();
  }, []);

  /* ==========================
     Remover serviço
  ========================== */
  const removerServico = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este serviço?")) return;

    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        credentials: "include", // ✅ cookie HttpOnly
      });

      if (!res.ok) {
        const j: unknown = await res.json().catch(() => ({}));
        const maybe = j as { message?: string };

        const msg =
          maybe?.message ||
          (res.status === 401 || res.status === 403
            ? "Você não tem permissão para remover serviços. Faça login novamente."
            : "Erro ao remover serviço.");

        throw new Error(msg);
      }

      setServicos((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      console.error("Erro ao remover:", err);
      const msg =
        err instanceof Error ? err.message : "Erro ao remover serviço.";
      alert(msg);
    }
  };

  /* ==========================
     Editar serviço
  ========================== */
  const editarServico = (servico: Service) => {
    setServicoEditado(servico);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const limparEdicao = () => setServicoEditado(null);

  /* ==========================
     Verificar / Desverificar
  ========================== */
  const toggleVerificado = async (id: number, novoValor: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/verificado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // ✅ cookie HttpOnly
        body: JSON.stringify({ verificado: novoValor }),
      });

      if (!res.ok) {
        const j: unknown = await res.json().catch(() => ({}));
        const maybe = j as { message?: string };

        const msg =
          maybe?.message ||
          (res.status === 401 || res.status === 403
            ? "Você não tem permissão para atualizar verificação. Faça login novamente."
            : "Erro ao atualizar verificação.");

        throw new Error(msg);
      }

      setServicos((prev) =>
        prev.map((s) => (s.id === id ? { ...s, verificado: novoValor } : s)),
      );
    } catch (err: unknown) {
      console.error("Erro ao atualizar verificação:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "Erro ao atualizar verificação do serviço.";
      alert(msg);
    }
  };

  // 🔹 Separa aprovados x pendentes
  const servicosAprovados = servicos.filter((s) => s.verificado);
  const servicosPendentes = servicos.filter((s) => !s.verificado);

  return (
    <div className="w-full px-3 py-5 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-6xl">
        {/* HEADER */}
        <div className="relative mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#359293] sm:text-3xl">
              Serviços Cadastrados
            </h1>
            <p className="mt-1 text-sm text-gray-300">
              Adicione, edite, remova e{" "}
              <span className="font-semibold">verifique</span> colaboradores.
              Somente profissionais verificados aparecem abaixo.
            </p>

            {servicosPendentes.length > 0 && (
              <p className="mt-1 text-xs text-amber-300">
                {servicosPendentes.length} profissional
                {servicosPendentes.length > 1 && "es"} pendente
                {servicosPendentes.length > 1 && "s"} de verificação — recebido
                via Trabalhe com a Kavita.
              </p>
            )}
          </div>

          {/* Ações no desktop */}
          <div className="hidden items-center gap-2 sm:flex">
            <Link href="/admin/servicos/pendentes">
              <CustomButton
                label="Ver colaboradores pendentes"
                variant="secondary"
                size="small"
                isLoading={false}
              />
            </Link>

            <Link href="/admin">
              <CustomButton
                label="Voltar"
                variant="secondary"
                size="small"
                isLoading={false}
              />
            </Link>
          </div>

          {/* Botão Voltar – mobile */}
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

          {/* Botão Solicitações – mobile */}
          <Link href="/admin/servicos/pendentes" className="block sm:hidden">
            <CustomButton
              label="Ver colaboradores pendentes"
              variant="secondary"
              size="small"
              isLoading={false}
            />
          </Link>
        </div>

        {/* FORMULÁRIO */}
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

        {/* ESTADOS (loading / erro / lista) */}
        {loading ? (
          <div className="rounded-2xl bg-white/95 p-4 text-gray-700 shadow-sm sm:p-6">
            Carregando serviços…
          </div>
        ) : erro ? (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700 sm:p-5">
            {erro}
          </div>
        ) : servicosAprovados.length === 0 ? (
          <div className="rounded-2xl bg-white/95 p-4 text-gray-700 shadow-sm sm:p-6">
            Nenhum serviço verificado no momento.
          </div>
        ) : (
          <section className="mt-4">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h3 className="text-lg font-semibold text-gray-50">
                Lista de serviços
              </h3>
              <span className="text-sm text-gray-300">
                {servicosAprovados.length}{" "}
                {servicosAprovados.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {/* GRID DE CARDS (apenas verificados) */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {servicosAprovados.map((servico) => (
                <ServiceCard
                  key={servico.id}
                  servico={servico}
                  onRemover={removerServico}
                  onEditar={editarServico}
                  onToggleVerificado={toggleVerificado}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
