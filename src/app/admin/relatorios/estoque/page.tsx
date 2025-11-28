"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import CloseButton from "@/components/buttons/CloseButton";
import CustomButton from "@/components/buttons/CustomButton";
import { formatCurrency } from "@/utils/formatters";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("adminToken");
}

interface ProdutoEstoque {
  id: number;
  name: string;
  quantity: number;
  price: number; // em REAIS vindos do backend
}

type LimitOption = 10 | 25 | 50 | "all";
type SortMode = "risco" | "quantidade";

export default function RelatorioEstoquePage() {
  const [rows, setRows] = useState<ProdutoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔍 filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [limit, setLimit] = useState<LimitOption>("all");
  const [sortMode, setSortMode] = useState<SortMode>("risco");

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      toast.error("Sessão expirada. Faça login novamente.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get<ProdutoEstoque[]>(
          `${API_BASE}/api/admin/relatorios/estoque`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setRows(res.data ?? []);
      } catch (err) {
        console.error(err);
        setError("Não foi possível carregar o relatório de estoque.");
        toast.error("Erro ao carregar estoque.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 🧮 Helpers locais para trabalhar SEMPRE em reais
  const getUnitPrice = (p: ProdutoEstoque) => Number(p.price) || 0; // já vem em reais

  const getTotalProduto = (p: ProdutoEstoque) =>
    getUnitPrice(p) * (Number(p.quantity) || 0);

  const totalProdutos = useMemo(() => rows.length, [rows]);

  const totalValorEstoque = useMemo(
    () => rows.reduce((acc, p) => acc + getTotalProduto(p), 0),
    [rows]
  );

  const hasData = !loading && !error && rows.length > 0;

  // 🎯 aplica ordenação + busca + top N
  const filteredRows = useMemo(() => {
    let result = [...rows];

    result.sort((a, b) => {
      if (sortMode === "risco") {
        // risco = valor total em estoque (em reais)
        const riscoA = getTotalProduto(a);
        const riscoB = getTotalProduto(b);
        return riscoB - riscoA; // maior risco primeiro
      }

      // ordenar por menor quantidade
      return (Number(a.quantity) || 0) - (Number(b.quantity) || 0);
    });

    // busca por nome
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(term));
    }

    // limite top N
    if (limit !== "all") {
      result = result.slice(0, limit);
    }

    return result;
  }, [rows, searchTerm, limit, sortMode]);

  const visibleProdutos = filteredRows.length;

  const visibleValorEstoque = useMemo(
    () => filteredRows.reduce((acc, p) => acc + getTotalProduto(p), 0),
    [filteredRows]
  );

  const resetFilters = () => {
    setSearchTerm("");
    setLimit("all");
    setSortMode("risco");
  };

  // 📤 Exportar CSV com o resultado filtrado (em REAIS)
  const handleExportCsv = () => {
    if (!filteredRows.length) {
      toast.error("Não há dados para exportar.");
      return;
    }

    const header = [
      "produto",
      "quantidade",
      "preco_unitario_reais",
      "total_reais",
      "nivel_risco",
    ];

    const rowsCsv = filteredRows.map((p) => {
      const unitPrice = getUnitPrice(p);
      const total = getTotalProduto(p);
      const safeName = p.name.replace(/"/g, '""');

      return [
        safeName,
        String(p.quantity),
        String(unitPrice.toFixed(2)), // em reais (ex: 49.90)
        String(total.toFixed(2)), // em reais
        getRiskLabel(p.quantity),
      ];
    });

    const csvLines = [
      header.join(";"),
      ...rowsCsv.map((cols) => cols.map((c) => `"${c}"`).join(";")),
    ];

    const csv = csvLines.join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "relatorio_estoque_geral.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV exportado com sucesso!");
  };

  return (
    <main className="min-h-screen bg-[#050816] text-gray-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* ---------------- HEADER ---------------- */}
        <header className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="pr-10 sm:pr-0">
            <p className="text-[11px] uppercase tracking-[0.25em] text-teal-400/80">
              Monitoramento de estoque
            </p>

            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#35c2c4] sm:text-3xl">
              Estoque
            </h1>

            <p className="mt-1 max-w-xl text-xs text-slate-300 sm:text-sm">
              Visão completa de todos os produtos da loja, com quantidade,
              impacto financeiro e nível de risco — estilo painel de grandes
              marketplaces.
            </p>

            {hasData && (
              <p className="mt-2 text-xs font-semibold text-slate-100 sm:text-sm">
                Valor total em estoque:{" "}
                <span className="text-[#35c2c4]">
                  {formatCurrency(totalValorEstoque)}
                </span>
              </p>
            )}
          </div>

          {/* Botões — voltar no desktop, close no mobile */}
          <div className="absolute right-0 top-0 flex items-center gap-2 sm:static">
            <div className="block sm:hidden">
              <CloseButton className="text-3xl text-slate-200 hover:text-[#35c2c4]" />
            </div>

            <div className="hidden sm:block">
              <CustomButton
                label="← Voltar para relatórios"
                href="/admin/relatorios"
                size="small"
                variant="secondary"
                isLoading={false}
              />
            </div>
          </div>
        </header>

        {/* ---------------- ESTADOS ---------------- */}

        {loading && (
          <section className="flex min-h-[40vh] items-center justify-center">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/60 px-5 py-4 text-sm text-slate-200">
              Carregando estoque...
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

        {!loading && !error && rows.length === 0 && (
          <section className="flex min-h-[40vh] items-center justify-center">
            <div className="max-w-md rounded-2xl border border-dashed border-slate-600 bg-slate-950/50 px-5 py-6 text-center text-sm text-slate-300">
              Nenhum produto cadastrado no momento.
              <p className="mt-2 text-[11px] text-slate-400">
                Assim que houver produtos com estoque registrado, eles aparecerão
                aqui.
              </p>
            </div>
          </section>
        )}

        {/* ---------------- CONTEÚDO PRINCIPAL ---------------- */}
        {hasData && (
          <section
            className="
              rounded-3xl border border-slate-800 bg-slate-950/80
              p-4 shadow-[0_18px_45px_rgba(0,0,0,0.65)] backdrop-blur
              sm:p-6
            "
          >
            {/* KPIs principais */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs text-slate-400">Produtos na loja</p>
                <p className="mt-1 text-2xl font-bold text-teal-300">
                  {totalProdutos}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs text-slate-400">
                  Valor total em estoque
                </p>
                <p className="mt-1 text-2xl font-bold text-teal-300">
                  {formatCurrency(totalValorEstoque)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-xs text-slate-400">
                  Valor do resultado filtrado
                </p>
                <p className="mt-1 text-2xl font-bold text-teal-300">
                  {formatCurrency(visibleValorEstoque)}
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Baseado nos filtros aplicados abaixo.
                </p>
              </div>
            </div>

            {/* HEADER + FILTROS DO RANKING */}
            <div className="mt-8 space-y-3">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                    Ranking de produtos por risco de estoque
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
                    Use a busca, o limite de resultados e a ordenação para focar
                    nos produtos que mais impactam financeiramente ou que estão
                    com menor quantidade.
                  </p>
                </div>

                {/* BLOCO DE FILTROS */}
                <div className="flex w-full flex-col gap-3 sm:max-w-xl lg:w-auto">
                  {/* Toggle ordenação + Export CSV */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <div
                      className="
                        inline-flex w-full flex-1 rounded-xl border border-slate-700
                        bg-slate-950/80 p-0.5 text-[11px] sm:w-auto
                      "
                    >
                      <button
                        type="button"
                        onClick={() => setSortMode("risco")}
                        className={`w-1/2 rounded-lg px-3 py-1.5 transition sm:w-auto ${
                          sortMode === "risco"
                            ? "bg-teal-500 text-slate-950"
                            : "text-slate-300 hover:text-teal-300"
                        }`}
                      >
                        Ordenar por risco (R$)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortMode("quantidade")}
                        className={`w-1/2 rounded-lg px-3 py-1.5 transition sm:w-auto ${
                          sortMode === "quantidade"
                            ? "bg-teal-500 text-slate-950"
                            : "text-slate-300 hover:text-teal-300"
                        }`}
                      >
                        Menor quantidade
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
                        placeholder="Buscar por nome do produto"
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
                              : (Number(e.target.value) as LimitOption)
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
                        <option value="all">Todos</option>
                      </select>

                      {(searchTerm ||
                        limit !== "all" ||
                        sortMode !== "risco") && (
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

              {/* SEM RESULTADOS PARA O FILTRO ATUAL */}
              {filteredRows.length === 0 ? (
                <div className="mt-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 px-4 py-5 text-center text-xs text-slate-300">
                  Nenhum produto encontrado para esse filtro.
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ajuste a busca ou clique em{" "}
                    <span className="font-semibold">“Limpar”</span> para ver
                    novamente toda a lista.
                  </p>
                </div>
              ) : (
                <>
                  {/* ---------- TABELA DESKTOP ---------- */}
                  <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/80 md:block">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm text-slate-200">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/80">
                            <th className="px-4 py-3 font-semibold">
                              Produto
                            </th>
                            <th className="px-4 py-3 font-semibold">Risco</th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Quantidade
                            </th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Preço (R$)
                            </th>
                            <th className="px-4 py-3 text-right font-semibold">
                              Total
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredRows.map((p) => {
                            const unitPrice = getUnitPrice(p);
                            const total = getTotalProduto(p);

                            return (
                              <tr
                                key={p.id}
                                className="border-b border-slate-900/80 last:border-none hover:bg-slate-900/40"
                              >
                                <td className="px-4 py-3">{p.name}</td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`
                                      inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold
                                      ${getRiskBadgeClasses(p.quantity)}
                                    `}
                                  >
                                    {getRiskLabel(p.quantity)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {p.quantity}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {formatCurrency(unitPrice)}
                                </td>
                                <td className="px-4 py-3 text-right text-teal-300">
                                  {formatCurrency(total)}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-900/80">
                            <td
                              className="px-4 py-3 text-sm font-semibold"
                              colSpan={4}
                            >
                              Totais do resultado filtrado
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-[#35c2c4]">
                              {formatCurrency(visibleValorEstoque)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ---------- MOBILE CARDS ---------- */}
                  <div className="space-y-3 md:hidden">
                    {filteredRows.map((p) => {
                      const unitPrice = getUnitPrice(p);
                      const total = getTotalProduto(p);

                      return (
                        <div
                          key={p.id}
                          className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-xs shadow-lg shadow-black/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-100">
                                {p.name}
                              </p>
                              <div className="mt-1">
                                <span
                                  className={`
                                    inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold
                                    ${getRiskBadgeClasses(p.quantity)}
                                  `}
                                >
                                  {getRiskLabel(p.quantity)}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-[11px] text-slate-400">
                                Total
                              </p>
                              <p className="text-[13px] font-bold text-teal-300">
                                {formatCurrency(total)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-slate-400">Qtd:</span>
                            <span className="font-semibold">
                              {p.quantity}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center justify-between border-t border-slate-800 pt-2">
                            <span className="text-slate-400">Preço un.:</span>
                            <span className="font-semibold">
                              {formatCurrency(unitPrice)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    <div className="mt-2 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          Totais do resultado filtrado
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px]">
                          {visibleProdutos} produtos
                        </span>
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] text-[#35c2c4]">
                          {formatCurrency(visibleValorEstoque)}
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

/* ---------- HELPERS DE RISCO ---------- */

function getRiskLabel(quantity: number): string {
  if (quantity <= 1) return "Crítico (repor urgente)";
  if (quantity <= 3) return "Atenção (repor em breve)";
  if (quantity <= 5) return "Observação (monitorar)";
  return "Estoque ok";
}

function getRiskBadgeClasses(quantity: number): string {
  if (quantity <= 1) {
    return "bg-red-500/20 text-red-200 border border-red-500/40";
  }
  if (quantity <= 3) {
    return "bg-orange-500/20 text-orange-100 border border-orange-500/40";
  }
  if (quantity <= 5) {
    return "bg-yellow-500/20 text-yellow-100 border border-yellow-500/40";
  }
  // estoque bom
  return "bg-emerald-500/20 text-emerald-100 border border-emerald-500/40";
}
