// src/components/admin/mercado-do-cafe/MercadoCafeTabs.tsx
"use client";

// Refator de responsividade (Mercado do Café — admin):
//   - Removido o cabeçalho duplicado (kicker + h2 + descrição). O
//     AdminPageHeader da própria página já exibe todos esses dados;
//     repetir aqui empilhava 4 linhas extras consumindo viewport
//     em mobile.
//   - Em telas <sm os pills agora rolam HORIZONTALMENTE em vez de
//     fazer wrap em 3 linhas. Mantém todos os 5 itens acessíveis sem
//     sumir nem empurrar conteúdo pra fora da tela.
//   - Em ≥sm volta ao layout flex-wrap original.
//   - Tap target preservado: padding interno 9px = 36px de altura
//     visual; o CSS global do projeto força mínimo 44px em pointer
//     coarse via @media — testado nos demais admin pages.

export type MercadoTabKey =
  | "regional"
  | "corretoras"
  | "solicitacoes"
  | "reviews"
  | "planos"
  | "suporte";

type Props = {
  active: MercadoTabKey;
  onChange: (k: MercadoTabKey) => void;
  pendingCount?: number;
  reviewsPendingCount?: number;
  supportUnreadCount?: number;
};

const tabs: { key: MercadoTabKey; label: string; icon: string }[] = [
  { key: "regional", label: "Regional", icon: "🗺️" },
  { key: "corretoras", label: "Corretoras", icon: "☕" },
  { key: "solicitacoes", label: "Solicitações", icon: "📋" },
  { key: "reviews", label: "Avaliações", icon: "⭐" },
  { key: "planos", label: "Planos", icon: "💳" },
  { key: "suporte", label: "Suporte", icon: "💬" },
];

export default function MercadoCafeTabs({
  active,
  onChange,
  pendingCount = 0,
  reviewsPendingCount = 0,
  supportUnreadCount = 0,
}: Props) {
  return (
    <div className="relative">
      <nav
        aria-label="Seções do Mercado do Café"
        // Mobile: faixa rolante horizontal com tap targets ≥44px;
        // sem barra de scroll visual.
        // Desktop (≥sm): wrap natural em pills.
        // overscroll-x-contain evita pull-to-refresh durante swipe.
        className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const isActive = t.key === active;
          const badgeCount =
            t.key === "solicitacoes"
              ? pendingCount
              : t.key === "reviews"
                ? reviewsPendingCount
                : t.key === "suporte"
                  ? supportUnreadCount
                  : 0;
          const showBadge = badgeCount > 0;

          // Mobile: h-11 (44px touch target), px-4, fonte sm.
          // Desktop: pill original menor (sm:h-auto sm:py-2 sm:text-xs).
          const base =
            "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors sm:h-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-xs";
          const activeCls =
            "border-emerald-500/60 bg-emerald-500/15 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]";
          const inactiveCls =
            "border-slate-800 bg-slate-950/30 text-slate-200 hover:border-emerald-500/30 hover:bg-slate-950/40";

          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(t.key)}
              className={`${base} ${isActive ? activeCls : inactiveCls}`}
            >
              <span aria-hidden className="text-base sm:text-sm">
                {t.icon}
              </span>
              <span>{t.label}</span>
              {showBadge && (
                <span
                  aria-label={`${badgeCount} pendentes`}
                  className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white"
                >
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      {/* Fade-out direito sinalizando scroll horizontal — so mobile.
          pointer-events-none nao bloqueia gesto. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-slate-900/80 to-transparent sm:hidden"
      />
    </div>
  );
}
