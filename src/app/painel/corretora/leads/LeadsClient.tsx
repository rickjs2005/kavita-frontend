"use client";

// src/app/painel/corretora/leads/LeadsClient.tsx

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { LeadsTable } from "@/components/painel-corretora/LeadsTable";
import { PanelCard } from "@/components/painel-corretora/PanelCard";
import type { CorretoraLead, LeadStatus } from "@/types/lead";

type StatusFilter = LeadStatus | "all";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Novos" },
  { value: "contacted", label: "Em contato" },
  { value: "closed", label: "Fechados" },
  { value: "lost", label: "Perdidos" },
];

type ListResponse = {
  items: CorretoraLead[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export default function LeadsClient() {
  const [leads, setLeads] = useState<CorretoraLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (filter !== "all") qs.set("status", filter);
      qs.set("page", String(page));
      qs.set("limit", "20");

      const res = await apiClient.get<ListResponse>(
        `/api/corretora/leads?${qs.toString()}`,
      );
      setLeads(res.items ?? []);
      setTotalPages(res.pages ?? 1);
      setTotal(res.total ?? 0);
    } catch (err) {
      setError(formatApiError(err, "Erro ao carregar leads.").message);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Pipeline
        </p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
            Leads recebidos
          </h1>
          {!loading && (
            <span className="pb-1 text-xs font-medium text-stone-500">
              <span className="tabular-nums">{total}</span>{" "}
              {total === 1 ? "registro" : "registros"}
            </span>
          )}
        </div>
      </div>

      {/* Filter chips — bloco inset com fundo diferenciado */}
      <div className="rounded-2xl bg-stone-100 p-1.5 ring-1 ring-stone-900/[0.04]">
        <div className="flex flex-wrap items-center gap-1">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-white text-stone-900 shadow-sm shadow-stone-900/[0.06] ring-1 ring-stone-900/[0.05]"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
        >
          {error}
        </div>
      )}

      {loading ? (
        <PanelCard density="spacious" className="text-center">
          <p className="text-xs font-medium text-stone-500">Carregando...</p>
        </PanelCard>
      ) : (
        <LeadsTable leads={leads} onChanged={load} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm shadow-stone-900/[0.03] transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ← Anterior
          </button>
          <span className="text-xs font-medium text-stone-500 tabular-nums">
            Página {page} de {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm shadow-stone-900/[0.03] transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
