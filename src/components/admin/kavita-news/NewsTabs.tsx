"use client";

export type NewsTabKey = "clima" | "cotacoes" | "posts";

type Props = {
  active: NewsTabKey;
  onChange: (k: NewsTabKey) => void;
};

const tabs: { key: NewsTabKey; label: string; icon: string }[] = [
  { key: "clima", label: "Clima", icon: "🌧️" },
  { key: "cotacoes", label: "Cotações", icon: "📈" },
  { key: "posts", label: "Posts", icon: "📝" },
];

export default function NewsTabs({ active, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-300">
          Kavita News
        </p>
        <h2 className="mt-1 text-sm font-semibold text-slate-50">
          Gestão de conteúdo
        </h2>
        <p className="mt-1 text-[11px] text-slate-400">
          Use as abas para alternar entre os módulos.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const isActive = t.key === active;

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
            </button>
          );
        })}
      </div>
    </div>
  );
}
