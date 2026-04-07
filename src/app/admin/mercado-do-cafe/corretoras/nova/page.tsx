// src/app/admin/mercado-do-cafe/corretoras/nova/page.tsx
"use client";

import Link from "next/link";
import CorretoraForm from "@/components/admin/mercado-do-cafe/corretoras/CorretoraForm";

export default function NovaCorretoraPage() {
  return (
    <div className="relative min-h-screen w-full">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto w-full max-w-4xl px-3 py-3 sm:px-4">
          <Link
            href="/admin/mercado-do-cafe"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 mb-2"
          >
            ← Voltar
          </Link>
          <h1 className="text-base font-semibold text-slate-50 sm:text-lg">
            Nova Corretora
          </h1>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Cadastro manual de corretora de café.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-3 pb-10 pt-4 sm:px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
          <CorretoraForm />
        </div>
      </main>
    </div>
  );
}
