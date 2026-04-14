"use client";

// src/app/admin/auditoria/AuditClient.tsx
//
// Lista de audit logs do admin. Filtros por action + target_type.
// Paginação simples.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";

type AuditLog = {
  id: number;
  admin_id: number | null;
  admin_nome: string | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
};

const ACTION_COLORS: Record<string, string> = {
  "corretora.approved": "bg-emerald-500/10 text-emerald-200 ring-emerald-500/30",
  "corretora.rejected": "bg-rose-500/10 text-rose-200 ring-rose-500/30",
  "corretora.status_changed": "bg-amber-500/10 text-amber-200 ring-amber-500/30",
  "corretora.featured_changed": "bg-amber-500/10 text-amber-200 ring-amber-500/30",
  "review.moderated": "bg-sky-500/10 text-sky-200 ring-sky-500/30",
  "plan.assigned": "bg-emerald-500/10 text-emerald-200 ring-emerald-500/30",
};

const ACTION_LABELS: Record<string, string> = {
  "corretora.approved": "Corretora aprovada",
  "corretora.rejected": "Corretora rejeitada",
  "corretora.status_changed": "Status alterado",
  "corretora.featured_changed": "Destaque alterado",
  "review.moderated": "Review moderada",
  "plan.assigned": "Plano atribuído",
};

function formatDate(iso: string) {
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

export default function AuditClient() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: "30",
      });
      if (actionFilter) qs.set("action", actionFilter);
      const res = await apiClient.get<AuditLog[]>(
        `/api/admin/audit?${qs.toString()}`,
      );
      setRows(Array.isArray(res) ? res : []);
      // Note: meta vem fora do data — apiClient faz unwrap defensivo;
      // se vier só array, não temos pages. Para MVP ok.
      setPages(1);
      setTotal(res?.length ?? 0);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        window.location.href = "/admin/login";
        return;
      }
      setError("Erro ao carregar auditoria.");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="relative min-h-screen w-full">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 py-3 sm:px-4">
          <div>
            <Link
              href="/admin/mercado-do-cafe"
              className="text-[11px] font-semibold text-slate-400 hover:text-amber-300"
            >
              ← Mercado do Café
            </Link>
            <h1 className="mt-1 text-base font-semibold text-slate-50 sm:text-lg">
              Auditoria administrativa
            </h1>
            <p className="text-[11px] text-slate-400">
              Histórico de ações sensíveis do admin sobre corretoras, reviews
              e planos.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-3 pb-10 pt-4 sm:px-4">
        {/* Filtros */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {["", ...Object.keys(ACTION_LABELS)].map((key) => {
            const active = actionFilter === key;
            const label = key ? ACTION_LABELS[key] : "Todas";
            return (
              <button
                key={key || "all"}
                type="button"
                onClick={() => {
                  setPage(1);
                  setActionFilter(key);
                }}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  active
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                    : "border-slate-800 bg-slate-950/30 text-slate-400 hover:border-amber-500/30 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {loading && rows.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-400">
            Carregando...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!loading && rows.length === 0 && !error && (
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-xs text-slate-500">
            Nenhum evento{actionFilter ? ` para "${ACTION_LABELS[actionFilter]}"` : ""}.
          </div>
        )}

        {rows.length > 0 && (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ring-1 ${
                          ACTION_COLORS[r.action] ??
                          "bg-slate-800 text-slate-300 ring-slate-700"
                        }`}
                      >
                        {ACTION_LABELS[r.action] ?? r.action}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        por{" "}
                        <span className="font-semibold text-slate-200">
                          {r.admin_nome ?? `admin #${r.admin_id ?? "?"}`}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-500">
                        · {formatDate(r.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {r.target_type ? `${r.target_type} #${r.target_id}` : "—"}
                      {r.ip ? ` · ${r.ip}` : ""}
                    </p>
                    {r.meta && Object.keys(r.meta).length > 0 && (
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900/60 p-2 text-[10px] text-slate-400 ring-1 ring-slate-800">
                        {JSON.stringify(r.meta, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {rows.length >= 30 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-300 disabled:opacity-50"
            >
              ← Anterior
            </button>
            <span className="text-[11px] text-slate-400 tabular-nums">
              Página {page}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-300"
            >
              Próxima →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
