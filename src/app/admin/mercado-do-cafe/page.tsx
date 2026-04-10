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
import { useCorretorasAdmin } from "@/hooks/useCorretorasAdmin";
import { useCorretoraSubmissions } from "@/hooks/useCorretoraSubmissions";

export default function AdminMercadoDoCafePage() {
  const router = useRouter();
  const { logout } = useAdminAuth();

  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/admin/login");
  }, [logout, router]);

  const [activeTab, setActiveTab] = useState<MercadoTabKey>("corretoras");

  const corretoras = useCorretorasAdmin({ onUnauthorized: handleUnauthorized });
  const submissions = useCorretoraSubmissions({ onUnauthorized: handleUnauthorized });

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

          <Link
            href="/admin/mercado-do-cafe/corretoras/nova"
            className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            + Nova Corretora
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pb-10 pt-4 sm:px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
          <MercadoCafeTabs
            active={activeTab}
            onChange={setActiveTab}
            pendingCount={submissions.pendingCount}
          />

          <div className="mt-4">
            {activeTab === "corretoras" && (
              <CorretorasTable
                rows={corretoras.rows}
                loading={corretoras.loading}
                onToggleStatus={corretoras.toggleStatus}
                onToggleFeatured={corretoras.toggleFeatured}
                onInviteUser={corretoras.inviteUser}
              />
            )}

            {activeTab === "solicitacoes" && (
              <SubmissionsTable
                rows={submissions.rows}
                loading={submissions.loading}
                statusFilter={submissions.statusFilter}
                onStatusFilterChange={submissions.setStatusFilter}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
