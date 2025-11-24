"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";

type AdminResumo = {
  totalProdutos: number;
  totalPedidosUltimos30: number;
  totalClientes: number;
  totalDestaques: number;
  totalServicos: number;
  totalVendas30Dias: number;
  ticketMedio: number;
};

type VendaPoint = {
  date: string;
  total: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api`;

// pega token salvo no login
function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("adminToken") ?? "";
  } catch {
    return "";
  }
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n || 0);
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(n || 0);
}

function formatShortDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  const dt = new Date(y || 2000, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const { isAdmin, logout } = useAdminAuth();
  const router = useRouter();

  const [resumo, setResumo] = useState<AdminResumo | null>(null);
  const [vendas, setVendas] = useState<VendaPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // se não for admin, manda pro login
  useEffect(() => {
    if (!isAdmin) {
      router.replace("/admin/login");
    }
  }, [isAdmin, router]);

  // carrega dados quando isAdmin === true
  useEffect(() => {
    if (!isAdmin) return;

    let cancelado = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const token = getAdminToken();
        if (!token) {
          // sem token → força logout e volta pro login
          logout();
          router.replace("/admin/login");
          return;
        }

        const commonOptions: RequestInit = {
          credentials: "include",
          headers: {
            // BE espera "Authorization: Bearer <token>"
            Authorization: `Bearer ${token}`,
          },
        };

        // resumo
        const resumoRes = await fetch(
          `${API_URL}/admin/stats/resumo`,
          commonOptions
        );

        if (resumoRes.status === 401) {
          logout();
          router.replace("/admin/login");
          return;
        }

        if (!resumoRes.ok) {
          throw new Error("Erro ao buscar resumo do dashboard");
        }

        const resumoJson: AdminResumo = await resumoRes.json();

        // vendas últimos 7 dias
        const vendasRes = await fetch(
          `${API_URL}/admin/stats/vendas?range=7`,
          commonOptions
        );

        if (vendasRes.status === 401) {
          logout();
          router.replace("/admin/login");
          return;
        }

        if (!vendasRes.ok) {
          throw new Error("Erro ao buscar série de vendas");
        }

        const vendasJson: { rangeDays: number; points: VendaPoint[] } =
          await vendasRes.json();

        if (cancelado) return;
        setResumo(resumoJson);
        setVendas(vendasJson.points);
      } catch (err) {
        if (cancelado) return;
        console.error(err);
        setErrorMsg("Não foi possível carregar os dados do dashboard.");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelado = true;
    };
  }, [isAdmin, logout, router]);

  const maxVenda = useMemo(
    () => vendas.reduce((max, p) => Math.max(max, p.total), 0),
    [vendas]
  );

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-950/95 text-slate-50">
      {/* HEADER DO ADMIN (dentro da área principal, sidebar fica no layout) */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">
              Painel administrativo Kavita
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
              Resumo dos últimos 30 dias – produtos, pedidos, clientes e vendas.
            </p>
          </div>

          <button
            onClick={logout}
            className="shrink-0 rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-100 transition hover:border-emerald-500 hover:text-emerald-300"
          >
            Sair
          </button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:py-6">
        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
            Carregando dados do dashboard...
          </div>
        )}

        {!loading && errorMsg && (
          <div className="rounded-xl border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-100">
            {errorMsg}
          </div>
        )}

        {!loading && resumo && (
          <>
            {/* CARDS RESUMO */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <StatCard
                label="Produtos cadastrados"
                value={formatNumber(resumo.totalProdutos)}
                helper="Total no catálogo"
              />
              <StatCard
                label="Pedidos (últimos 30 dias)"
                value={formatNumber(resumo.totalPedidosUltimos30)}
                helper="Inclui todos os status"
              />
              <StatCard
                label="Clientes"
                value={formatNumber(resumo.totalClientes)}
                helper="Usuários registrados"
              />
              <StatCard
                label="Destaques ativos"
                value={formatNumber(resumo.totalDestaques)}
              />
              <StatCard
                label="Serviços"
                value={formatNumber(resumo.totalServicos)}
                helper="Colaboradores cadastrados"
              />
              <StatCard
                label="Vendas (30 dias)"
                value={formatMoney(resumo.totalVendas30Dias)}
                helper={`Ticket médio: ${formatMoney(resumo.ticketMedio)}`}
              />
            </section>

            {/* GRÁFICO + ATIVIDADE */}
            <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              {/* Gráfico vendas */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-50">
                      Vendas (últimos 7 dias)
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Somente pedidos com pagamento aprovado.
                    </p>
                  </div>
                  {maxVenda > 0 && (
                    <p className="text-[11px] text-slate-400">
                      Pico: {formatMoney(maxVenda)}
                    </p>
                  )}
                </div>

                {vendas.length === 0 ? (
                  <p className="mt-4 text-xs text-slate-400">
                    Ainda não há vendas registradas nesse período.
                  </p>
                ) : (
                  <div className="mt-4 flex h-56 items-end gap-2 sm:h-60">
                    {vendas.map((p) => {
                      const ratio =
                        maxVenda > 0
                          ? Math.max((p.total / maxVenda) * 100, 4)
                          : 0;

                      return (
                        <div
                          key={p.date}
                          className="flex flex-1 flex-col items-center gap-1"
                        >
                          <div className="flex h-full w-full items-end justify-center">
                            <div
                              className="w-full rounded-t-md bg-emerald-500/80 shadow-sm"
                              style={{ height: `${ratio}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 sm:text-[11px]">
                            {formatShortDate(p.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Atividade recente - placeholder */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <h2 className="mb-1 text-sm font-semibold text-slate-50">
                  Atividade recente
                </h2>
                <p className="mb-3 text-[11px] text-slate-400">
                  Na Etapa 7 vamos conectar aqui os logs de ações do admin
                  (criação/edição de produtos, pedidos, destaques, etc).
                </p>

                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="rounded-md border border-dashed border-slate-700/70 bg-slate-900/80 px-3 py-2">
                    Nenhuma atividade registrada ainda. Assim que os logs forem
                    implementados, as ações mais recentes aparecerão aqui.
                  </li>
                </ul>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
};

function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <article className="flex flex-col rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:text-xs">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
        {value}
      </p>
      {helper && (
        <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
          {helper}
        </p>
      )}
    </article>
  );
}
