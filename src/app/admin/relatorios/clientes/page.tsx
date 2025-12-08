"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import CustomButton from "@/components/buttons/CustomButton";
import CloseButton from "@/components/buttons/CloseButton";
import { KpiCard } from "@/components/admin/KpiCard";
import { formatCurrency } from "@/utils/formatters";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

type LimitOption = 10 | 25 | 50 | 100 | "all";
type SortMode = "valor" | "pedidos";

export default function RelatorioClientesPage() {
  const [data, setData] = useState<ClienteTop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔍 filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState<LimitOption>(25);
  const [sortMode, setSortMode] = useState<SortMode>("valor");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get<ClientesResponse>(
          `${API_BASE}/api/admin/relatorios/clientes-top`,
          {
            withCredentials: true, // ✅ envia cookie HttpOnly
          }
        );

        setData(res.data.rows ?? []);
      } catch (err: any) {
        console.error(err);

        let msg = "Não foi possível carregar o relatório de clientes.";
          if (err.response.status === 401 || err.response.status === 403) {
            msg =
              "Sessão expirada ou sem permissão. Faça login novamente no admin.";
          }
        
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalClientes = useMemo(() => data.length, [data]);

  const totalGastoGeral = useMemo(
    () => data.reduce((acc, c) => acc + Number(c.total_gasto || 0), 0),
    [data]
  );

  const totalPedidosGeral = useMemo(
    () => data.reduce((acc, c) => acc + Number(c.pedidos || 0), 0),
    [data]
  );

  const ticketMedioPorCliente = useMemo(
    () => (totalClientes ? totalGastoGeral / totalClientes : 0),
    [totalClientes, totalGastoGeral]
  );

  const melhorCliente = useMemo(() => {
    if (!data.length) return null;
    return data.reduce((prev, curr) =>
      Number(curr.total_gasto) > Number(prev.total_gasto) ? curr : prev
    );
  }, [data]);

  const hasData = !loading && !error && data.length > 0;

  // 🎯 aplica ordenação + busca + top N
  const filteredData = useMemo(() => {
    let result = [...data];

    // ordenação
    result.sort((a, b) => {
      if (sortMode === "valor") {
        return Number(b.total_gasto || 0) - Number(a.total_gasto || 0);
      }
      return Number(b.pedidos || 0) - Number(a.pedidos || 0);
    });

    // busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.nome.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term)
      );
    }

    // limite top N
    if (limit !== "all") {
      result = result.slice(0, limit);
    }

    return result;
  }, [data, searchTerm, limit, sortMode]);

  const visibleTotalPedidos = useMemo(
    () => filteredData.reduce((acc, c) => acc + Number(c.pedidos || 0), 0),
    [filteredData]
  );

  const visibleTotalGasto = useMemo(
    () => filteredData.reduce((acc, c) => acc + Number(c.total_gasto || 0), 0),
    [filteredData]
  );

  const visibleClientes = filteredData.length;

  const resetFilters = () => {
    setSearchTerm("");
    setLimit("all");
    setSortMode("valor");
  };

  // 📤 Exportar CSV com o resultado filtrado
  const handleExportCsv = () => {
    if (!filteredData.length) {
      toast.error("Não há dados para exportar.");
      return;
    }

    const header = [
      "posicao",
      "cliente",
      "email",
      "pedidos",
      "total_gasto_numero",
    ];

    const rows = filteredData.map((c, index) => {
      const safeNome = c.nome.replace(/"/g, '""');
      const safeEmail = c.email.replace(/"/g, '""');
      return [
        String(index + 1),
        safeNome,
        safeEmail,
        String(c.pedidos),
        String(c.total_gasto),
      ];
    });

    const csvLines = [
      header.join(";"),
      ...rows.map((r) => r.map((field) => `"${field}"`).join(";")),
    ];

    const csv = csvLines.join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "relatorio_clientes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV exportado com sucesso!");
  };

  return (
    <main className="min-h-screen bg-[#050816] text-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="pr-10 sm:pr-0">
            <p className="text-[11px] uppercase tracking-[0.25em] text-teal-400/80">
              Inteligência de clientes
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#35c2c4] sm:text-3xl">
              Relatório de Clientes
            </h1>
            <p className="mt-1 max-w-xl text-xs text-slate-300 sm:text-sm">
              Ranking dos clientes que mais compram. Ideal para definir
              campanhas VIP, cupons exclusivos e ações de fidelização dignas
              de um marketplace gigante.
            </p>

            {hasData && (
              <p className="mt-2 text-xs font-semibold text-slate-100 sm:text-sm">
                Total gasto pelo ranking:{" "}
                <span className="text-[#35c2c4]">
                  {formatCurrency(totalGastoGeral)}
                </span>
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
              Carregando relatório de clientes...
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

        {!loading && !error && data.length === 0 && (
          <section className="flex min-h-[40vh] items-center justify-center">
            <div className="max-w-md rounded-2xl border border-dashed border-slate-600 bg-slate-950/50 px-5 py-6 text-center text-sm text-slate-300">
              Ainda não há clientes com compras suficientes para montar o
              ranking.
              <p className="mt-2 text-[11px] text-slate-400">
                Assim que os pedidos começarem a entrar, você verá aqui os
                melhores clientes, como nos grandes e-commerces.
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
                label="Clientes no ranking"
                value={totalClientes}
                helper="Total de clientes considerados neste relatório."
                icon={<span>👥</span>}
                variant="default"
              />
              <KpiCard
                label="Total gasto (ranking)"
                value={formatCurrency(totalGastoGeral)}
                helper="Somatória de todos os gastos dos clientes listados."
                icon={<span>💰</span>}
                variant="success"
              />
              <KpiCard
                label="Pedidos totais"
                value={totalPedidosGeral}
                helper="Quantidade de pedidos de todos os clientes do ranking."
                icon={<span>🧾</span>}
                variant="default"
              />
              <KpiCard
                label="Ticket médio por cliente"
                value={formatCurrency(ticketMedioPorCliente)}
                helper="Média de gasto por cliente deste ranking."
                icon={<span>💳</span>}
                variant="warning"
              />
            </div>

            {/* MELHOR CLIENTE */}
            {melhorCliente && (
              <div
                className="
                  mt-6 flex flex-col gap-3 rounded-2xl border border-amber-500/25
                  bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-transparent
                  px-4 py-3 text-xs text-amber-100 sm:flex-row sm:items-center sm:justify-between sm:text-sm
                "
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-lg">👑</span>
                  <div>
                    <p className="font-semibold">
                      Cliente destaque: {melhorCliente.nome}
                    </p>
                    <p className="mt-0.5 text-[11px] text-amber-200/80 sm:text-xs">
                      {melhorCliente.email} — {melhorCliente.pedidos} pedido
                      {melhorCliente.pedidos !== 1 ? "s" : ""} |{" "}
                      {formatCurrency(Number(melhorCliente.total_gasto))} em
                      compras
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-amber-200/80 sm:text-xs sm:text-right">
                  Perfeito para campanhas VIP, cupons exclusivos e ações de
                  fidelização automatizadas.
                </p>
              </div>
            )}

            {/* LISTA / RANKING */}
            <div className="mt-8 space-y-3">
              {/* HEADER DO RANKING + FILTROS */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                    Ranking de clientes por valor gasto
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                    Use a busca, o limite de resultados e a ordenação para
                    analisar grupos específicos como top 10, top 50, ou os
                    clientes com mais pedidos.
                  </p>
                </div>

                {/* BLOCO DE FILTROS – MOBILE: tudo empilhado full width */}
                <div className="flex w-full flex-col gap-3 sm:max-w-xl lg:w-auto">
                  {/* Toggle + Export */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <div
                      className="
                        inline-flex w-full flex-1 rounded-xl border border-slate-700
                        bg-slate-950/80 p-0.5 text-[11px] sm:w-auto
                      "
                    >
                      <button
                        type="button"
                        onClick={() => setSortMode("valor")}
                        className={`w-1/2 rounded-lg px-3 py-1.5 transition sm:w-auto ${
                          sortMode === "valor"
                            ? "bg-teal-500 text-slate-950"
                            : "text-slate-300 hover:text-teal-300"
                        }`}
                      >
                        Ordenar por valor
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortMode("pedidos")}
                        className={`w-1/2 rounded-lg px-3 py-1.5 transition sm:w-auto ${
                          sortMode === "pedidos"
                            ? "bg-teal-500 text-slate-950"
                            : "text-slate-300 hover:text-teal-300"
                        }`}
                      >
                        Ordenar por pedidos
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="
                        w-full rounded-xl border border-teal-500/60 bg-teal-500/10
                        px-3 py-1.5 text-center text-[11px] font-semibold text-teal-300
                        hover:bg-teal-500 hover:text-slate-950 sm:w-auto
                      "
                    >
                      Exportar CSV
                    </button>
                  </div>

                  {/* Busca + limite + limpar */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <div className="relative w-full sm:w-64">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome ou e-mail"
                        className="
                          w-full rounded-xl border border-slate-700 bg-slate-950/80
                          px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500
                          outline-none ring-0 transition
                          focus:border-teal-500 focus:ring-1 focus:ring-teal-500
                        "
                      />
                    </div>

                    <div className="flex w-full flex-col gap-2 min-[420px]:flex-row min-[420px]:items-center sm:w-auto">
                      <select
                        value={limit}
                        onChange={(e) =>
                          setLimit(
                            e.target.value === "all"
                              ? "all"
                              : (Number(
                                  e.target.value
                                ) as LimitOption)
                          )
                        }
                        className="
                          w-full rounded-xl border border-slate-700 bg-slate-950/80
                          px-3 py-2 text-xs text-slate-100
                          outline-none ring-0 transition
                          focus:border-teal-500 focus:ring-1 focus:ring-teal-500
                          sm:w-auto
                        "
                      >
                        <option value={10}>Top 10</option>
                        <option value={25}>Top 25</option>
                        <option value={50}>Top 50</option>
                        <option value={100}>Top 100</option>
                        <option value="all">Todos</option>
                      </select>

                      {(searchTerm || limit !== "all" || sortMode !== "valor") && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="
                            w-full rounded-xl border border-slate-700 bg-slate-900/80
                            px-3 py-2 text-[11px] text-slate-200
                            hover:border-teal-500 hover:text-teal-400
                            sm:w-auto
                          "
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nenhum cliente para o filtro atual */}
              {filteredData.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-4 py-5 text-center text-xs text-slate-300">
                  Nenhum cliente encontrado para esse filtro.
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ajuste a busca ou clique em <span className="font-semibold">“Limpar”</span>{" "}
                    para ver novamente todo o ranking.
                  </p>
                </div>
              ) : (
                <>
                  {/* DESKTOP / TABLET: tabela completa */}
                  <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 md:block">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-xs text-slate-200 sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/80">
                            <th className="px-4 py-3 font-semibold">Posição</th>
                            <th className="px-4 py-3 font-semibold">Cliente</th>
                            <th className="px-4 py-3 font-semibold">E-mail</th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Pedidos
                            </th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Total gasto
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.map((cliente, index) => (
                            <tr
                              key={cliente.id}
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
                                  {cliente.nome}
                                </p>
                              </td>
                              <td className="px-4 py-2.5 align-middle">
                                <p className="truncate text-[12px] text-slate-300 sm:text-sm">
                                  {cliente.email}
                                </p>
                              </td>
                              <td className="px-4 py-2.5 text-right align-middle">
                                {cliente.pedidos}
                              </td>
                              <td className="px-4 py-2.5 text-right align-middle">
                                {formatCurrency(
                                  Number(cliente.total_gasto || 0)
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-900/90">
                            <td className="px-4 py-3 font-semibold" colSpan={3}>
                              Totais do resultado filtrado
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-100">
                              {visibleTotalPedidos}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-[#35c2c4]">
                              {formatCurrency(visibleTotalGasto)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* MOBILE: cards por cliente (mais legível) */}
                  <div className="space-y-3 md:hidden">
                    {filteredData.map((cliente, index) => (
                      <div
                        key={cliente.id}
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
                                {cliente.nome}
                              </p>
                            </div>
                            <p className="mt-1 max-w-[240px] truncate text-[11px] text-slate-300">
                              {cliente.email}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[11px] font-semibold text-[#35c2c4]">
                              {formatCurrency(
                                Number(cliente.total_gasto || 0)
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {cliente.pedidos} pedido
                              {cliente.pedidos !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          Totais do resultado filtrado
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px]">
                          {visibleClientes} clientes
                        </span>
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px]">
                          {visibleTotalPedidos} pedidos
                        </span>
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-[#35c2c4]">
                          {formatCurrency(visibleTotalGasto)}
                        </span>
                      </div>
                    </div>
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
