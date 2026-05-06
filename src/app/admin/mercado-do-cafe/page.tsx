// src/app/admin/mercado-do-cafe/page.tsx
//
// Refator de responsividade (mercado-do-cafe admin):
//   - Header sticky enxuto. Em mobile, as 4 ações secundárias
//     (Métricas, Reconciliação, Backfill, Histórico) ficam atrás de
//     um menu "Mais" colapsável (<details>) — antes eram 4 botões
//     só com emoji em sequência, sem label, ambíguos pra quem não
//     decora os ícones.
//   - Em ≥sm, layout volta para flat com labels visíveis.
//   - CTA primário "+ Nova Corretora" continua sempre visível.
//   - Toggle "Mostrar arquivadas" alinhado à direita em desktop e
//     com auto-wrap em mobile.
//   - Tabs externas (MercadoCafeTabs) já cuidam do próprio scroll
//     horizontal em <sm.

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
import SupportThreads from "@/components/admin/mercado-do-cafe/suporte/SupportThreads";
import { useCorretorasAdmin } from "@/hooks/useCorretorasAdmin";
import { useCorretoraSubmissions } from "@/hooks/useCorretoraSubmissions";
import { useCorretoraReviewsAdmin } from "@/hooks/useCorretoraReviewsAdmin";

// Item de ação secundária — Link com ícone + label. Em mobile entra
// num menu "Mais" colapsável; em desktop fica flat ao lado do CTA.
type SecondaryActionItem = {
  href: string;
  label: string;
  icon: string;
  ariaLabel: string;
  title: string;
};

const SECONDARY_ACTIONS: SecondaryActionItem[] = [
  {
    href: "/admin/mercado-do-cafe/metricas",
    label: "Métricas",
    icon: "📈",
    ariaLabel: "Abrir dashboard de métricas do Mercado do Café",
    title: "Leads, SLA, reviews e planos — visão 7/30/90 dias",
  },
  {
    href: "/admin/mercado-do-cafe/reconciliacao",
    label: "Reconciliação",
    icon: "💳",
    ariaLabel: "Abrir reconciliação de pagamentos Asaas",
    title: "Status das assinaturas e eventos de webhook do Asaas",
  },
  {
    href: "/admin/mercado-do-cafe/backfill-regional",
    label: "Backfill",
    icon: "📋",
    ariaLabel: "Corretoras com perfil regional incompleto",
    title: "Corretoras que ainda não preencheram os 6 campos regionais",
  },
  {
    href: "/admin/auditoria",
    label: "Histórico",
    icon: "🕒",
    ariaLabel: "Abrir histórico do Mercado do Café",
    title: "Ver tudo que a equipe já fez neste módulo",
  },
];

function SecondaryActionLink({ item }: { item: SecondaryActionItem }) {
  // Mobile: tap target alto (h-11 = 44px) com label visivel.
  // Desktop: compact pill original (h-9, py-2).
  return (
    <Link
      href={item.href}
      aria-label={item.ariaLabel}
      title={item.title}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 text-sm font-semibold text-slate-300 transition-colors hover:border-amber-500/40 hover:text-amber-200 sm:h-9 sm:px-3 sm:text-xs"
    >
      <span aria-hidden className="text-base sm:text-sm">
        {item.icon}
      </span>
      <span>{item.label}</span>
    </Link>
  );
}

// KpiCard — widget de metrica com aparencia de app financeiro premium.
// Numero em destaque, label uppercase pequena, meta opcional com cor
// de accent suave. Inteiramente keyboard-acessivel; toque/click navega
// pra tab relacionada via onClick (sem mudar URL — rapido e leve).
type KpiAccent = "default" | "amber" | "rose" | "emerald";
function KpiCard({
  label,
  value,
  meta,
  accent = "default",
  onClick,
}: {
  label: string;
  value: number | string;
  meta?: string | null;
  accent?: KpiAccent;
  onClick?: () => void;
}) {
  const accentRing: Record<KpiAccent, string> = {
    default: "ring-slate-800/80",
    amber: "ring-amber-500/30",
    rose: "ring-rose-500/30",
    emerald: "ring-emerald-500/30",
  };
  const metaColor: Record<KpiAccent, string> = {
    default: "text-slate-500",
    amber: "text-amber-300/90",
    rose: "text-rose-300/90",
    emerald: "text-emerald-300/90",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-h-[88px] flex-col items-start justify-between gap-1.5 overflow-hidden rounded-2xl bg-slate-900/60 p-3 text-left ring-1 transition-all duration-200 hover:bg-slate-900/80 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:p-4 ${accentRing[accent]}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      <span className="text-3xl font-bold tabular-nums leading-none text-slate-50 sm:text-4xl">
        {value}
      </span>
      {meta && (
        <span className={`text-[11px] font-medium ${metaColor[accent]}`}>
          {meta}
        </span>
      )}
      {/* Highlight sutil no canto superior direito quando ha pendencia */}
      {accent !== "default" && (
        <span
          aria-hidden
          className={`pointer-events-none absolute right-3 top-3 h-2 w-2 rounded-full ${
            accent === "amber"
              ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
              : accent === "rose"
                ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.5)]"
                : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
          }`}
        />
      )}
    </button>
  );
}

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
      {/* Header sticky — mobile-first.
          Mobile (<sm):
            - badge eyebrow
            - h1 text-2xl (forte)
            - subtitle text-sm em 2 linhas
            - CTA full-width h-12
            - "Mais acoes" como <details> compacto abaixo
          Desktop (≥sm): layout horizontal + CTA pequeno a direita. */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            {/* Bloco titulo — eyebrow refinado, h1 forte com tracking
                premium, subtitle suave. Visual inspirado em Stripe/Linear. */}
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                />
                Kavita Admin
              </span>
              <h1 className="mt-2.5 text-[26px] font-bold leading-tight tracking-tight text-slate-50 sm:text-lg">
                Mercado do Café
              </h1>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-slate-400 sm:text-xs">
                Gerencie corretoras de café e analise solicitações de cadastro.
              </p>
            </div>

            {/* Bloco acoes: mobile empilha CTA + details "Mais";
                desktop alinha tudo em linha a direita. */}
            <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
              {/* CTA principal — refinado: sombra sutil, transition-all,
                  active:scale para tactile feedback, ring no focus. */}
              <Link
                href="/admin/mercado-do-cafe/corretoras/nova"
                className="order-1 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-sm font-semibold tracking-tight text-white shadow-[0_4px_20px_-4px_rgba(16,185,129,0.4)] transition-all duration-200 hover:bg-emerald-500 hover:shadow-[0_6px_24px_-4px_rgba(16,185,129,0.5)] active:scale-[0.98] active:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:order-2 sm:h-9 sm:w-auto sm:px-4 sm:text-xs sm:shadow-sm sm:hover:shadow-md"
              >
                <span aria-hidden className="text-base sm:text-sm">+</span>
                <span>Nova Corretora</span>
              </Link>

              {/* Mobile: <details> compacto */}
              <details className="group order-2 relative w-full sm:hidden">
                <summary className="flex h-11 w-full cursor-pointer list-none items-center justify-between rounded-xl border border-slate-700/80 bg-slate-900/40 px-4 text-sm font-medium text-slate-300 transition-colors hover:border-amber-500/40 hover:text-amber-200 [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden className="text-slate-500">⋯</span>
                    <span>Mais ações</span>
                  </span>
                  <span
                    aria-hidden
                    className="text-[10px] text-slate-500 transition-transform duration-200 group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {SECONDARY_ACTIONS.map((a) => (
                    <SecondaryActionLink key={a.href} item={a} />
                  ))}
                </div>
              </details>

              {/* Desktop: acoes flat ao lado do CTA */}
              <div className="hidden sm:order-1 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                {SECONDARY_ACTIONS.map((a) => (
                  <SecondaryActionLink key={a.href} item={a} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-12 pt-6 sm:gap-5 sm:px-6 sm:pt-5">
        {/* Visao geral — strip de KPIs com aparencia de widget de app
            premium. 3 cards: solicitacoes/avaliacoes/corretoras. Toque
            navega pra tab relacionada (sem mudar URL). Em <sm o grid
            fica 3 colunas com numeros grandes; em sm+ acompanha o
            ritmo da tela. */}
        <section
          aria-label="Visão geral"
          className="grid grid-cols-3 gap-3 sm:gap-4"
        >
          <KpiCard
            label="Solicitações"
            value={submissions.pendingCount}
            meta={
              submissions.pendingCount > 0
                ? submissions.pendingCount === 1
                  ? "1 pendente"
                  : `${submissions.pendingCount} pendentes`
                : "em dia"
            }
            accent={submissions.pendingCount > 0 ? "amber" : "default"}
            onClick={() => setActiveTab("solicitacoes")}
          />
          <KpiCard
            label="Avaliações"
            value={reviews.pendingCount}
            meta={
              reviews.pendingCount > 0
                ? reviews.pendingCount === 1
                  ? "1 a moderar"
                  : `${reviews.pendingCount} a moderar`
                : "em dia"
            }
            accent={reviews.pendingCount > 0 ? "rose" : "default"}
            onClick={() => setActiveTab("reviews")}
          />
          <KpiCard
            label="Corretoras"
            value={corretoras.rows.length}
            meta="ver lista"
            accent="default"
            onClick={() => setActiveTab("corretoras")}
          />
        </section>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60 sm:p-5">
          <MercadoCafeTabs
            active={activeTab}
            onChange={setActiveTab}
            pendingCount={submissions.pendingCount}
            reviewsPendingCount={reviews.pendingCount}
          />

          <div className="mt-5 sm:mt-4">
            {activeTab === "regional" && (
              <RegionalDashboard onUnauthorized={handleUnauthorized} />
            )}

            {activeTab === "corretoras" && (
              <div className="space-y-3">
                {/* Toggle "Mostrar arquivadas" — soft delete UI (Sprint 4).
                    Default: oculta arquivadas. Ao ativar, backend passa
                    a incluir deleted_at IS NOT NULL na listagem. */}
                <div className="flex flex-wrap items-center justify-end gap-2">
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

            {activeTab === "suporte" && (
              <SupportThreads onUnauthorized={handleUnauthorized} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
