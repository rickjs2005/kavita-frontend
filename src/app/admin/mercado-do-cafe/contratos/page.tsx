// src/app/admin/mercado-do-cafe/contratos/page.tsx
//
// Listagem global admin de contratos do Mercado do Café (Fase 10.10).
// Antes era apenas tela utilitária "Acessar por ID" — agora a tabela
// é a tela principal e o form por ID permanece em card secundário
// (atalho útil quando o admin já tem o ID na mão, ex: notificação,
// e-mail operacional).
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ContratosAdminTable } from "@/components/admin/contratos/ContratosAdminTable";

export default function AdminContratosIndexPage() {
  const router = useRouter();
  const [idInput, setIdInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAdminAuth();

  const handleUnauthorized = () => {
    logout?.({ redirectTo: "/admin/login" });
  };

  function handleQuickAccess(ev: React.FormEvent) {
    ev.preventDefault();
    setError(null);
    const trimmed = idInput.trim();
    const n = Number(trimmed);
    if (!trimmed || !Number.isInteger(n) || n <= 0) {
      setError("Informe um ID de contrato válido (número inteiro positivo).");
      return;
    }
    router.push(`/admin/mercado-do-cafe/contratos/${n}`);
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-4">
          <Link
            href="/admin/mercado-do-cafe"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
          >
            ← Voltar para Mercado do Café
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-base font-semibold text-slate-50 sm:text-lg">
              Contratos
            </h1>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-400/30">
              Listagem global
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-5 px-3 pb-10 pt-4 sm:px-4">
        {/* Listagem principal */}
        <ContratosAdminTable onUnauthorized={handleUnauthorized} />

        {/* Atalho secundário: acessar por ID quando já se sabe o ID
            (notificação WhatsApp, rodapé do PDF KVT-XXXXX, link
            externo). Mantido fora da tabela para não competir com
            os filtros principais. */}
        <section
          className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5"
          aria-label="Acesso rápido à trilha de auditoria por ID"
        >
          <h2 className="text-sm font-semibold text-slate-200">
            Acesso rápido por ID
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Se você já tem o ID do contrato (notificação WhatsApp, número
            KVT-XXXXX no PDF, link externo), abra a auditoria direto:
          </p>
          <form
            onSubmit={handleQuickAccess}
            className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <input
              id="contrato-id"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={idInput}
              onChange={(e) => {
                setIdInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="ID do contrato — ex.: 42"
              className="h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 [color-scheme:dark]"
            />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200 transition-colors hover:bg-slate-700"
            >
              Ver auditoria →
            </button>
          </form>
          {error && (
            <p
              role="alert"
              className="mt-2 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
            >
              {error}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
