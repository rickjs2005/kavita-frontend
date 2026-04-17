// src/app/admin/mercado-do-cafe/page.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";
import MercadoCafeTabs, {
  type MercadoTabKey,
} from "@/components/admin/mercado-do-cafe/MercadoCafeTabs";
import CorretorasTable from "@/components/admin/mercado-do-cafe/corretoras/CorretorasTable";
import SubmissionsTable from "@/components/admin/mercado-do-cafe/solicitacoes/SubmissionsTable";
import RegionalDashboard from "@/components/admin/mercado-do-cafe/regional/RegionalDashboard";
import ReviewsModeration from "@/components/admin/mercado-do-cafe/reviews/ReviewsModeration";
import PlansAdmin from "@/components/admin/mercado-do-cafe/planos/PlansAdmin";
import { useCorretorasAdmin } from "@/hooks/useCorretorasAdmin";
import { useCorretoraSubmissions } from "@/hooks/useCorretoraSubmissions";
import { useCorretoraReviewsAdmin } from "@/hooks/useCorretoraReviewsAdmin";

export default function AdminMercadoDoCafePage() {
  const router = useRouter();
  const { logout } = useAdminAuth();

  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/admin/login");
  }, [logout, router]);

  const [activeTab, setActiveTab] = useState<MercadoTabKey>("regional");

  const corretoras = useCorretorasAdmin({ onUnauthorized: handleUnauthorized });
  const submissions = useCorretoraSubmissions({ onUnauthorized: handleUnauthorized });
  const reviews = useCorretoraReviewsAdmin({ onUnauthorized: handleUnauthorized });

  return (
    <div className="relative min-h-screen w-full">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
                Kavita Admin
              </span>
            </div>
            <h1 className="truncate text-base font-semibold sm:text-lg text-slate-50">
              Mercado do Café
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
              Gerencie corretoras de café e analise solicitações de cadastro.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Link para o drill-down de auditoria — deixa claro que o
                histórico de ações pertence a este módulo e não é um
                recurso separado de sistema. No mobile vira ícone-only
                para economizar espaço sem sumir. */}
            <Link
              href="/admin/auditoria"
              aria-label="Abrir histórico do Mercado do Café"
              className="inline-flex items-center rounded-xl border border-slate-700 bg-slate-900/60 px-2.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-amber-500/40 hover:text-amber-200 sm:px-3"
              title="Ver tudo que a equipe já fez neste módulo"
            >
              <span aria-hidden className="text-sm sm:mr-1.5">
                🕒
              </span>
              <span className="hidden sm:inline">Histórico</span>
            </Link>
            <Link
              href="/admin/mercado-do-cafe/corretoras/nova"
              className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:px-4"
            >
              + Nova Corretora
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pb-10 pt-4 sm:px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
          <MercadoCafeTabs
            active={activeTab}
            onChange={setActiveTab}
            pendingCount={submissions.pendingCount}
            reviewsPendingCount={reviews.pendingCount}
          />

          <div className="mt-4">
            {activeTab === "regional" && (
              <RegionalDashboard onUnauthorized={handleUnauthorized} />
            )}

            {activeTab === "corretoras" && (
              <div className="space-y-3">
                {/* Toggle "Mostrar arquivadas" — soft delete UI (Sprint 4).
                    Default: oculta arquivadas. Ao ativar, backend passa
                    a incluir deleted_at IS NOT NULL na listagem. */}
                <div className="flex items-center justify-end">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-300">
                    <input
                      type="checkbox"
                      checked={corretoras.filters.includeArchived}
                      onChange={(e) =>
                        corretoras.setFilters((prev) => ({
                          ...prev,
                          includeArchived: e.target.checked,
                          page: 1,
                        }))
                      }
                      className="h-3.5 w-3.5 cursor-pointer accent-rose-400"
                    />
                    Mostrar arquivadas
                  </label>
                </div>
                <CorretorasTable
                  rows={corretoras.rows}
                  loading={corretoras.loading}
                  onToggleStatus={corretoras.toggleStatus}
                  onToggleFeatured={corretoras.toggleFeatured}
                  onInviteUser={corretoras.inviteUser}
                />
              </div>
            )}

            {activeTab === "solicitacoes" && (
              <SubmissionsTable
                rows={submissions.rows}
                loading={submissions.loading}
                statusFilter={submissions.statusFilter}
                onStatusFilterChange={submissions.setStatusFilter}
                onBulkApprove={submissions.bulkApprove}
                onBulkReject={submissions.bulkReject}
              />
            )}

            {activeTab === "reviews" && (
              <ReviewsModeration onUnauthorized={handleUnauthorized} />
            )}

            {activeTab === "planos" && (
              <PlansAdmin onUnauthorized={handleUnauthorized} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
