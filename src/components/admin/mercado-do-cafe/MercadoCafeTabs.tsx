// src/components/admin/mercado-do-cafe/MercadoCafeTabs.tsx
"use client";

export type MercadoTabKey =
  | "regional"
  | "corretoras"
  | "solicitacoes"
  | "reviews"
  | "planos";

type Props = {
  active: MercadoTabKey;
  onChange: (k: MercadoTabKey) => void;
  pendingCount?: number;
  reviewsPendingCount?: number;
};

const tabs: { key: MercadoTabKey; label: string; icon: string }[] = [
  { key: "regional", label: "Regional", icon: "🗺️" },
  { key: "corretoras", label: "Corretoras", icon: "☕" },
  { key: "solicitacoes", label: "Solicitações", icon: "📋" },
  { key: "reviews", label: "Avaliações", icon: "⭐" },
  { key: "planos", label: "Planos", icon: "💳" },
];

export default function MercadoCafeTabs({
  active,
  onChange,
  pendingCount = 0,
  reviewsPendingCount = 0,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
          Mercado do Café
        </p>
        <h2 className="mt-1 text-sm font-semibold text-slate-50">
          Gestão de corretoras
        </h2>
        <p className="mt-1 text-[11px] text-slate-400">
          Gerencie corretoras aprovadas e analise novas solicitações.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const isActive = t.key === active;
          const badgeCount =
            t.key === "solicitacoes"
              ? pendingCount
              : t.key === "reviews"
                ? reviewsPendingCount
                : 0;
          const showBadge = badgeCount > 0;

          const base =
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition";
          const activeCls =
            "border-emerald-500/50 bg-emerald-500/10 text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]";
          const inactiveCls =
            "border-slate-800 bg-slate-950/30 text-slate-200 hover:border-emerald-500/30 hover:bg-slate-950/40";

          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={`${base} ${isActive ? activeCls : inactiveCls}`}
            >
              <span className="text-sm">{t.icon}</span>
              <span>{t.label}</span>
              {showBadge && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
