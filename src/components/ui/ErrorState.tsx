"use client";

type Props = {
  message: string;
  /**
   * "default" → alerta vermelho claro (páginas públicas / admin light)
   * "dark"    → alerta vermelho escuro (admin dark theme)
   * "warning" → alerta âmbar (avisos não críticos, admin dark)
   * "inline"  → sem card, só texto (dentro de grids/listas)
   */
  variant?: "default" | "dark" | "warning" | "inline";
  /** Callback opcional para botão "Tentar novamente" */
  onRetry?: () => void;
};

export function ErrorState({
  message,
  variant = "default",
  onRetry,
}: Props) {
  if (variant === "inline") {
    return (
      <p className="col-span-full py-6 text-center text-sm text-red-500">
        {message}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="ml-2 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        )}
      </p>
    );
  }

  if (variant === "warning") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        <WarningIcon />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-xs text-amber-300 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (variant === "dark") {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        <ErrorIcon />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-xs text-red-400 underline hover:no-underline"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-4 text-sm text-red-700 sm:px-5">
      <ErrorIcon />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 text-xs text-red-600 underline hover:no-underline"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}
