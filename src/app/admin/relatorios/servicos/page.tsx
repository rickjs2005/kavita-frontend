"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";
import { KpiCard } from "@/components/admin/KpiCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

// 🔹 tipos para ranking de colaboradores (melhores avaliados)
type ServicoRankingRow = {
  id: number;
  nome: string;
  cargo: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  total_servicos: number | null;
  views_count: number | null;
  whatsapp_clicks: number | null;
  especialidade_nome: string | null;
};

type ServicosRankingResponse = {
  labels: string[];
  values: number[];
  rows: ServicoRankingRow[];
};

export default function RelatorioServicosPage() {
  const [data, setData] = useState<ServicosResponse | null>(null);
  const [ranking, setRanking] = useState<ServicosRankingResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ====== FETCH ======
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingRanking(true);
        setError(null);

        const config = { withCredentials: true as const }; // ✅ cookie HttpOnly

        const [resServicos, resRanking] = await Promise.all([
          axios.get<ServicosResponse>(
            `${API_BASE}/api/admin/relatorios/servicos`,
            config
          ),
          axios.get<ServicosRankingResponse>(
            `${API_BASE}/api/admin/relatorios/servicos-ranking`,
            config
          ),
        ]);

        setData(resServicos.data);
        setRanking(resRanking.data);
      } catch (err: any) {
        console.error(err);

        let msg = "Não foi possível carregar o relatório de serviços.";
          if (err.response.status === 401 || err.response.status === 403) {
            msg =
              "Sessão expirada ou sem permissão. Faça login novamente no admin.";
          }
        

        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
        setLoadingRanking(false);
      }
    };

    fetchData();
  }, []);

  const hasData =
    !loading && !error && data && data.porEspecialidade.length > 0;

  // ====== DERIVADOS / MÉTRICAS ======
  const totalServicos = useMemo(
    () => (data ? Number(data.totalServicos || 0) : 0),
    [data]
  );

  const totalEspecialidades = useMemo(
    () => (data ? data.porEspecialidade.length : 0),
    [data]
  );

  const especialidadeDestaque = useMemo(() => {
    if (!data || !data.porEspecialidade.length) return null;
    return data.porEspecialidade.reduce((prev, curr) =>
      curr.total_servicos > prev.total_servicos ? curr : prev
    );
  }, [data]);

  const totalSemCategoria = useMemo(() => {
    if (!data) return 0;
    const semCat = data.porEspecialidade.find(
      (e) => !e.especialidade_id && !e.especialidade_nome
    );
    return semCat ? Number(semCat.total_servicos || 0) : 0;
  }, [data]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.porEspecialidade.map((item) => ({
      label: item.especialidade_nome || "Sem categoria",
      total: item.total_servicos,
    }));
  }, [data]);

  // ====== DERIVADOS DO RANKING (MELHORES AVALIADOS) ======
  const rankingComAval = useMemo(() => {
    if (!ranking || !ranking.rows) return [];
    // só quem tem pelo menos 1 avaliação
    return ranking.rows.filter((r) => (r.rating_count ?? 0) > 0);
  }, [ranking]);

  const melhorAvaliado = useMemo(() => {
    if (!rankingComAval.length) return null;

    return rankingComAval.reduce((prev, curr) => {
      const prevRating = prev.rating_avg ?? 0;
      const currRating = curr.rating_avg ?? 0;

      if (currRating === prevRating) {
        const prevCount = prev.rating_count ?? 0;
        const currCount = curr.rating_count ?? 0;
        return currCount > prevCount ? curr : prev;
      }
      return currRating > prevRating ? curr : prev;
    });
  }, [rankingComAval]);

  return (
    <main className="min-h-screen bg-[#050816] text-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="pr-10 sm:pr-0">
            <p className="text-[11px] uppercase tracking-[0.25em] text-teal-400/80">
              Inteligência de serviços
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#35c2c4] sm:text-3xl">
              Relatório de Serviços / Colaboradores
            </h1>
            <p className="mt-1 max-w-xl text-xs text-slate-300 sm:text-sm">
              Visão geral das especialidades e serviços oferecidos pelos
              colaboradores. Ideal para entender quais áreas estão mais
              fortes e onde vale investir em novos profissionais.
            </p>

            {hasData && (
              <p className="mt-2 text-xs font-semibold text-slate-100 sm:text-sm">
                Total de serviços cadastrados:{" "}
                <span className="text-[#35c2c4]">{totalServicos}</span>
              </p>
            )}
          </div>

          {/* Navegação (X no mobile / Voltar no desktop) */}
          <div className="absolute right-0 top-0 flex items-center gap-2 sm:static">
            <div className="block sm:hidden">
              <CloseButton className="text-3xl text-slate-200 hover:text-[#35c2c4]" />
            </div>

            <div className="hidden sm:block">
              <CustomButton
                label="← Voltar para relatórios"
                href="/admin/relatorios"
                variant="secondary"
                size="small"
                isLoading={false}
              />
            </div>
          </div>
        </header>

        {/* ESTADOS GLOBAIS */}
        {loading && (
          <section className="flex min-h-[40vh] items-center justify-center">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 px-5 py-4 text-sm text-slate-200">
              Carregando relatório de serviços...
            </div>
          </section>
        )}

        {!loading && error && (
          <section className="flex min-h-[40vh] items-center justify-center">
            <div className="max-w-md rounded-2xl border border-red-500/40 bg-red-950/20 px-5 py-4 text-center text-sm text-red-100">
              {error}
            </div>
          </section>
        )}

        {!loading && !error && data && data.porEspecialidade.length === 0 && (
          <section className="flex min-h-[40vh] items-center justify-center">
            <div className="max-w-md rounded-2xl border border-dashed border-slate-600 bg-slate-950/50 px-5 py-6 text-center text-sm text-slate-300">
              Ainda não há serviços cadastrados para montar este relatório.
              <p className="mt-2 text-[11px] text-slate-400">
                Assim que você cadastrar colaboradores e especialidades, verá
                aqui uma visão completa digna dos grandes e-commerces.
              </p>
            </div>
          </section>
        )}

        {/* CONTEÚDO PRINCIPAL */}
        {hasData && (
          <section
            className="
              rounded-3xl border border-slate-800 bg-slate-950/80
              p-4 shadow-[0_18px_45px_rgba(0,0,0,0.65)] backdrop-blur
              sm:p-6
            "
          >
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Serviços cadastrados"
                value={totalServicos}
                helper="Quantidade total de serviços/colaboradores ativos."
                icon={<span>🛠️</span>}
                variant="default"
              />
              <KpiCard
                label="Especialidades com serviços"
                value={totalEspecialidades}
                helper="Quantas especialidades possuem pelo menos um serviço."
                icon={<span>📚</span>}
                variant="success"
              />
              <KpiCard
                label="Serviços sem categoria"
                value={totalSemCategoria}
                helper="Colaboradores ainda não vinculados a uma especialidade."
                icon={<span>⚠️</span>}
                variant="warning"
              />
              <KpiCard
                label="Especialidade destaque"
                value={especialidadeDestaque?.especialidade_nome || "—"}
                helper={
                  especialidadeDestaque
                    ? `Com ${especialidadeDestaque.total_servicos} serviço(s) cadastrado(s).`
                    : "Ainda não há especialidade com destaque."
                }
                icon={<span>👑</span>}
                variant="default"
              />
            </div>

            {/* GRÁFICO + RESUMO */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {/* Gráfico ocupa 2 colunas no desktop */}
              <div className="space-y-3 lg:col-span-2">
                <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                  Serviços por especialidade
                </h2>
                <p className="text-[11px] text-slate-400 sm:text-xs">
                  Ideal para ver onde estão concentrados os serviços do seu
                  marketplace rural e quais especialidades podem precisar de
                  reforço.
                </p>
                <div className="h-64 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 sm:p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: "#1f2937" }}
                      />
                      <YAxis
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: "#1f2937" }}
                      />
                      <Tooltip
                        formatter={(value: number) =>
                          `${value} serviço${value === 1 ? "" : "s"}`
                        }
                        labelFormatter={(label: string) =>
                          `Especialidade: ${label}`
                        }
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.75rem",
                          color: "#020617",
                          fontSize: 12,
                          boxShadow: "0 15px 35px rgba(15,23,42,0.22)",
                        }}
                      />
                      <Bar
                        dataKey="total"
                        radius={[10, 10, 0, 0]}
                        fill="#35c2c4"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Resumo rápido / Top 3 */}
              <div className="space-y-3 lg:col-span-1">
                <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                  Visão rápida
                </h2>
                <div className="space-y-2 text-xs text-slate-300 sm:text-sm">
                  <p>
                    •{" "}
                    <span className="font-semibold text-slate-100">
                      {totalEspecialidades}
                    </span>{" "}
                    especialidade(s) com serviços cadastrados.
                  </p>
                  <p>
                    •{" "}
                    <span className="font-semibold text-slate-100">
                      {totalSemCategoria}
                    </span>{" "}
                    serviço(s) sem categoria (cuidar para não perder
                    oportunidades de filtro e busca).
                  </p>
                  <p>
                    • Use esse panorama para decidir onde investir em novas
                    campanhas, treinamentos ou contratação de mais
                    colaboradores.
                  </p>
                </div>
              </div>
            </div>

            {/* RANKING / LISTA – ESPECIALIDADES */}
            <div className="mt-8 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                  Ranking de especialidades por quantidade de serviços
                </h2>
                <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                  Veja quais áreas estão dominando o catálogo e quais ainda
                  podem ser expandidas com novos colaboradores.
                </p>
              </div>

              {/* DESKTOP / TABLET: tabela completa */}
              <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 md:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-slate-200 sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80">
                        <th className="px-4 py-3 font-semibold">Posição</th>
                        <th className="px-4 py-3 font-semibold">
                          Especialidade
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Serviços
                        </th>
                        <th className="px-4 py-3 text-right font-semibold">
                          Participação
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.porEspecialidade.map((esp, index) => {
                        const percent =
                          totalServicos > 0
                            ? (esp.total_servicos / totalServicos) * 100
                            : 0;

                        return (
                          <tr
                            key={
                              esp.especialidade_id ??
                              esp.especialidade_nome ??
                              `esp-${index}`
                            }
                            className="border-b border-slate-900/80 last:border-none hover:bg-slate-900/40"
                          >
                            <td className="px-4 py-2.5 align-middle">
                              <span
                                className={`
                                 inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold
                                  ${
                                    index === 0
                                      ? "bg-amber-500/20 text-amber-100"
                                      : index === 1
                                      ? "bg-slate-700/60 text-slate-100"
                                      : index === 2
                                      ? "bg-orange-500/15 text-orange-100"
                                      : "bg-slate-900/80 text-slate-100"
                                  }
                                `}
                              >
                                #{index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 align-middle">
                              <p className="text-[13px] font-medium text-slate-50 sm:text-sm">
                                {esp.especialidade_nome || "Sem categoria"}
                              </p>
                            </td>
                            <td className="px-4 py-2.5 text-right align-middle">
                              {esp.total_servicos}
                            </td>
                            <td className="px-4 py-2.5 text-right align-middle">
                              {percent.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-slate-900/90">
                        <td
                          className="px-4 py-3 font-semibold"
                          colSpan={2}
                        >
                          Totais
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-100">
                          {totalServicos}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#35c2c4]">
                          100%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MOBILE: cards por especialidade */}
              <div className="space-y-3 md:hidden">
                {data.porEspecialidade.map((esp, index) => {
                  const percent =
                    totalServicos > 0
                      ? (esp.total_servicos / totalServicos) * 100
                      : 0;

                  return (
                    <div
                      key={
                        esp.especialidade_id ??
                        esp.especialidade_nome ??
                        `esp-mobile-${index}`
                      }
                      className="rounded-2xl border border-slate-800 bg-slate-950/90 p-3 text-xs shadow-lg shadow-black/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`
                                inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold
                                ${
                                  index === 0
                                    ? "bg-amber-500/25 text-amber-100"
                                    : index === 1
                                    ? "bg-slate-700/70 text-slate-100"
                                    : index === 2
                                    ? "bg-orange-500/20 text-orange-100"
                                    : "bg-slate-800 text-slate-100"
                                }
                              `}
                            >
                              #{index + 1}
                            </span>
                            <p className="text-[12px] font-semibold text-slate-50">
                              {esp.especialidade_nome || "Sem categoria"}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-semibold text-[#35c2c4]">
                            {esp.total_servicos} serviço
                            {esp.total_servicos === 1 ? "" : "s"}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {percent.toFixed(1)}% do total
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-[11px] text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      Totais do relatório
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px]">
                      {totalEspecialidades} especialidades
                    </span>
                    <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px]">
                      {totalServicos} serviços
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RANKING DE COLABORADORES MELHOR AVALIADOS */}
            <div className="mt-10 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                    Colaboradores mais bem avaliados
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                    Baseado na nota média das avaliações registradas para cada
                    profissional.
                  </p>
                </div>

                {!loadingRanking && melhorAvaliado && (
                  <p className="text-[11px] text-slate-300 sm:text-xs">
                    Destaque:{" "}
                    <span className="font-semibold text-[#35c2c4]">
                      {melhorAvaliado.nome}
                    </span>{" "}
                    — nota média{" "}
                    <span className="font-semibold">
                      {Number(melhorAvaliado.rating_avg || 0).toFixed(1)}
                    </span>{" "}
                    ({melhorAvaliado.rating_count} avaliação
                    {melhorAvaliado.rating_count === 1 ? "" : "s"})
                  </p>
                )}
              </div>

              {loadingRanking ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-[11px] text-slate-300">
                  Carregando ranking de colaboradores...
                </div>
              ) : !rankingComAval.length ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-3 text-[11px] text-slate-400">
                  Ainda não há avaliações suficientes para montar este ranking.
                </div>
              ) : (
                <>
                  {/* Desktop: tabela */}
                  <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 md:block">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs text-slate-200 sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/80">
                            <th className="px-4 py-3 font-semibold">
                              Posição
                            </th>
                            <th className="px-4 py-3 font-semibold">
                              Profissional
                            </th>
                            <th className="px-4 py-3 font-semibold">
                              Especialidade
                            </th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Nota média
                            </th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Avaliações
                            </th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Serviços
                            </th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Cliques WhatsApp
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rankingComAval.map((row, index) => (
                            <tr
                              key={row.id}
                              className="border-b border-slate-900/80 last:border-none hover:bg-slate-900/40"
                            >
                              <td className="px-4 py-2.5 align-middle">
                                <span
                                  className={`
                                    inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold
                                    ${
                                      index === 0
                                        ? "bg-amber-500/20 text-amber-100"
                                        : index === 1
                                        ? "bg-slate-700/60 text-slate-100"
                                        : index === 2
                                        ? "bg-orange-500/15 text-orange-100"
                                        : "bg-slate-900/80 text-slate-100"
                                    }
                                  `}
                                >
                                  #{index + 1}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 align-middle">
                                <p className="text-[13px] font-medium text-slate-50 sm:text-sm">
                                  {row.nome}
                                </p>
                                {row.cargo && (
                                  <p className="text-[11px] text-slate-400">
                                    {row.cargo}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-2.5 align-middle">
                                <p className="text-[12px] text-slate-200">
                                  {row.especialidade_nome || "—"}
                                </p>
                              </td>
                              <td className="px-4 py-2.5 text-right align-middle">
                                {Number(row.rating_avg || 0).toFixed(1)}
                              </td>
                              <td className="px-4 py-2.5 text-right align-middle">
                                {row.rating_count}
                              </td>
                              <td className="px-4 py-2.5 text-right align-middle">
                                {row.total_servicos ?? 0}
                              </td>
                              <td className="px-4 py-2.5 text-right align-middle">
                                {row.whatsapp_clicks ?? 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile: cards */}
                  <div className="space-y-3 md:hidden">
                    {rankingComAval.map((row, index) => (
                      <div
                        key={row.id}
                        className="rounded-2xl border border-slate-800 bg-slate-950/90 p-3 text-xs shadow-lg shadow-black/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`
                                  inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold
                                  ${
                                    index === 0
                                      ? "bg-amber-500/25 text-amber-100"
                                      : index === 1
                                      ? "bg-slate-700/70 text-slate-100"
                                      : index === 2
                                      ? "bg-orange-500/20 text-orange-100"
                                      : "bg-slate-800 text-slate-100"
                                  }
                                `}
                              >
                                #{index + 1}
                              </span>
                              <p className="text-[12px] font-semibold text-slate-50">
                                {row.nome}
                              </p>
                            </div>
                            {row.cargo && (
                              <p className="text-[11px] text-slate-400">
                                {row.cargo}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-400">
                              Especialidade:{" "}
                              {row.especialidade_nome || "—"}
                            </p>
                          </div>
                          <div className="text-right text-[11px] text-slate-300">
                            <p>
                              ⭐{" "}
                              <span className="font-semibold">
                                {Number(row.rating_avg || 0).toFixed(1)}
                              </span>
                            </p>
                            <p>{row.rating_count} avaliação(s)</p>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                          <span className="rounded-full bg-slate-900 px-2 py-0.5">
                            {row.total_servicos ?? 0} serviço(s)
                          </span>
                          <span className="rounded-full bg-slate-900 px-2 py-0.5">
                            {row.whatsapp_clicks ?? 0} clique(s) WhatsApp
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
