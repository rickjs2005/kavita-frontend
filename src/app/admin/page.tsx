"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth, AdminRole } from "@/context/AdminAuthContext";
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

type AdminLog = {
  id: number;
  acao: string;
  entidade: string;
  entidade_id: number | null;
  data: string;
  admin_id: number;
  admin_nome: string;
  admin_email: string;
  admin_role: AdminRole;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE}/api`;

/** Labels bonitos por nível de acesso */
const ROLE_LABEL: Record<AdminRole, string> = {
  master: "MASTER • acesso total ao painel",
  gerente: "GERENTE • gestão de vendas e catálogo",
  suporte: "SUPORTE • atendimento e operações",
  leitura: "LEITURA • acesso somente visual",
};

/** Versão curtinha do papel para usar ao lado do nome */
const ROLE_SHORT_LABEL: Record<AdminRole, string> = {
  master: "Master",
  gerente: "Gerente",
  suporte: "Suporte",
  leitura: "Leitura",
};

/** Estilo de badge por nível de acesso */
const ROLE_BADGE_CLASS: Record<AdminRole, string> = {
  master:
    "border-emerald-500/60 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.45)]",
  gerente:
    "border-sky-500/60 bg-sky-500/10 text-sky-200 shadow-[0_0_0_1px_rgba(56,189,248,0.35)]",
  suporte:
    "border-amber-500/60 bg-amber-500/10 text-amber-100 shadow-[0_0_0_1px_rgba(245,158,11,0.35)]",
  leitura:
    "border-slate-500/60 bg-slate-800/80 text-slate-100 shadow-[0_0_0_1px_rgba(148,163,184,0.4)]",
};

/** Recupera o token salvo no navegador (ou string vazia) */
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

/** Data do log no formato 28/11/2025 (fuso São Paulo) */
function formatLogDate(dateStr: string) {
  const dt = new Date(dateStr);
  return dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

/** Gera iniciais do nome do admin (ex: João Silva -> JS) */
function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

/** Spinner genérico para loadings */
function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" }) {
  const base =
    "inline-block animate-spin rounded-full border-2 border-emerald-400 border-t-transparent";
  const sizes =
    size === "sm"
      ? "h-4 w-4 border-[1.5px]"
      : "h-5 w-5 border-2";

  return <span className={`${base} ${sizes}`} aria-hidden="true" />;
}

export default function AdminDashboardPage() {
  const { logout, role, nome } = useAdminAuth();
  const router = useRouter();

  const [resumo, setResumo] = useState<AdminResumo | null>(null);
  const [vendas, setVendas] = useState<VendaPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const canViewLogs = role === "master" || role === "gerente";

  /** Redireciona para login caso o token seja inválido/expirado */
  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/admin/login");
  }, [logout, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/admin/login");
  }, [logout, router]);

  /** Cria as opções de fetch com Authorization */
  const createAuthOptions = useCallback((token: string): RequestInit => {
    return {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    };
  }, []);

  // Carrega cards + gráfico
  useEffect(() => {
    let cancelado = false;

    async function loadDashboard() {
      const token = getAdminToken();
      if (!token) {
        handleUnauthorized();
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        const options = createAuthOptions(token);

        const resumoRes = await fetch(`${API_URL}/admin/stats/resumo`, options);
        if (resumoRes.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!resumoRes.ok) throw new Error("Erro ao buscar resumo");
        const resumoJson: AdminResumo = await resumoRes.json();

        const vendasRes = await fetch(
          `${API_URL}/admin/stats/vendas?range=7`,
          options
        );
        if (vendasRes.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!vendasRes.ok) throw new Error("Erro ao buscar vendas");
        const vendasJson: { rangeDays: number; points: VendaPoint[] } =
          await vendasRes.json();

        if (cancelado) return;
        setResumo(resumoJson);
        setVendas(vendasJson.points);
      } catch (err) {
        if (cancelado) return;
        console.error(err);
        setErrorMsg(
          "Não foi possível carregar os dados do dashboard neste momento."
        );
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelado = true;
    };
  }, [createAuthOptions, handleUnauthorized]);

  // Carrega atividade recente (5 últimas ações)
  useEffect(() => {
    if (!canViewLogs) return;

    let cancelado = false;

    async function loadLogs() {
      const token = getAdminToken();
      if (!token) return;

      setLogsLoading(true);
      setLogsError(null);

      try {
        const res = await fetch(`${API_URL}/admin/logs?limit=5`, {
          ...createAuthOptions(token),
        });

        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!res.ok) throw new Error("Erro ao buscar logs");

        const data: AdminLog[] = await res.json();
        if (cancelado) return;
        setLogs(data ?? []);
      } catch (err) {
        if (cancelado) return;
        console.warn("Erro ao carregar logs de auditoria:", err);
        setLogsError(
          "Não foi possível carregar a atividade recente. Tente novamente mais tarde."
        );
      } finally {
        if (!cancelado) setLogsLoading(false);
      }
    }

    loadLogs();
    return () => {
      cancelado = true;
    };
  }, [canViewLogs, createAuthOptions, handleUnauthorized]);

  const maxVenda = useMemo(
    () => vendas.reduce((max, p) => Math.max(max, p.total), 0),
    [vendas]
  );

  return (
    <div className="relative h-full w-full text-slate-50">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
                Kavita Admin
              </span>

              <span className="hidden text-[10px] text-slate-500 sm:inline">
                Últimos 30 dias
              </span>

              {/* 🔐 Badge de nível de acesso */}
              {role && (
                <span
                  className={[
                    "inline-flex items-center rounded-full border px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.14em]",
                    ROLE_BADGE_CLASS[role],
                  ].join(" ")}
                >
                  {ROLE_LABEL[role]}
                </span>
              )}
            </div>

            <h1 className="truncate text-base font-semibold sm:text-lg">
              Painel administrativo Kavita
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
              Visão geral de produtos, pedidos, clientes e vendas.
              {nome && (
                <span className="ml-1 text-emerald-300/80">
                  Bem-vindo(a), {nome}.
                </span>
              )}
            </p>
          </div>

          {/* Ações lado direito */}
          <div className="flex items-center gap-2">
            {/* Card com nome + papel do usuário (desktop/tablet) */}
            {nome && role && (
              <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 md:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-semibold uppercase text-emerald-200">
                  {getInitials(nome)}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-medium">{nome}</p>
                  <p className="text-[10px] text-emerald-300/80">
                    {ROLE_SHORT_LABEL[role]}
                  </p>
                </div>
              </div>
            )}

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
              className="hidden shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-rose-900/40 transition-transform hover:translate-y-[1px] hover:shadow-rose-900/10 md:flex"
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
              {/* Usa o mesmo sidebar; fecha o menu ao navegar */}
              <AdminSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 sm:px-4 sm:py-5 lg:py-6">
        {loading && (
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-200">
            <LoadingSpinner />
            <div>
              <p className="font-medium">
                Carregando dados do dashboard...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Isso pode levar alguns segundos. Não feche esta página.
              </p>
            </div>
          </div>
        )}

        {!loading && errorMsg && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-500/60 bg-rose-950/60 p-4 text-sm text-rose-50">
            <div className="mt-[2px] flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/90 text-xs font-bold">
              !
            </div>
            <div>
              <p className="font-semibold">Ops, algo deu errado</p>
              <p className="mt-1 text-xs text-rose-100/90">{errorMsg}</p>
              <p className="mt-2 text-[11px] text-rose-100/80">
                Tente recarregar a página. Se o problema continuar, fale com o
                responsável pelo painel ou suporte técnico.
              </p>
            </div>
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

              {/* Atividade recente – 5 últimas ações de logs */}
              {canViewLogs ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
                  <h2 className="mb-1 text-sm font-semibold text-slate-50">
                    Atividade recente
                  </h2>
                  <p className="mb-3 text-[11px] text-slate-400">
                    Últimas ações realizadas por administradores no painel.
                  </p>

                  {logsLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <LoadingSpinner size="sm" />
                      <span>Carregando atividade recente...</span>
                    </div>
                  )}

                  {!logsLoading && logsError && (
                    <p className="text-xs text-rose-300">{logsError}</p>
                  )}

                  {!logsLoading && !logsError && logs.length === 0 && (
                    <p className="text-xs text-slate-400">
                      Nenhuma atividade recente.
                    </p>
                  )}

                  {!logsLoading && !logsError && logs.length > 0 && (
                    <ul className="divide-y divide-slate-800/80 text-xs text-slate-200">
                      {logs.map((log) => (
                        <li
                          key={log.id}
                          className="flex items-center gap-2 py-1.5"
                        >
                          <span className="w-[90px] shrink-0 text-[11px] text-slate-500">
                            {formatLogDate(log.data)}
                          </span>
                          <span className="h-[4px] w-[4px] rounded-full bg-emerald-400" />
                          <p className="flex-1 truncate">
                            {/* Ex: João criou um produto #12 */}
                            <span className="font-medium">
                              {log.admin_nome || log.admin_email}
                            </span>{" "}
                            {log.acao}{" "}
                            <span className="font-medium">
                              {log.entidade}
                            </span>
                            {log.entidade_id && <> #{log.entidade_id}</>}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
                  <h2 className="mb-1 text-sm font-semibold text-slate-50">
                    Atividade recente
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Seu perfil atual não possui acesso ao histórico de ações do
                    painel.
                  </p>
                </div>
              )}
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
        <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">{helper}</p>
      )}
    </article>
  );
}
