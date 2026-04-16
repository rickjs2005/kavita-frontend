"use client";

// src/app/painel/corretora/leads/LeadsClient.tsx

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { LeadsTable } from "@/components/painel-corretora/LeadsTable";
import { PanelCard } from "@/components/painel-corretora/PanelCard";
import type {
  CorretoraLead,
  LeadStatus,
  AmostraStatus,
  BebidaClassificacao,
} from "@/types/lead";

type StatusFilter = LeadStatus | "all";
type AmostraFilter = AmostraStatus | "all";
type BebidaFilter = BebidaClassificacao | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Novos" },
  { value: "contacted", label: "Em contato" },
  { value: "closed", label: "Fechados" },
  { value: "lost", label: "Perdidos" },
];

const AMOSTRA_FILTERS: { value: AmostraFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "prometida", label: "Prometida" },
  { value: "recebida", label: "Recebida" },
  { value: "laudada", label: "Laudada" },
];

const BEBIDA_FILTERS: { value: BebidaFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "especial", label: "Especial" },
  { value: "dura", label: "Dura" },
  { value: "riado", label: "Riado" },
  { value: "rio", label: "Rio" },
  { value: "escolha", label: "Escolha" },
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
  const [amostraFilter, setAmostraFilter] = useState<AmostraFilter>("all");
  const [bebidaFilter, setBebidaFilter] = useState<BebidaFilter>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const hasActiveFilter =
    filter !== "all" || amostraFilter !== "all" || bebidaFilter !== "all";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (filter !== "all") qs.set("status", filter);
      if (amostraFilter !== "all") qs.set("amostra_status", amostraFilter);
      if (bebidaFilter !== "all")
        qs.set("bebida_classificacao", bebidaFilter);
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
  }, [filter, amostraFilter, bebidaFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filter, amostraFilter, bebidaFilter]);

  const clearFilters = () => {
    setFilter("all");
    setAmostraFilter("all");
    setBebidaFilter("all");
  };

  return (
    <div className="space-y-5">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
            Pipeline
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-50 md:text-3xl">
            Leads recebidos
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <span className="text-[11px] font-medium tabular-nums text-stone-500">
              {total} {total === 1 ? "registro" : "registros"}
            </span>
          )}
          <ExportCsvButton statusFilter={filter} />
        </div>
      </div>

      {/* ─── Filtros ─────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-stone-900/40">
        <div className="border-b border-white/[0.04] px-4 py-2.5 sm:px-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
              Filtros
            </p>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[10px] font-semibold text-amber-300/70 transition-colors hover:text-amber-200"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1 p-2 sm:p-3">
          <FilterRow
            label="Status"
            items={STATUS_FILTERS}
            value={filter}
            onChange={(v) => setFilter(v as StatusFilter)}
          />
          <FilterRow
            label="Amostra"
            items={AMOSTRA_FILTERS}
            value={amostraFilter}
            onChange={(v) => setAmostraFilter(v as AmostraFilter)}
          />
          <FilterRow
            label="Bebida"
            items={BEBIDA_FILTERS}
            value={bebidaFilter}
            onChange={(v) => setBebidaFilter(v as BebidaFilter)}
          />
        </div>
      </div>

      {/* ─── Conteúdo ────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-200"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-white/[0.04] bg-stone-900/40"
            />
          ))}
        </div>
      ) : (
        <LeadsTable leads={leads} onChanged={load} />
      )}

      {/* ─── Paginação ───────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex min-h-[36px] items-center rounded-lg border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-stone-300 transition-colors hover:border-amber-400/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Mais recentes
          </button>
          <span className="text-[11px] font-medium tabular-nums text-stone-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex min-h-[36px] items-center rounded-lg border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-stone-300 transition-colors hover:border-amber-400/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anteriores →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── ExportCsvButton ──────────────────────────────────────────────

function ExportCsvButton({ statusFilter }: { statusFilter: StatusFilter }) {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const qs = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
      const url = `${apiBase}/api/corretora/leads/export${qs}`;

      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "text/csv" },
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent("auth:expired"));
          return;
        }
        if (res.status === 403) {
          let msg = "Exportação não permitida no seu plano atual.";
          try {
            const body = await res.json();
            if (body?.message) msg = body.message;
          } catch {
            // fallback
          }
          toast.error(msg);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = /filename="?([^";]+)"?/i.exec(disposition);
      a.download =
        match?.[1] ??
        `leads-kavita-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success("CSV exportado.");
    } catch (err) {
      toast.error(formatApiError(err, "Erro ao exportar.").message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={downloading}
      className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-stone-300 transition-colors hover:border-amber-400/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      title={
        statusFilter === "all"
          ? "Exportar todos os leads"
          : `Exportar leads "${statusFilter}"`
      }
    >
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 11.586V4a1 1 0 011-1zM4 15a1 1 0 011 1v1h10v-1a1 1 0 112 0v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1z"
          clipRule="evenodd"
        />
      </svg>
      {downloading ? "Exportando..." : "CSV"}
    </button>
  );
}

// ─── FilterRow ────────────────────────────────────────────────────

function FilterRow({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="w-14 shrink-0 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-500 sm:w-16">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1">
        {items.map((f) => {
          const active = value === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => onChange(f.value)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                active
                  ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30"
                  : "text-stone-400 hover:bg-white/[0.04] hover:text-stone-200"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
