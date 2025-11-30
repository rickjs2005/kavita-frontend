// src/app/servicos/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import ServiceCard from "@/components/layout/ServiceCard";
import type { Service } from "@/types/service";
import { useFetchServicos } from "@/hooks/useFetchServicos";

export default function ServicosPage() {
  const [q, setQ] = useState("");
  // aqui guardamos o ID da especialidade (string) vindo do <select>
  const [especialidade, setEspecialidade] = useState<string>("");
  const [page, setPage] = useState(1);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const { data, meta, loading, error } = useFetchServicos({
    q,
    especialidade, // agora é ID, o hook converte para número na query ?especialidade=ID
    page,
    limit: 12,
    sort: "id",
    order: "desc",
  });

  const services: Service[] = data ?? [];

  // lista de especialidades únicas (id + nome)
  const especialidades = useMemo(() => {
  const map = new Map<number, string>();

  services.forEach((s) => {
    // força para number com segurança
    const espId = Number(s.especialidade_id);

    if (!Number.isNaN(espId) && espId > 0 && s.especialidade_nome) {
      map.set(espId, s.especialidade_nome);
    }
  });

  return Array.from(map, ([id, nome]) => ({ id, nome }));
}, [services]);

  // nome da especialidade selecionada (para mostrar no header)
  const selectedEspecialidadeNome = useMemo(() => {
    if (!especialidade) return "";
    const idNum = Number(especialidade);
    if (Number.isNaN(idNum)) return "";
    return especialidades.find((e) => e.id === idNum)?.nome ?? "";
  }, [especialidade, especialidades]);

  // filtro extra no cliente (além do backend)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const espId = especialidade ? Number(especialidade) : null;

    return services.filter((s) => {
      const okSpec =
        !espId || (s.especialidade_id && s.especialidade_id === espId);

      const okTerm =
        !term ||
        s.nome?.toLowerCase().includes(term) ||
        s.descricao?.toLowerCase().includes(term) ||
        s.cargo?.toLowerCase().includes(term);

      return okSpec && okTerm;
    });
  }, [services, q, especialidade]);

  const suggestions = useMemo(() => filtered.slice(0, 5), [filtered]);

  const totalPages = meta?.totalPages ?? 1;
  const totalServicos = meta?.total ?? services.length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#041a24] via-[#053a3f] to-[#021117] text-white">
      {/* HERO / CABEÇALHO */}
      <section className="container mx-auto px-4 pt-10 pb-10 lg:pt-16 lg:pb-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:items-center">
          {/* LADO ESQUERDO – TEXTO */}
          <div className="flex-1">
            <span className="inline-flex items-center rounded-full bg-emerald-900/40 border border-emerald-500/40 px-3 py-1 text-xs md:text-sm font-medium text-emerald-100">
              Rede de serviços do campo • Kavita
            </span>

            <h1 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight">
              Encontre{" "}
              <span className="text-emerald-300">profissionais do agro</span>{" "}
              prontos para atender a sua região.
            </h1>

            <p className="mt-4 text-sm md:text-base text-emerald-50/80 max-w-xl">
              Veterinários, agrônomos, mecânicos e prestadores de serviço
              especializados no campo. A Kavita conecta quem precisa de ajuda
              com quem sabe fazer.
            </p>

            {/* FILTROS PRINCIPAIS – versão hero */}
            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              {/* INPUT COM SUGESTÕES */}
              <div className="relative flex-1">
                <input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => {
                    // pequeno delay para permitir clique na sugestão
                    setTimeout(() => setIsInputFocused(false), 150);
                  }}
                  placeholder="Buscar por nome, descrição ou cargo..."
                  className="w-full rounded-full bg-white/95 px-4 py-3 pr-10 text-sm md:text-base text-gray-800 shadow-md outline-none ring-2 ring-transparent focus:ring-emerald-400"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-emerald-700">
                  🔍
                </span>

                {/* SUGESTÕES (AUTOCOMPLETE) */}
                {q.trim().length >= 2 && isInputFocused && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl bg-white text-gray-900 shadow-xl border border-gray-200 overflow-hidden">
                    {suggestions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Nenhum profissional encontrado para{" "}
                        <span className="font-semibold">
                          &quot;{q.trim()}&quot;
                        </span>
                        .
                      </div>
                    ) : (
                      suggestions.map((s) => (
                        <Link
                          key={s.id}
                          href={`/servicos/${s.id}`}
                          className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-emerald-50 transition-colors"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                            {s.nome?.charAt(0)?.toUpperCase() ?? "S"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">
                              {s.nome}
                            </span>
                            <span className="text-xs text-gray-500">
                              Serviço • {s.cargo || s.especialidade_nome}
                            </span>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* SELECT DE ESPECIALIDADE (AGORA COM ID) */}
              <select
                value={especialidade}
                onChange={(e) => {
                  setEspecialidade(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-60 rounded-full bg-white/95 px-4 py-3 text-sm md:text-base text-gray-800 shadow-md outline-none ring-2 ring-transparent focus:ring-emerald-400"
              >
                <option value="">Todas as especialidades</option>
                {especialidades.map((esp) => (
                  <option key={esp.id} value={esp.id}>
                    {esp.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px] md:text-xs text-emerald-50/80">
              <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1">
                ✅ Profissionais verificados
              </span>
              <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1">
                📍 Foco em produtores rurais
              </span>
              <span className="inline-flex items-center rounded-full bg-black/20 px-3 py-1">
                ⚙️ Serviços técnicos e consultorias
              </span>
            </div>
          </div>

          {/* LADO DIREITO – CARD INFORMATIVO */}
          <aside className="flex-1">
            <div className="rounded-3xl bg-black/25 border border-emerald-500/40 px-6 py-5 md:px-8 md:py-7 shadow-xl backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-emerald-200/90 mb-2">
                Visão geral
              </p>
              <h2 className="text-xl md:text-2xl font-semibold mb-4">
                Como a Kavita te ajuda na hora de contratar?
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
                <div className="rounded-2xl bg-emerald-900/40 px-4 py-3 flex flex-col">
                  <span className="text-xs text-emerald-100/70">
                    Profissionais cadastrados
                  </span>
                  <strong className="text-2xl font-bold">
                    {totalServicos || "—"}
                  </strong>
                </div>
                <div className="rounded-2xl bg-emerald-900/40 px-4 py-3 flex flex-col">
                  <span className="text-xs text-emerald-100/70">
                    Especialidades
                  </span>
                  <strong className="text-2xl font-bold">
                    {especialidades.length || "—"}
                  </strong>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-emerald-50/85">
                <li>• Encontre quem atende sua cidade ou região.</li>
                <li>• Veja cargo, especialidade e WhatsApp direto no card.</li>
                <li>• Profissionais verificados pela equipe Kavita.</li>
                <li>• Ideal para produtores rurais, fazendas e empresas.</li>
              </ul>

              <p className="mt-4 text-[11px] text-emerald-100/60">
                Cadastro sujeito à análise simples para manter a qualidade da
                rede de serviços.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* CONTEÚDO / LISTA DE SERVIÇOS */}
      <section className="bg-white rounded-t-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.35)]">
        <div className="container mx-auto px-4 py-8 md:py-10">
          {/* Header da lista */}
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                Profissionais disponíveis
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                {filtered.length} resultado(s) encontrado(s)
                {selectedEspecialidadeNome && (
                  <>
                    {" "}
                    • especialidade:{" "}
                    <span className="font-medium">
                      {selectedEspecialidadeNome}
                    </span>
                  </>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setQ("");
                setEspecialidade("");
                setPage(1);
              }}
              className="self-start inline-flex items-center justify-center rounded-full border border-emerald-600 px-4 py-2 text-xs md:text-sm font-medium text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors"
            >
              Limpar filtros
            </button>
          </header>

          {/* Estados */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-2xl shadow-sm p-4 h-64 border border-gray-100"
                >
                  <div className="h-32 bg-gray-200 rounded-xl mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {error && !loading && (
            <p className="text-red-600">
              Ocorreu um erro ao carregar os serviços. Tente novamente.
            </p>
          )}

          {/* Lista */}
          {!loading && !error && (
            <>
              {filtered.length === 0 ? (
                <p className="text-gray-600">
                  Nenhum serviço encontrado com os filtros atuais.
                </p>
              ) : (
                <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((service) => (
                    <ServiceCard
                      key={service.id}
                      servico={service}
                      readOnly
                      href={`/servicos/${service.id}`}
                      className="h-full cursor-pointer"
                    />
                  ))}
                </section>
              )}

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-colors"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Anterior
                  </button>
                  <span className="text-xs md:text-sm text-gray-600">
                    Página {meta?.page ?? 1} de {totalPages}
                  </span>
                  <button
                    className="px-4 py-2 rounded-full border border-gray-300 text-sm text-gray-700 hover:border-emerald-500 hover:text-emerald-700 disabled:opacity-40 disabled:hover:border-gray-300 disabled:hover:text-gray-700 transition-colors"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Próxima
                  </button>
                </div>
              )}

              {/* CTA TRABALHE CONOSCO */}
              <section className="mt-10 rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-6 md:px-8 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-emerald-900">
                    É profissional do agro? Trabalhe com a Kavita.
                  </h3>
                  <p className="mt-1 text-xs md:text-sm text-emerald-800 max-w-xl">
                    Se você é veterinário, agrônomo, mecânico ou presta qualquer
                    serviço voltado para o campo, faça parte da nossa rede de
                    profissionais e apareça aqui na página de serviços.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/trabalhe-conosco"
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2 text-xs md:text-sm font-semibold text-white shadow-md hover:bg-emerald-500"
                  >
                    Quero me cadastrar
                  </Link>
                  <Link
                    href="/trabalhe-conosco#como-funciona"
                    className="inline-flex items-center justify-center rounded-full border border-emerald-400 px-5 py-2 text-xs md:text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Entender como funciona
                  </Link>
                </div>
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
