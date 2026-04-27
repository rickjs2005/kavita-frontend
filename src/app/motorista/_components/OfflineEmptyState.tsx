"use client";

// OfflineEmptyState: full-screen state shown when the motorista is offline
//   AND we have NOTHING cached yet (first open without internet).
//   Replaces the misleading "Sem rota para hoje" message in that scenario.
//
// Distinct from `_components/OfflineBanner.tsx`, which is the persistent
// top strip that shows pending queue actions / "no connection" status
// regardless of whether route data is available. The banner stays; this
// component is for the no-data dead-end.

import { Loader2, WifiOff } from "lucide-react";

interface OfflineEmptyStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function OfflineEmptyState({
  onRetry,
  isRetrying = false,
}: OfflineEmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="px-6 py-12 flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-5">
        <WifiOff className="w-8 h-8 text-amber-300" aria-hidden="true" />
      </div>

      <h1 className="text-lg font-semibold text-stone-50">
        Você está sem internet e ainda não temos dados da sua rota.
      </h1>

      <p className="mt-2 text-sm text-stone-400 max-w-xs">
        Quando você se conectar, suas ações vão sincronizar automaticamente.
      </p>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 text-stone-950 font-bold uppercase tracking-wider text-xs disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isRetrying ? (
          <>
            <Loader2
              className="w-4 h-4 animate-spin"
              aria-hidden="true"
            />
            Tentando…
          </>
        ) : (
          "Tentar novamente"
        )}
      </button>
    </div>
  );
}
