// src/app/servicos/page.tsx
"use client";

import { useMemo, useState } from "react";
import ServiceCard from "@/components/layout/ServiceCard";
import type { Service } from "@/types/service";
import { useFetchServicos } from "@/hooks/useFetchServicos";

export default function ServicosPage() {
  const [q, setQ] = useState("");
  const [especialidade, setEspecialidade] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data, meta, loading, error } = useFetchServicos({
    q,
    especialidade,
    page,
    limit: 12,
    sort: "id",
    order: "desc",
  });

  const services: Service[] = data ?? [];

  const especialidades = useMemo(() => {
    const set = new Set(
      services.map((s) => s.especialidade_nome).filter(Boolean) as string[]
    );
    return Array.from(set).sort();
  }, [services]);

  const filtered = useMemo(() => {
    // Filtro no cliente (enquanto o backend não filtra)
    const term = q.trim().toLowerCase();
    return services.filter((s) => {
      const okSpec = !especialidade || s.especialidade_nome === especialidade;
      const okTerm =
        !term ||
        s.nome?.toLowerCase().includes(term) ||
        s.descricao?.toLowerCase().includes(term) ||
        s.cargo?.toLowerCase().includes(term);
      return okSpec && okTerm;
    });
  }, [services, q, especialidade]);

  const totalPages = meta?.totalPages ?? 1;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Título */}
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Serviços</h1>
        <p className="text-gray-500 mt-1">Encontre profissionais e soluções para o seu agro.</p>
      </header>

      {/* Filtros */}
      <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nome, descrição ou cargo…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <select
          value={especialidade}
          onChange={(e) => {
            setEspecialidade(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Todas as especialidades</option>
          {especialidades.map((esp) => (
            <option key={esp} value={esp}>
              {esp}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            setQ("");
            setEspecialidade("");
            setPage(1);
          }}
          className="rounded-md bg-[#359293] text-white px-4 py-2 font-medium hover:bg-[#2d7c7d] transition-colors"
        >
          Limpar filtros
        </button>
      </section>

      {/* Estados */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-lg shadow p-4 h-56">
              <div className="h-32 bg-gray-200 rounded mb-3" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-red-600">Ocorreu um erro ao carregar os serviços. Tente novamente.</p>
      )}

      {/* Lista */}
      {!loading && !error && (
        <>
          {filtered.length === 0 ? (
            <p className="text-gray-600">Nenhum serviço encontrado com os filtros atuais.</p>
          ) : (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </section>
          )}

          {/* Paginação simples */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                className="px-3 py-2 rounded border border-gray-300 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {meta?.page ?? 1} de {totalPages}
              </span>
              <button
                className="px-3 py-2 rounded border border-gray-300 disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
