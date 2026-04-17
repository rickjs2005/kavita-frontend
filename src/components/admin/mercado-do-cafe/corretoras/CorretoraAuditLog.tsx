"use client";

// src/components/admin/mercado-do-cafe/corretoras/CorretoraAuditLog.tsx
//
// Timeline de ações do admin sobre uma corretora específica. Consome
// GET /api/admin/mercado-do-cafe/corretoras/:id/audit-logs que mescla
// eventos de target_type='corretora' (status/featured/invite) com
// eventos da submissão original (approved/rejected).
//
// Intenção: dar visibilidade de governança por corretora sem o admin
// precisar abrir /admin/auditoria e filtrar manualmente. O backend já
// tinha tudo; faltava UI.

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type AuditLog = {
  id: number;
  admin_id: number | null;
  admin_nome: string | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
};

type Props = {
  corretoraId: number | string;
};

// Labels humanos por ação — facilita scan visual. Fallback no default
// mostra a chave crua (se aparecer ação nova ainda sem label, pelo
// menos o operador vê o nome técnico).
function actionLabel(action: string): string {
  switch (action) {
    case "corretora.approved":
      return "Cadastro aprovado";
    case "corretora.rejected":
      return "Cadastro rejeitado";
    case "corretora.status_changed":
      return "Status alterado";
    case "corretora.featured_changed":
      return "Destaque alterado";
    case "corretora.invite.sent":
      return "Convite enviado";
    case "review.moderated":
      return "Avaliação moderada";
    case "plan.assigned":
      return "Plano atribuído";
    case "plan.updated":
      return "Plano atualizado";
    default:
      return action;
  }
}

function actionTone(action: string): "emerald" | "rose" | "amber" | "slate" {
  if (action.includes("approved") || action.includes("invite"))
    return "emerald";
  if (action.includes("rejected")) return "rose";
  if (action.includes("featured") || action.includes("status"))
    return "amber";
  return "slate";
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Renderiza meta em formato humano: objetos simples viram "key: value"
// bullets. Objetos complexos ficam como <details> colapsado.
function MetaBlock({ meta }: { meta: AuditLog["meta"] }) {
  if (!meta || Object.keys(meta).length === 0) return null;
  const entries = Object.entries(meta);
  const allPrimitive = entries.every(
    ([, v]) => v === null || ["string", "number", "boolean"].includes(typeof v),
  );
  if (allPrimitive) {
    return (
      <dl className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400">
        {entries.map(([k, v]) => (
          <div key={k} className="inline-flex items-baseline gap-1">
            <dt className="font-mono text-slate-500">{k}:</dt>
            <dd className="text-slate-300">{String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <details className="mt-1 text-[11px] text-slate-400">
      <summary className="cursor-pointer select-none text-slate-500 hover:text-slate-300">
        Ver detalhes
      </summary>
      <pre className="mt-1 overflow-x-auto rounded bg-slate-900/60 p-2 text-[10px] leading-relaxed text-slate-300">
        {JSON.stringify(meta, null, 2)}
      </pre>
    </details>
  );
}

const TONE_STYLES = {
  emerald: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  rose: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
  slate: "bg-slate-500/10 text-slate-300 ring-slate-500/30",
} as const;

export default function CorretoraAuditLog({ corretoraId }: Props) {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<AuditLog[]>(
        `/api/admin/mercado-do-cafe/corretoras/${corretoraId}/audit-logs`,
      );
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = formatApiError(err, "Erro ao carregar histórico.").message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [corretoraId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section
      aria-label="Histórico de ações do admin"
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-6"
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
            Histórico
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Ações do admin sobre esta corretora (últimas 50).
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-60"
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </header>

      {loading && items.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          Carregando histórico…
        </p>
      ) : error ? (
        <p className="py-6 text-center text-xs text-rose-300">{error}</p>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          Nenhuma ação registrada ainda para esta corretora.
        </p>
      ) : (
        <ol className="relative space-y-3 border-l border-slate-800 pl-4">
          {items.map((item) => {
            const tone = actionTone(item.action);
            const label = actionLabel(item.action);
            const admin = item.admin_nome || "Admin removido";
            return (
              <li key={item.id} className="relative">
                <span
                  aria-hidden
                  className={`absolute -left-[22px] top-1 flex h-3 w-3 items-center justify-center rounded-full ring-2 ring-slate-900 ${TONE_STYLES[tone].replace("ring-", "bg-").split(" ")[0]}`}
                />
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ring-1 ${TONE_STYLES[tone]}`}
                  >
                    {label}
                  </span>
                  <span className="text-[11px] text-slate-400">por</span>
                  <span className="text-[11px] font-semibold text-slate-200">
                    {admin}
                  </span>
                  <span
                    className="ml-auto text-[10px] tabular-nums text-slate-500"
                    title={item.created_at}
                  >
                    {formatDateTime(item.created_at)}
                  </span>
                </div>
                <MetaBlock meta={item.meta} />
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
