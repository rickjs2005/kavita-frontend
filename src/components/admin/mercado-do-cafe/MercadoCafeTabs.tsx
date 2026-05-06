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
        // Mobile (<md): faixa rolante horizontal com underline ativa.
        // Desktop (≥md): wrap em pills mantem visual original.
        // overscroll-x-contain evita pull-to-refresh durante swipe.
        className="-mx-1 flex gap-1 overflow-x-auto overscroll-x-contain px-1 pb-1 md:mx-0 md:flex-wrap md:gap-2 md:overflow-visible md:px-0 md:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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

          // Mobile (<md): aba minimalista com underline ativa em emerald,
          // sem fundo nem borda — reduz competicao visual e consome
          // menos viewport. Desktop (≥md): pill original com fundo.
          const baseMobile =
            "relative inline-flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors duration-200 md:rounded-full md:border md:px-3 md:py-2 md:gap-1.5";
          const baseDesktop = "md:px-4 md:gap-2";

          const activeMobile = "text-emerald-200";
          const inactiveMobile = "text-slate-400 hover:text-slate-200";
          const activeDesktop =
            "md:border-emerald-500/50 md:bg-emerald-500/10 md:text-emerald-200 md:shadow-[0_0_0_1px_rgba(16,185,129,0.25)]";
          const inactiveDesktop =
            "md:border-slate-800 md:bg-slate-950/30 md:text-slate-200 md:hover:border-emerald-500/30 md:hover:bg-slate-950/40";

          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(t.key)}
              className={`${baseMobile} ${baseDesktop} ${
                isActive
                  ? `${activeMobile} ${activeDesktop}`
                  : `${inactiveMobile} ${inactiveDesktop}`
              }`}
            >
              <span aria-hidden className="text-sm">
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
              {/* Underline ativa — somente mobile. md+ usa o pill original. */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-emerald-400 md:hidden"
                />
              )}
            </button>
          );
        })}
      </nav>
      {/* Gradient fade na borda direita — sinaliza scroll horizontal
          em mobile. pointer-events-none nao bloqueia o scroll. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-900/95 to-transparent md:hidden"
      />
    </div>
  );
}
