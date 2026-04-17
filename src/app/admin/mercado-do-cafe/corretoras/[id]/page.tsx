// src/app/admin/mercado-do-cafe/corretoras/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import CorretoraForm from "@/components/admin/mercado-do-cafe/corretoras/CorretoraForm";
import CorretoraAuditLog from "@/components/admin/mercado-do-cafe/corretoras/CorretoraAuditLog";
import ImpersonateCorretoraButton from "@/components/admin/mercado-do-cafe/corretoras/ImpersonateCorretoraButton";
import type { CorretoraAdmin } from "@/types/corretora";

export default function EditCorretoraPage() {
  const params = useParams();
  const id = params.id as string;

  const [corretora, setCorretora] = useState<CorretoraAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get<CorretoraAdmin>(
          `/api/admin/mercado-do-cafe/corretoras/${id}`
        );
        setCorretora(data);
      } catch (err: any) {
        toast.error(err?.message || "Erro ao carregar corretora.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-base font-semibold text-slate-50 sm:text-lg">
              Editar Corretora
            </h1>
            {corretora && (
              <ImpersonateCorretoraButton
                corretoraId={corretora.id}
                corretoraName={corretora.name}
                disabled={corretora.status !== "active"}
                disabledHint="Só corretoras ativas podem ser impersonadas."
              />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl space-y-6 px-3 pb-10 pt-4 sm:px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}
          {!loading && !corretora && (
            <p className="text-sm text-slate-400 text-center py-8">
              Corretora não encontrada.
            </p>
          )}
          {!loading && corretora && <CorretoraForm existing={corretora} />}
        </div>

        {!loading && corretora && (
          <CorretoraAuditLog corretoraId={corretora.id} />
        )}
      </main>
    </div>
  );
}
