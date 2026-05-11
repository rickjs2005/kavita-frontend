// src/app/admin/mercado-do-cafe/contratos/[id]/page.tsx
//
// Detalhe admin de um contrato — primeira tela do módulo
// /admin/mercado-do-cafe/contratos. Por ora foca em rastreabilidade
// (trilha contract_audit_log). Conforme novos endpoints admin de
// contrato forem expostos pelo backend (lista global, download PDF
// admin, ações de moderação), esta página vai ganhar mais seções.
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { ContractAuditTimeline } from "@/components/admin/contratos/ContractAuditTimeline";

export default function AdminContratoDetailPage() {
  const params = useParams();
  const idParam = params.id as string;
  const id = Number(idParam);
  const { logout } = useAdminAuth();

  const handleUnauthorized = () => {
    // Mesmo padrão dos outros hooks admin: se a sessão expirou no meio
    // do fetch, força logout para o admin re-autenticar e voltar à
    // página. Sem isso, o erro vira só toast e o usuário fica preso.
    logout?.({ redirectTo: "/admin/login" });
  };

  const validId = Number.isInteger(id) && id > 0;

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
              Contrato{" "}
              <span className="font-mono text-slate-400">#{idParam}</span>
            </h1>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-400/30">
              Auditoria
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl space-y-6 px-3 pb-10 pt-4 sm:px-4">
        {!validId ? (
          <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-6 text-sm text-rose-200">
            ID de contrato inválido na URL.
          </p>
        ) : (
          <ContractAuditTimeline
            contratoId={id}
            onUnauthorized={handleUnauthorized}
          />
        )}
      </main>
    </div>
  );
}
