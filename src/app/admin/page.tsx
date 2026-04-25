"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";
import CloseButton from "@/components/buttons/CloseButton";
import { useDashboardData } from "./dashboard/useDashboardData";
import { KpiSection } from "./dashboard/sections/KpiSection";
import { AlertsAndMetricsSection } from "./dashboard/sections/AlertsAndMetricsSection";
import { OperationsSection } from "./dashboard/sections/OperationsSection";
import { ModulesStatusSection } from "./dashboard/sections/ModulesStatusSection";
import LowStockWidget from "./dashboard/sections/LowStockWidget";

const SalesChartSection = dynamic(
  () => import("./dashboard/sections/SalesChartSection").then((m) => m.SalesChartSection),
  {
    ssr: false,
    loading: () => (
      <div className="h-[340px] animate-pulse rounded-2xl border border-slate-800 bg-slate-900/60" />
    ),
  },
);
import {
  ROLE_LABEL,
  ROLE_SHORT_LABEL,
  ROLE_BADGE_CLASS,
} from "./dashboard/dashboardTypes";
import { getInitials, LoadingSpinner } from "./dashboard/dashboardUtils";

export default function AdminDashboardPage() {
  const { logout, role, nome, hasPermission } = useAdminAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/admin/login");
  }, [logout, router]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/admin/login");
  }, [logout, router]);

  const {
    resumo,
    loading,
    errorMsg,
    chartData,
    chartLoading,
    salesRange,
    changeSalesRange,
    logs,
    logsLoading,
    logsError,
    canViewLogs,
    topClientes,
    topProdutos,
    topServicos,
    topsLoading,
    topsError,
    alertas,
    alertasLoading,
    alertasError,
    modulesStatus,
    modulesLoading,
  } = useDashboardData({ handleUnauthorized, role });

  // ---------------------------------------------------------------------------
  // Full-screen loading / error
  // ---------------------------------------------------------------------------
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
            type="button"
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
      {/* Header */}
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

            <button
              type="button"
              onClick={handleLogout}
              className="hidden shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-rose-900/40 transition-transform hover:translate-y-[1px] hover:shadow-rose-900/10 md:flex"
            >
              <span>🚪</span>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative ml-0 flex h-full w-4/5 max-w-xs flex-col bg-slate-950/95 shadow-xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Menu
              </p>
              <CloseButton
                onClose={() => setIsMobileMenuOpen(false)}
                className="ml-auto"
                aria-label="Fechar menu"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 pb-8 pt-4 sm:px-4">
        {!resumo ? (
          <p className="mt-4 text-sm text-slate-400">
            Nenhum dado disponível para o dashboard.
          </p>
        ) : (
          <>
            <KpiSection resumo={resumo} />

            <OperationsSection
              alertas={alertas}
              alertasLoading={alertasLoading}
              alertasError={alertasError}
            />

            <SalesChartSection
              chartData={chartData}
              chartLoading={chartLoading}
              salesRange={salesRange}
              onRangeChange={changeSalesRange}
              logs={logs}
              logsLoading={logsLoading}
              logsError={logsError}
              canViewLogs={canViewLogs}
            />

            <ModulesStatusSection
              status={modulesStatus}
              loading={modulesLoading}
            />

            {/* A3 — alerta de estoque baixo. Largura total como ModulesStatus. */}
            <LowStockWidget />

            <AlertsAndMetricsSection
              topClientes={topClientes}
              topProdutos={topProdutos}
              topServicos={topServicos}
              topsLoading={topsLoading}
              topsError={topsError}
            />
          </>
        )}
      </main>
    </div>
  );
}
