"use client";

type Props = {
  message?: string;
  /**
   * "default" → fundo claro (páginas públicas / admin light)
   * "dark"    → fundo escuro (admin dark theme)
   * "inline"  → sem card, só texto centralizado (dentro de grids/listas)
   */
  variant?: "default" | "dark" | "inline";
};

export function LoadingState({
  message = "Carregando…",
  variant = "default",
}: Props) {
  if (variant === "inline") {
    return (
      <p role="status" aria-live="polite" className="col-span-full py-6 text-center text-sm text-gray-500">
        <Spinner className="mr-2 inline-block text-gray-400" />
        {message}
      </p>
    );
  }

  if (variant === "dark") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-2xl bg-slate-900/60 px-4 py-5 text-sm text-slate-300 shadow-sm"
      >
        <Spinner className="text-slate-400" />
        {message}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-5 text-sm text-gray-600 shadow-sm sm:px-6"
    >
      <Spinner className="text-gray-400" />
      {message}
    </div>
  );
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin shrink-0 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
