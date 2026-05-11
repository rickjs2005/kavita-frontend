// src/app/admin/mercado-do-cafe/contratos/page.tsx
//
// Ponto de entrada admin para a auditoria de contratos.
//
// A listagem global admin de contratos depende de endpoint backend
// ainda não exposto (gap documentado na auditoria 2026-05-10). Por
// enquanto esta tela funciona como "acesso por ID": admin digita o
// ID do contrato (que ele já tem via timeline do lead, notificação,
// e-mail operacional ou trilha de webhook) e abre a tela de
// auditoria correspondente em /admin/mercado-do-cafe/contratos/[id].
//
// Quando o endpoint de listagem chegar, basta substituir o formulário
// utilitário por uma tabela paginada — a rota e o link no hub
// continuam válidos.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminContratosIndexPage() {
  const router = useRouter();
  const [idInput, setIdInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(ev: React.FormEvent) {
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
        <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4">
          <Link
            href="/admin/mercado-do-cafe"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
          >
            ← Voltar para Mercado do Café
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-base font-semibold text-slate-50 sm:text-lg">
              Auditoria de contratos
            </h1>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-400/30">
              Append-only
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl space-y-6 px-3 pb-10 pt-4 sm:px-4">
        <section
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20 md:p-6"
          aria-label="Acesso à trilha de auditoria por ID do contrato"
        >
          <h2 className="text-base font-semibold text-slate-100">
            Acessar trilha por ID
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Informe o ID do contrato para abrir a trilha append-only de
            eventos (created, sent_to_signature, signed, cancelled,
            blocked_by_kyc, blocked_by_plan, webhook_applied,
            immutable_blocked etc).
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label
                htmlFor="contrato-id"
                className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400"
              >
                ID do contrato
              </label>
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
                placeholder="ex.: 42"
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 [color-scheme:dark]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-emerald-500"
            >
              Ver auditoria →
            </button>
          </form>

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
            >
              {error}
            </p>
          )}
        </section>

        {/* Nota de gap honesta: a listagem global depende do backend
            expor endpoint admin paginado. Quando estiver pronto,
            substituir esta seção por uma <ContratosTable />. */}
        <section
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-100/90 sm:p-5"
          aria-label="Aviso sobre listagem global"
        >
          <p className="font-semibold text-amber-200">
            Listagem global pendente
          </p>
          <p className="mt-1 leading-relaxed text-amber-100/80">
            O endpoint admin de listagem paginada de contratos ainda não
            está disponível (
            <span className="font-mono">GET /api/admin/contratos</span>). Por
            enquanto, use o campo acima para abrir a auditoria pelo ID.
            Você também encontra o ID nos eventos da timeline do lead, nas
            notificações WhatsApp da corretora e no rodapé dos PDFs
            (KVT-XXXXX).
          </p>
        </section>
      </main>
    </div>
  );
}
