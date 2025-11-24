"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import CloseButton from "@/components/buttons/CloseButton";

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
  const { logout } = useAdminAuth();
  const router = useRouter();

  const [resumo, setResumo] = useState<AdminResumo | null>(null);
  const [vendas, setVendas] = useState<VendaPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const token = getAdminToken();
        if (!token) {
          logout();
          router.replace("/admin/login");
          return;
        }

        const options: RequestInit = {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        };

        const resumoRes = await fetch(
          `${API_URL}/admin/stats/resumo`,
          options
        );
        if (resumoRes.status === 401) {
          logout();
          router.replace("/admin/login");
          return;
        }
        if (!resumoRes.ok) {
          throw new Error("Erro ao buscar resumo");
        }
        const resumoJson: AdminResumo = await resumoRes.json();

        const vendasRes = await fetch(
          `${API_URL}/admin/stats/vendas?range=7`,
          options
        );
        if (vendasRes.status === 401) {
          logout();
          router.replace("/admin/login");
          return;
        }
        if (!vendasRes.ok) {
          throw new Error("Erro ao buscar vendas");
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
  }, [logout, router]);

  const maxVenda = useMemo(
    () => vendas.reduce((max, p) => Math.max(max, p.total), 0),
    [vendas]
  );

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  return (
    <div className="relative h-full w-full text-slate-50">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
                Kavita Admin
              </span>
              <span className="hidden text-[10px] text-slate-500 sm:inline">
                Últimos 30 dias
              </span>
            </div>
            <h1 className="truncate text-base font-semibold sm:text-lg">
              Painel administrativo Kavita
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
              Visão geral de produtos, pedidos, clientes e vendas.
            </p>
          </div>

          {/* Ações lado direito */}
          <div className="flex items-center gap-2">
            {/* Botão hambúrguer – mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className={`md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-900/40 ${
                isMobileMenuOpen ? "hidden" : "flex"
              }`}
              aria-label="Abrir menu do painel"
            >
              <span className="sr-only">Abrir menu</span>
              <span className="flex flex-col gap-[3px]">
                <span className="block h-[2px] w-5 rounded-full bg-white" />
                <span className="block h-[2px] w-5 rounded-full bg-white" />
                <span className="block h-[2px] w-5 rounded-full bg-white" />
              </span>
            </button>

            {/* Sair – desktop/tablet */}
            <button
              onClick={handleLogout}
              className="hidden shrink-0 items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-sm transition hover:border-rose-500/80 hover:text-rose-200 md:inline-flex"
            >
              <span>🚪</span>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* MENU MOBILE FULLSCREEN */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <aside className="relative z-50 flex h-full w-full flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <span className="text-sm font-semibold text-slate-800">
                Menu do painel
              </span>
              <CloseButton
                onClose={() => setIsMobileMenuOpen(false)}
                className="text-2xl text-slate-500 hover:text-slate-800"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Usamos o mesmo sidebar, mas podemos fechar o menu ao navegar */}
              <AdminSidebar
                onNavigate={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </aside>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 sm:px-4 sm:py-5 lg:py-6">
        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-300">
            Carregando dados do dashboard...
          </div>
        )}

        {!loading && errorMsg && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-100">
            {errorMsg}
          </div>
        )}

        {!loading && resumo && (
          <>
            {/* CARDS RESUMO */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Produtos cadastrados"
                value={formatNumber(resumo.totalProdutos)}
                helper="Total no catálogo"
                highlight
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
            <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
              {/* Gráfico de vendas */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
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
                  <div className="mt-5 flex h-56 items-end gap-2 sm:h-60">
                    {vendas.map((p) => {
                      const ratio =
                        maxVenda > 0
                          ? Math.max((p.total / maxVenda) * 100, 5)
                          : 0;

                      return (
                        <div
                          key={p.date}
                          className="flex flex-1 flex-col items-center gap-1"
                        >
                          <div className="flex h-full w-full items-end justify-center">
                            <div
                              className="w-full rounded-t-md bg-emerald-500/80 shadow-sm shadow-emerald-900/40"
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

              {/* Atividade recente – placeholder */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
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
  highlight?: boolean;
};

function StatCard({ label, value, helper, highlight }: StatCardProps) {
  return (
    <article
      className={[
        "flex h-full flex-col rounded-xl border bg-slate-950/80 p-4 sm:p-5",
        highlight
          ? "border-emerald-500/70 shadow-[0_0_0_1px_rgba(16,185,129,0.45)]"
          : "border-slate-800",
      ].join(" ")}
    >
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
