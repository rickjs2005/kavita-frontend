"use client";

// src/app/painel/corretora/leads/LeadsClient.tsx
//
// Tela de leads com layout operacional premium — inspirado em
// terminal de corretagem mas com refinamento de produto SaaS.

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { LeadsTable } from "@/components/painel-corretora/LeadsTable";
import type {
  CorretoraLead,
  LeadStatus,
  AmostraStatus,
  BebidaClassificacao,
} from "@/types/lead";

type StatusFilter = LeadStatus | "all";
type AmostraFilter = AmostraStatus | "all";
type BebidaFilter = BebidaClassificacao | "all";
// Presets de prioridade (Sprint 6) — atalhos para "urgente" e "alta
// prioridade" sem exigir que o corretor combine 3 filtros manuais.
type PriorityPreset = "all" | "urgent" | "high";

// Limiares do score (casa com PRIORITY_WEIGHTS do backend). Um lead
// 500+ sacas em córrego especial já soma 55, que bate "alta"; com
// aging de 48h bate "urgente" sem ambiguidade.
const SCORE_URGENT = 60;
const SCORE_HIGH = 40;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Novos" },
  { value: "contacted", label: "Contato" },
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
];

type ListResponse = {
  items: CorretoraLead[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

function currentSafra(): string {
  const now = new Date();
  const y = now.getFullYear();
  return now.getMonth() >= 3 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
}

export default function LeadsClient() {
  const [leads, setLeads] = useState<CorretoraLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [amostraFilter, setAmostraFilter] = useState<AmostraFilter>("all");
  const [bebidaFilter, setBebidaFilter] = useState<BebidaFilter>("all");
  const [priorityPreset, setPriorityPreset] = useState<PriorityPreset>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const hasActiveFilter =
    filter !== "all" ||
    amostraFilter !== "all" ||
    bebidaFilter !== "all" ||
    search.trim().length > 0;

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
    setSearch("");
  };

  // Filtro local por texto (nome/córrego) — evita round-trip ao backend
  // para busca simples. Aplica sobre os leads já carregados da página.
  // Preset de prioridade é outro filtro client-side encadeado.
  const filteredLeads = (
    search.trim().length >= 2
      ? leads.filter((l) => {
          const q = search.toLowerCase();
          return (
            l.nome.toLowerCase().includes(q) ||
            (l.corrego_localidade ?? "").toLowerCase().includes(q) ||
            (l.cidade ?? "").toLowerCase().includes(q)
          );
        })
      : leads
  ).filter((l) => {
    if (priorityPreset === "all") return true;
    const score = l.priority_score ?? 0;
    if (priorityPreset === "urgent") return score >= SCORE_URGENT;
    if (priorityPreset === "high") return score >= SCORE_HIGH;
    return true;
  });

  const todayShort = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      {/* ─── Ticker de contexto ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/[0.04] pb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inset-0 animate-ping rounded-full bg-amber-500/60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-amber-500" />
          </span>
          <span className="text-stone-300">{todayShort}</span>
        </span>
        <span className="text-stone-600">·</span>
        <span className="text-amber-300/80">Safra {currentSafra()}</span>
        <span className="text-stone-600">·</span>
        <span>Zona da Mata · Matas de Minas</span>
        <span className="text-stone-600">·</span>
        <span>
          <span className="text-stone-400">{total}</span>{" "}
          {total === 1 ? "lead" : "leads"}
        </span>
      </div>

      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-stone-50 md:text-2xl">
          Mesa de operação
        </h1>
        <ExportCsvButton statusFilter={filter} />
      </div>

      {/* ─── Presets de prioridade (Sprint 6) ────────────────────
          Chips rápidos ao topo dos filtros: "Urgentes" e "Alta
          prioridade" combinam score automaticamente. Client-side —
          opera sobre os leads já carregados da página. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/70">
          Atalhos
        </span>
        {(
          [
            {
              value: "all" as const,
              label: "Todos",
              count: leads.length,
              tone: "neutral" as const,
            },
            {
              value: "urgent" as const,
              label: "Urgentes",
              count: leads.filter(
                (l) => (l.priority_score ?? 0) >= SCORE_URGENT,
              ).length,
              tone: "rose" as const,
            },
            {
              value: "high" as const,
              label: "Alta prioridade",
              count: leads.filter(
                (l) => (l.priority_score ?? 0) >= SCORE_HIGH,
              ).length,
              tone: "amber" as const,
            },
          ]
        ).map((chip) => {
          const active = priorityPreset === chip.value;
          const activeClass =
            chip.tone === "rose"
              ? "bg-rose-500/15 text-rose-200 ring-rose-400/30"
              : chip.tone === "amber"
                ? "bg-amber-500/15 text-amber-200 ring-amber-400/30"
                : "bg-white/[0.08] text-stone-100 ring-white/15";
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setPriorityPreset(chip.value)}
              disabled={chip.count === 0 && chip.value !== "all"}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? activeClass
                  : "bg-white/[0.03] text-stone-400 ring-white/[0.06] hover:text-stone-200"
              }`}
            >
              {chip.label}
              <span
                className={`inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-white/[0.06] text-stone-400"
                }`}
              >
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Filtros ───────────────────────────────────────────
          Em mobile o container vira coluna — busca full-width em cima,
          cada FilterGroup em linha própria com chips em flex-wrap (as
          5+ opções de Status/Bebida não cabem lado a lado em 375px).
          Em sm+ volta ao layout horizontal original. */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-stone-900/50">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2 sm:p-4">
          {/* Busca */}
          <div className="relative w-full sm:w-auto sm:min-w-[200px]">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500 sm:left-2.5 sm:h-3.5 sm:w-3.5"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome ou córrego..."
              className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/25 [color-scheme:dark] sm:h-8 sm:pl-8 sm:text-[12px]"
            />
          </div>

          {/* Filtros em linha */}
          <FilterGroup label="Status" items={STATUS_FILTERS} value={filter} onChange={(v) => setFilter(v as StatusFilter)} />
          <FilterGroup label="Amostra" items={AMOSTRA_FILTERS} value={amostraFilter} onChange={(v) => setAmostraFilter(v as AmostraFilter)} />
          <FilterGroup label="Bebida" items={BEBIDA_FILTERS} value={bebidaFilter} onChange={(v) => setBebidaFilter(v as BebidaFilter)} />

          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="self-start text-[11px] font-semibold text-amber-300/70 transition-colors hover:text-amber-200 sm:self-auto sm:text-[10px]"
            >
              ✕ Limpar
            </button>
          )}
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
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-white/[0.04] bg-stone-900/50"
            />
          ))}
        </div>
      ) : (
        <LeadsTable leads={filteredLeads} onChanged={load} />
      )}

      {/* ─── Paginação — botões grandes no mobile pra navegar com
          polegar sem precisar mirar; compactos em desktop. ───── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-stone-300 transition-colors hover:border-amber-400/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:min-w-0 sm:px-3 sm:text-[11px]"
            aria-label="Página anterior"
          >
            ←
          </button>
          <span className="font-mono text-[12px] font-medium tabular-nums text-stone-400 sm:text-[11px] sm:text-stone-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-stone-300 transition-colors hover:border-amber-400/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:min-w-0 sm:px-3 sm:text-[11px]"
            aria-label="Próxima página"
          >
            →
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
      // URL relativa — cai no rewrite do next.config.ts que faz proxy
      // pro backend. Mantém o cookie no mesmo domínio (localhost/IP/túnel).
      const qs = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const url = `/api/corretora/leads/export${qs}`;
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
          // Feature não liberada no plano atual. Oferece caminho direto
          // pra resolver em vez de deixar a corretora no escuro.
          toast.error(
            (t) => (
              <span className="text-sm">
                Exportar CSV não está liberado no seu plano atual.{" "}
                <button
                  type="button"
                  onClick={() => {
                    toast.dismiss(t.id);
                    window.location.href = "/painel/corretora/planos";
                  }}
                  className="font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-800"
                >
                  Ver planos
                </button>
              </span>
            ),
            { duration: 7000 },
          );
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
      className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 text-[11px] font-semibold text-stone-300 transition-colors hover:border-amber-400/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-60 sm:h-8"
      title="Exportar CSV"
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
        <path
          fillRule="evenodd"
          d="M10 3a1 1 0 011 1v7.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 11.586V4a1 1 0 011-1zM4 15a1 1 0 011 1v1h10v-1a1 1 0 112 0v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1z"
          clipRule="evenodd"
        />
      </svg>
      {downloading ? "..." : "CSV"}
    </button>
  );
}

// ─── FilterGroup (compact) ──────────────────────────────────────

function FilterGroup({
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
  // Em mobile: label vai pra linha separada e chips quebram em várias
  // linhas (flex-wrap) — evita que 5 opções de Status/Bebida estourem
  // os 375px. Chips ganham padding maior (px-2.5 py-1) pra ter tap
  // target ≈32px. Em sm+ volta ao layout inline compacto original.
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400 sm:text-[9px] sm:tracking-[0.1em] sm:text-stone-500">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
        {items.map((f) => {
          const active = value === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => onChange(f.value)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all sm:px-2 sm:py-0.5 ${
                active
                  ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30"
                  : "bg-white/[0.03] text-stone-400 ring-1 ring-white/[0.06] hover:text-stone-200 sm:bg-transparent sm:text-stone-500 sm:ring-0"
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
