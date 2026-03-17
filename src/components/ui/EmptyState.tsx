"use client";

type Action = {
  label: string;
  onClick: () => void;
};

type Props = {
  message: string;
  /**
   * "default" → borda tracejada cinza, fundo claro (páginas públicas / admin light)
   * "dark"    → borda tracejada slate, fundo escuro (admin dark theme)
   * "inline"  → sem card, só texto (dentro de grids/listas/tabelas)
   */
  variant?: "default" | "dark" | "inline";
  /** Botão de ação opcional (ex: "Limpar filtros", "Adicionar produto") */
  action?: Action;
};

export function EmptyState({ message, variant = "default", action }: Props) {
  if (variant === "inline") {
    return (
      <p role="status" className="col-span-full py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        {message}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="ml-2 text-emerald-600 underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded dark:text-emerald-400"
          >
            {action.label}
          </button>
        )}
      </p>
    );
  }

  if (variant === "dark") {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-8 text-center text-sm text-slate-400"
      >
        <EmptyIcon className="text-slate-600" />
        <span>{message}</span>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
    >
      <EmptyIcon className="text-gray-300 dark:text-gray-600" />
      <span>{message}</span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-gray-400 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

function EmptyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-8 w-8 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
      />
    </svg>
  );
}
