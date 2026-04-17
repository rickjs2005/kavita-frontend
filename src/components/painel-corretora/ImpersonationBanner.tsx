"use client";

// src/components/painel-corretora/ImpersonationBanner.tsx
//
// Banner persistente exibido quando o painel está sendo acessado por
// um admin em modo impersonação (claim JWT `impersonation`). Aparece
// no topo do shell, acima da CorretoraPanelNav, visível em todas as
// páginas internas. Tom rose intencional — sinaliza "estado especial"
// sem se confundir com o amber do produto.

import { useCorretoraAuth } from "@/context/CorretoraAuthContext";

export function ImpersonationBanner() {
  const { user, exitImpersonation } = useCorretoraAuth();
  if (!user?.impersonation) return null;

  const adminLabel = user.impersonation.admin_nome
    ? user.impersonation.admin_nome
    : "Admin Kavita";

  return (
    <div
      role="alert"
      className="sticky top-0 z-50 border-b border-rose-500/40 bg-rose-950/90 text-rose-50 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-start gap-2 text-[12px] leading-snug">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 h-4 w-4 shrink-0 text-rose-300"
            aria-hidden
          >
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="font-semibold uppercase tracking-[0.14em] text-[10px] text-rose-200">
              Modo impersonação
            </p>
            <p className="mt-0.5">
              Você está vendo o painel como{" "}
              <strong className="text-rose-100">
                {user.corretora_name}
              </strong>{" "}
              em nome de{" "}
              <strong className="text-rose-100">{adminLabel}</strong>. Toda
              ação executada será registrada na auditoria.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => exitImpersonation()}
          className="shrink-0 rounded-lg bg-rose-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-rose-50 shadow-md shadow-rose-900/40 transition-colors hover:bg-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-rose-950"
        >
          Voltar ao admin
        </button>
      </div>
    </div>
  );
}
