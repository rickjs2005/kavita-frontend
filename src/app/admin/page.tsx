"use client";

import { useCallback, useEffect, useMemo, useState, } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, } from "recharts";
import { useAdminAuth, AdminRole, } from "@/context/AdminAuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import CloseButton from "@/components/buttons/CloseButton";
import { KpiCard } from "@/components/admin/KpiCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  admin_nome: string;
  acao: string;
  detalhes?: string | null;
  criado_em: string;
};

type TopCliente = {
  id: number;
  nome: string;
  total_pedidos: number;
  total_gasto: number;
};

type TopProduto = {
  id: number;
  nome: string;
  total_vendido: number;
  receita_total: number;
};

type TopServico = {
  id: number;
  titulo: string;
  total_contratos: number;
  receita_total: number;
  nota_media?: number | null;
};

type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: string;
  permission: string;
};

type AlertNivel = "info" | "warning" | "danger";
type AlertTipo = "pagamento" | "estoque" | "carrinhos" | "sistema" | "outro";

type AlertItem = {
  id: string;
  nivel: AlertNivel;
  tipo: AlertTipo;
  titulo: string;
  mensagem: string;
  link?: string | null;
  link_label?: string | null;
};

const ROLE_LABEL: Record<AdminRole, string> = {
  master: "Master",
  gerente: "Gerente",
  suporte: "Suporte",
  leitura: "Leitura",
};

const ROLE_SHORT_LABEL: Record<AdminRole, string> = {
  master: "Nível master",
  gerente: "Nível gerente",
  suporte: "Nível suporte",
  leitura: "Acesso leitura",
};

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

function formatLogDate(dateStr: string) {
  const dt = new Date(dateStr);
  if (Number.isNaN(dt.getTime())) {
    return "—";
  }
  return dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" }) {
  const base =
    "inline-block animate-spin rounded-full border-2 border-emerald-400 border-t-transparent";
  const sizes =
    size === "sm"
      ? "h-4 w-4 border-[1.5px]"
      : "h-5 w-5 border-2";

  return <span className={`${base} ${sizes}`} aria-hidden="true" />;
}

function SalesTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const value: number = item.value ?? 0;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-slate-50 shadow-xl">
      <div className="font-medium text-emerald-300">
        {label}
      </div>
      <div className="mt-1 text-[11px] text-slate-300">
        Faturamento:{" "}
        <span className="font-semibold text-emerald-400">
          {formatMoney(value)}
        </span>
      </div>
    </div>
  );
}

const quickLinks: QuickLink[] = [
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    description: "Acompanhar pedidos, pagamentos e status",
    icon: "🧾",
    permission: "orders_view",
  },
  {
    href: "/admin/produtos",
    label: "Produtos",
    description: "Gerenciar catálogo, preços e estoque",
    icon: "📦",
    permission: "products_manage",
  },
  {
    href: "/admin/servicos",
    label: "Serviços",
    description: "Prestadores, agenda e avaliações",
    icon: "🛠️",
    permission: "services_manage",
  },
  {
    href: "/admin/clientes",
    label: "Clientes",
    description: "Ficha completa e CRM dos clientes",
    icon: "👥",
    permission: "customers_view",
  },
  {
    href: "/admin/relatorios",
    label: "Relatórios",
    description: "Vendas, clientes, estoque e serviços",
    icon: "📊",
    permission: "reports_view",
  },
  {
    href: "/admin/destaques",
    label: "Destaques",
    description: "Vitrines, homepage e promoções",
    icon: "⭐",
    permission: "highlights_manage",
  },
  {
    href: "/admin/carrinhos",
    label: "Carrinhos",
    description: "Recuperação de carrinhos abandonados",
    icon: "🛒",
    permission: "carts_view",
  },
  {
    href: "/admin/configuracoes",
    label: "Configurações",
    description: "Loja, pagamentos e integrações",
    icon: "⚙️",
    permission: "settings_manage",
  },
];

function getAlertColors(nivel: AlertNivel) {
  switch (nivel) {
    case "danger":
      return {
        badge: "bg-rose-500/10 text-rose-300 border border-rose-500/60",
        dot: "bg-rose-500",
      };
    case "warning":
      return {
        badge:
          "bg-amber-500/10 text-amber-200 border border-amber-500/60",
        dot: "bg-amber-400",
      };
    default:
      return {
        badge:
          "bg-sky-500/10 text-sky-200 border border-sky-500/60",
        dot: "bg-sky-400",
      };
  }
}

export default function AdminDashboardPage() {
  const { logout, role, nome, hasPermission } = useAdminAuth();
  const router = useRouter();

  const [resumo, setResumo] = useState<AdminResumo | null>(null);
  const [vendas, setVendas] = useState<VendaPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [topServicos, setTopServicos] = useState<TopServico[]>([]);
  const [topsLoading, setTopsLoading] = useState(false);
  const [topsError, setTopsError] = useState<string | null>(null);

  const [alertas, setAlertas] = useState<AlertItem[]>([]);
  const [alertasLoading, setAlertasLoading] = useState(false);
  const [alertasError, setAlertasError] = useState<string | null>(
    null
  );

  const canViewLogs = role === "master" || role === "gerente";

  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/admin/login");
  }, [logout, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/admin/login");
  }, [logout, router]);

  const createAuthOptions = useCallback((token: string): RequestInit => {
    return {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    };
  }, []);

  // === Resumo + gráfico ===
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

        const [resResumo, resVendas] = await Promise.all([
          fetch(`${API_BASE}/api/admin/stats/resumo`, options),
          fetch(
            `${API_BASE}/api/admin/stats/vendas?range=7`,
            options
          ),
        ]);

        if (cancelado) return;

        if (resResumo.status === 401 || resVendas.status === 401) {
          handleUnauthorized();
          return;
        }

        if (!resResumo.ok) {
          throw new Error("Erro ao carregar resumo da loja.");
        }
        if (!resVendas.ok) {
          throw new Error("Erro ao carregar resumo de vendas.");
        }

        const resumoJson: AdminResumo = await resResumo.json();
        const vendasJson: { rangeDays: number; points: VendaPoint[] } =
          await resVendas.json();

        if (cancelado) return;

        setResumo(resumoJson ?? null);
        setVendas(
          Array.isArray(vendasJson.points) ? vendasJson.points : []
        );
      } catch (err: any) {
        if (cancelado) return;
        console.error("Erro ao carregar dashboard:", err);
        const msg =
          err?.message ||
          "Não foi possível carregar o painel. Tente novamente.";
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      cancelado = true;
    };
  }, [createAuthOptions, handleUnauthorized]);

  // === Logs (atividade recente) ===
  useEffect(() => {
    if (!canViewLogs) return;

    let cancelado = false;

    async function loadLogs() {
      const token = getAdminToken();
      if (!token) {
        handleUnauthorized();
        return;
      }

      setLogsLoading(true);
      setLogsError(null);

      try {
        const res = await fetch(
          `${API_BASE}/api/admin/logs?limit=20`,
          createAuthOptions(token)
        );

        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        if (!res.ok) throw new Error("Erro ao buscar logs");

        const data: any[] = await res.json();
        if (cancelado) return;

        // já vem com campo criado_em do backend
        const parsed: AdminLog[] = data.map((log) => ({
          id: log.id,
          admin_nome: log.admin_nome,
          acao: log.acao,
          detalhes: log.detalhes ?? null,
          criado_em: log.criado_em,
        }));

        setLogs(parsed ?? []);
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

  // === Mini-rankings (top clientes / produtos / serviços) ===
  useEffect(() => {
    let cancelado = false;

    async function loadTops() {
      const token = getAdminToken();
      if (!token) {
        handleUnauthorized();
        return;
      }

      setTopsLoading(true);
      setTopsError(null);

      try {
        const options = createAuthOptions(token);

        // CLIENTES – reaproveita /relatorios/clientes-top
        const clientesPromise = fetch(
          `${API_BASE}/api/admin/relatorios/clientes-top`,
          options
        );

        // PRODUTOS – usa /stats/produtos-mais-vendidos?limit=5
        const produtosPromise = fetch(
          `${API_BASE}/api/admin/stats/produtos-mais-vendidos?limit=5`,
          options
        );

        // SERVIÇOS – usa /relatorios/servicos-ranking
        const servicosPromise = fetch(
          `${API_BASE}/api/admin/relatorios/servicos-ranking`,
          options
        );

        const [resCli, resProd, resServ] = await Promise.all([
          clientesPromise,
          produtosPromise,
          servicosPromise,
        ]);

        if (cancelado) return;

        if (
          resCli.status === 401 ||
          resProd.status === 401 ||
          resServ.status === 401
        ) {
          handleUnauthorized();
          return;
        }

        let algumaCoisaOk = false;

        // CLIENTES
        if (resCli.ok) {
          const data: { rows: any[] } = await resCli.json();
          const rows = Array.isArray(data.rows) ? data.rows : [];
          const mapped: TopCliente[] = rows.slice(0, 5).map((c) => ({
            id: c.id,
            nome: c.nome,
            total_pedidos: Number(c.pedidos || 0),
            total_gasto: Number(c.total_gasto || 0),
          }));
          setTopClientes(mapped);
          algumaCoisaOk = true;
        }

        // PRODUTOS
        if (resProd.ok) {
          const data: any[] = await resProd.json();
          const mapped: TopProduto[] = (Array.isArray(data)
            ? data
            : []
          ).map((p) => ({
            id: p.id,
            nome: p.name,
            total_vendido: Number(p.quantidadeVendida || 0),
            receita_total: Number(p.totalVendido || 0),
          }));
          setTopProdutos(mapped);
          algumaCoisaOk = true;
        }

        // SERVIÇOS
        if (resServ.ok) {
          const data: { rows: any[] } = await resServ.json();
          const rows = Array.isArray(data.rows) ? data.rows : [];
          const mapped: TopServico[] = rows.slice(0, 5).map((s) => ({
            id: s.id,
            titulo: s.nome,
            total_contratos: Number(s.total_servicos || 0),
            receita_total: 0, // ainda não temos receita no ranking de serviços
            nota_media:
              typeof s.rating_avg === "number" ? s.rating_avg : null,
          }));
          setTopServicos(mapped);
          algumaCoisaOk = true;
        }

        if (!algumaCoisaOk) {
          setTopsError(
            "Não foi possível carregar os rankings. Verifique se as rotas de relatórios estão ativas."
          );
        }
      } catch (err) {
        if (cancelado) return;
        console.warn("Erro ao carregar tops:", err);
        setTopsError(
          "Erro ao carregar rankings de clientes/produtos/serviços."
        );
      } finally {
        if (!cancelado) setTopsLoading(false);
      }
    }

    loadTops();
    return () => {
      cancelado = true;
    };
  }, [createAuthOptions, handleUnauthorized]);

  // === Alertas da loja ===
  useEffect(() => {
    let cancelado = false;

    async function loadAlertas() {
      const token = getAdminToken();
      if (!token) {
        handleUnauthorized();
        return;
      }

      setAlertasLoading(true);
      setAlertasError(null);

      try {
        const res = await fetch(
          `${API_BASE}/api/admin/stats/alertas`,
          createAuthOptions(token)
        );

        if (cancelado) return;

        if (res.status === 401) {
          handleUnauthorized();
          return;
        }

        if (res.ok) {
          const data: AlertItem[] = await res.json();
          setAlertas(Array.isArray(data) ? data : []);
        } else if (res.status !== 404) {
          // 404 a gente ignora (rota ainda não criada)
          throw new Error("Erro ao carregar alertas");
        }
      } catch (err) {
        if (cancelado) return;
        console.warn("Erro ao carregar alertas:", err);
        setAlertasError(
          "Não foi possível carregar os alertas da loja."
        );
      } finally {
        if (!cancelado) setAlertasLoading(false);
      }
    }

    loadAlertas();
    return () => {
      cancelado = true;
    };
  }, [createAuthOptions, handleUnauthorized]);

  const chartData = useMemo(
    () =>
      vendas.map((p) => ({
        date: formatShortDate(p.date),
        total: p.total,
      })),
    [vendas]
  );

  if (loading && !resumo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-sm text-slate-400">
            Carregando dados do dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (errorMsg && !resumo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="max-w-md rounded-2xl bg-slate-900/90 p-6 text-center shadow-xl shadow-rose-900/30">
          <h1 className="text-lg font-semibold text-rose-300">
            Oops, algo deu errado
          </h1>
          <p className="mt-2 text-sm text-slate-300">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 hover:bg-emerald-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-50">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
                Kavita Admin
              </span>

              <span className="hidden text-[10px] text-slate-500 sm:inline">
                Visão geral dos últimos 30 dias
              </span>

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
              Tudo que importa da sua loja em um só lugar.
              {nome && (
                <span className="ml-1 text-emerald-300/80">
                  Bem-vindo(a), {nome}.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
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

            {/* MENU MOBILE */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className={`md:hidden flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-900/40 ${isMobileMenuOpen ? "hidden" : "flex"
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

            {/* SAIR (desktop) */}
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
          <div className="relative ml-0 flex h-full w-4/5 max-w-xs flex-col bg-slate-950/95 shadow-xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Menu
              </p>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="ml-auto"
              >
                <CloseButton />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminSidebar
                onNavigate={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-8 pt-4 sm:px-4">
        {!resumo ? (
          <p className="mt-4 text-sm text-slate-400">
            Nenhum dado disponível para o dashboard.
          </p>
        ) : (
          <>
            {/* KPIs PRINCIPAIS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Faturamento (30 dias)"
                value={formatMoney(resumo.totalVendas30Dias)}
                helper="Receita bruta dos últimos 30 dias"
                icon={<span>💰</span>}
                variant="success"
              />
              <KpiCard
                label="Pedidos (30 dias)"
                value={formatNumber(resumo.totalPedidosUltimos30)}
                helper="Pedidos criados no período"
                icon={<span>🧾</span>}
                variant="default"
              />
              <KpiCard
                label="Ticket médio"
                value={formatMoney(resumo.ticketMedio)}
                helper="Valor médio por pedido"
                icon={<span>🎯</span>}
                variant="success"
              />
              <KpiCard
                label="Clientes ativos"
                value={formatNumber(resumo.totalClientes)}
                helper="Clientes que já fizeram pedidos"
                icon={<span>👥</span>}
                variant="default"
              />
            </section>

            {/* KPIs SECUNDÁRIOS */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard
                label="Produtos no catálogo"
                value={formatNumber(resumo.totalProdutos)}
                helper="Itens disponíveis para venda"
                icon={<span>📦</span>}
                variant="default"
              />
              <KpiCard
                label="Serviços ativos"
                value={formatNumber(resumo.totalServicos)}
                helper="Serviços ofertados na plataforma"
                icon={<span>🛠️</span>}
                variant="default"
              />
              <KpiCard
                label="Produtos em destaque"
                value={formatNumber(resumo.totalDestaques)}
                helper="Cards especiais na home"
                icon={<span>⭐</span>}
                variant="default"
              />
            </section>

            {/* GRÁFICO + ATIVIDADE RECENTE */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Gráfico */}
              <div className="col-span-1 flex max-h-[340px] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60 lg:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
                      Vendas · 7 últimos dias
                    </p>
                    <h2 className="text-sm font-semibold text-slate-50">
                      Faturamento diário
                    </h2>
                  </div>
                  <Link
                    href="/admin/relatorios/vendas"
                    className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
                  >
                    Ver relatório completo →
                  </Link>
                </div>

                <div className="mt-3 flex-1 overflow-y-auto">
                  <div className="h-[260px] min-w-full">
                    {chartData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">
                        Nenhum dado de vendas recente.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={24}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1f2933"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "#cbd5f5" }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value: number) =>
                              formatMoney(value).replace("R$", "R$")
                            }
                            tick={{ fontSize: 10, fill: "#94a3b8" }}
                          />
                          <RechartsTooltip content={<SalesTooltip />} />
                          <Bar
                            dataKey="total"
                            radius={[8, 8, 0, 0]}
                            fill="#22c55e"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Logs */}
              <div className="col-span-1 flex max-h-[340px] flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300">
                      Atividade recente
                    </p>
                    <h2 className="text-sm font-semibold text-slate-50">
                      Logs de admins
                    </h2>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Últimas 20 ações
                  </span>
                </div>

                <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
                  {logsLoading && (
                    <div className="flex items-center justify-center py-6 text-xs text-slate-400">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">
                        Carregando atividade recente...
                      </span>
                    </div>
                  )}

                  {logsError && !logsLoading && (
                    <p className="text-xs text-rose-300">
                      {logsError}
                    </p>
                  )}

                  {!canViewLogs && (
                    <p className="text-xs text-slate-400">
                      Seu papel atual não possui acesso aos logs de
                      auditoria.
                    </p>
                  )}

                  {canViewLogs &&
                    !logsLoading &&
                    !logsError &&
                    logs.length === 0 && (
                      <p className="text-xs text-slate-400">
                        Nenhuma atividade registrada recentemente.
                      </p>
                    )}

                  {canViewLogs &&
                    !logsLoading &&
                    !logsError &&
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-2 rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2.5"
                      >
                        <div className="mt-[2px] flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-emerald-300">
                          {getInitials(log.admin_nome || "ADM")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-100">
                            {log.admin_nome || "Administrador"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-300">
                            {log.acao}
                            {log.detalhes && (
                              <span className="text-slate-400">
                                {" "}
                                — {log.detalhes}
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500">
                            {formatLogDate(log.criado_em)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* ALERTAS + MINI-RANKINGS */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* ALERTAS */}
              <div className="col-span-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300">
                      Alertas da loja
                    </p>
                    <h2 className="text-sm font-semibold text-slate-50">
                      O que precisa de atenção
                    </h2>
                  </div>
                  {alertas.length > 0 && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-[2px] text-[10px] font-medium text-amber-200">
                      {alertas.length} alerta(s)
                    </span>
                  )}
                </div>

                <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
                  {alertasLoading && (
                    <div className="flex items-center justify-center py-5 text-xs text-slate-400">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">
                        Verificando status da loja...
                      </span>
                    </div>
                  )}

                  {alertasError && !alertasLoading && (
                    <p className="text-xs text-rose-300">
                      {alertasError}
                    </p>
                  )}

                  {!alertasLoading &&
                    !alertasError &&
                    alertas.length === 0 && (
                      <p className="text-xs text-slate-400">
                        Nenhum alerta crítico no momento. Sua loja está
                        saudável. 🎉
                      </p>
                    )}

                  {alertas.map((alerta) => {
                    const colors = getAlertColors(alerta.nivel);
                    return (
                      <div
                        key={alerta.id}
                        className="rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2.5"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span
                            className={`h-2.5 w-2.5 rounded-full ${colors.dot}`}
                          />
                          <span
                            className={`rounded-full px-2 py-[1px] text-[10px] font-medium uppercase tracking-[0.14em] ${colors.badge}`}
                          >
                            {alerta.tipo.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-100">
                          {alerta.titulo}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-300">
                          {alerta.mensagem}
                        </p>
                        {alerta.link && alerta.link_label && (
                          <Link
                            href={alerta.link}
                            className="mt-1 inline-flex text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
                          >
                            {alerta.link_label} →
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TOP CLIENTES */}
              <div className="col-span-1 flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      Ranking
                    </p>
                    <h2 className="text-sm font-semibold text-slate-50">
                      Top clientes
                    </h2>
                  </div>
                  <Link
                    href="/admin/relatorios/clientes"
                    className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
                  >
                    Ver todos →
                  </Link>
                </div>

                <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
                  {topsLoading && (
                    <div className="flex items-center justify-center py-5 text-xs text-slate-400">
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">
                        Carregando ranking...
                      </span>
                    </div>
                  )}

                  {topsError && !topsLoading && topClientes.length === 0 && (
                    <p className="text-xs text-rose-300">
                      {topsError}
                    </p>
                  )}

                  {!topsLoading &&
                    !topsError &&
                    topClientes.length === 0 && (
                      <p className="text-xs text-slate-400">
                        Ainda não há clientes ranqueados.
                      </p>
                    )}

                  {topClientes.map((cli, index) => (
                    <div
                      key={cli.id}
                      className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-100">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-100">
                            {cli.nome}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {cli.total_pedidos} pedido(s) ·{" "}
                            {formatMoney(cli.total_gasto)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP PRODUTOS / SERVIÇOS */}
              <div className="col-span-1 flex flex-col gap-3">
                {/* Top produtos */}
                <div className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        Ranking
                      </p>
                      <h2 className="text-sm font-semibold text-slate-50">
                        Top produtos
                      </h2>
                    </div>
                    <Link
                      href="/admin/relatorios/produtos"
                      className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      Ver todos →
                    </Link>
                  </div>

                  <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
                    {topsLoading && (
                      <div className="flex items-center justify-center py-4 text-xs text-slate-400">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">
                          Carregando ranking...
                        </span>
                      </div>
                    )}

                    {!topsLoading &&
                      !topsError &&
                      topProdutos.length === 0 && (
                        <p className="text-xs text-slate-400">
                          Nenhum produto ranqueado ainda.
                        </p>
                      )}

                    {topProdutos.map((prod, index) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-100">
                            {index + 1}. {prod.nome}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {prod.total_vendido} un. ·{" "}
                            {formatMoney(prod.receita_total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top serviços */}
                <div className="flex flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        Ranking
                      </p>
                      <h2 className="text-sm font-semibold text-slate-50">
                        Top serviços
                      </h2>
                    </div>
                    <Link
                      href="/admin/relatorios/servicos"
                      className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
                    >
                      Ver todos →
                    </Link>
                  </div>

                  <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
                    {topsLoading && (
                      <div className="flex items-center justify-center py-4 text-xs text-slate-400">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">
                          Carregando ranking...
                        </span>
                      </div>
                    )}

                    {!topsLoading &&
                      !topsError &&
                      topServicos.length === 0 && (
                        <p className="text-xs text-slate-400">
                          Nenhum serviço ranqueado ainda.
                        </p>
                      )}

                    {topServicos.map((serv, index) => (
                      <div
                        key={serv.id}
                        className="flex items-center justify-between rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-slate-100">
                            {index + 1}. {serv.titulo}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {serv.total_contratos} contrato(s) ·{" "}
                            {formatMoney(serv.receita_total)}
                          </p>
                          {typeof serv.nota_media === "number" && (
                            <p className="text-[11px] text-amber-300">
                              ⭐ {serv.nota_media.toFixed(1)} média
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ATALHOS RÁPIDOS */}
            <section className="mt-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                    Navegação rápida
                  </p>
                  <h2 className="text-sm font-semibold text-slate-50">
                    Módulos principais do painel
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {quickLinks
                  .filter((link) => hasPermission(link.permission)) // 👈 só mostra se tiver permissão
                  .map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-xs text-slate-200 shadow-sm shadow-slate-950/40 transition hover:-translate-y-[1px] hover:border-emerald-500/60 hover:bg-slate-900"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="text-base">{link.icon}</span>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium text-emerald-300 opacity-0 transition group-hover:opacity-100">
                          Abrir
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-50">
                          {link.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {link.description}
                        </p>
                      </div>
                    </Link>
                  ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
