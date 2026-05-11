// src/components/admin/contratos/ContratosAdminTable.tsx
//
// Listagem admin de contratos com filtros (busca, status), paginação
// e ação "Ver auditoria" por linha (Fase 10.10).
//
// Mobile: cards empilhados (mesmo padrão de outras tabelas admin do
// projeto). ≥md: tabela com colunas.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminContratos } from "@/hooks/useAdminContratos";
import {
  CONTRATO_STATUS_LABEL,
  CONTRATO_TIPO_LABEL,
  type ContratoAdminListItem,
  type ContratoStatus,
} from "@/types/contrato";

type Props = {
  onUnauthorized?: () => void;
};

const STATUS_OPTIONS: { value: "" | ContratoStatus; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "draft", label: "Rascunho" },
  { value: "sent", label: "Aguardando assinatura" },
  { value: "signed", label: "Assinado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "expired", label: "Expirado" },
];

const STATUS_BADGE_CLASS: Record<ContratoStatus, string> = {
  draft: "bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/30",
  sent: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30",
  signed: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
  cancelled: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30",
  expired: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
};

function formatDatePtBR(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ContratosAdminTable({ onUnauthorized }: Props) {
  const { items, meta, loading, error, filters, setFilters, clear, reload } =
    useAdminContratos({ onUnauthorized });

  // Debounce simples na busca textual: aceita digitação contínua sem
  // disparar fetch a cada tecla. Mantém estado local controlado.
  const [qDraft, setQDraft] = useState<string>(filters.q ?? "");
  useEffect(() => {
    const t = setTimeout(() => {
      if (qDraft.trim() !== (filters.q ?? "")) {
        setFilters((prev) => ({ ...prev, q: qDraft.trim() || undefined, page: 1 }));
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDraft]);

  const hasAnyFilter =
    !!(filters.status || filters.tipo || filters.q || filters.corretora_id ||
      filters.lead_id || filters.date_from || filters.date_to);

  return (
    <section
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/20 sm:p-5 md:p-6"
      aria-label="Listagem de contratos do Mercado do Café"
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Contratos do Mercado do Café
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Listagem global de contratos emitidos. Use os filtros para encontrar
            um contrato específico e abra a trilha de auditoria pelo botão da
            linha.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200 ring-1 ring-white/[0.05] transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </header>

      {/* Filtros — busca + status + limpar. Mobile empilha; ≥md em linha. */}
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px_auto]">
        <input
          type="text"
          placeholder="Buscar por ID, número (KVT-…) ou nome do produtor"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 [color-scheme:dark]"
        />
        <select
          value={filters.status ?? ""}
          onChange={(e) => {
            const v = e.target.value as "" | ContratoStatus;
            setFilters((prev) => ({
              ...prev,
              status: v === "" ? undefined : v,
              page: 1,
            }));
          }}
          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40 [color-scheme:dark]"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            setQDraft("");
            clear();
          }}
          disabled={!hasAnyFilter}
          className="h-10 rounded-lg border border-slate-700 bg-slate-900/40 px-3 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-50"
        >
          Limpar filtros
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          <p className="font-semibold">Não foi possível carregar a listagem.</p>
          <p className="mt-1 text-xs text-rose-300/80">{error}</p>
        </div>
      )}

      {loading && items.length === 0 && (
        <p className="rounded-lg bg-slate-800/60 px-4 py-6 text-center text-xs text-slate-400">
          Carregando contratos…
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="rounded-lg bg-slate-800/60 px-4 py-6 text-center text-xs text-slate-400">
          Nenhum contrato encontrado{hasAnyFilter ? " com os filtros aplicados" : ""}.
        </p>
      )}

      {items.length > 0 && (
        <>
          {/* Mobile: cards empilhados. ≥md: tabela. */}
          <ul className="space-y-2 md:hidden">
            {items.map((row) => (
              <ContratoCardMobile key={row.id} row={row} />
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full table-auto text-left text-xs">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                <tr className="border-b border-slate-800">
                  <th className="py-2 pl-2 pr-3 font-semibold">ID</th>
                  <th className="py-2 pr-3 font-semibold">Status</th>
                  <th className="py-2 pr-3 font-semibold">Tipo</th>
                  <th className="py-2 pr-3 font-semibold">Corretora</th>
                  <th className="py-2 pr-3 font-semibold">Lead</th>
                  <th className="py-2 pr-3 font-semibold">Criado</th>
                  <th className="py-2 pr-2 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <ContratoRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            meta={meta}
            loading={loading}
            onPage={(page) => setFilters((prev) => ({ ...prev, page }))}
          />
        </>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: ContratoStatus }) {
  const cls = STATUS_BADGE_CLASS[status] ?? STATUS_BADGE_CLASS.draft;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${cls}`}
    >
      {CONTRATO_STATUS_LABEL[status] ?? status}
    </span>
  );
}

function ContratoRow({ row }: { row: ContratoAdminListItem }) {
  return (
    <tr className="border-b border-slate-800/60 transition-colors hover:bg-slate-900/40">
      <td className="py-3 pl-2 pr-3 align-top">
        <div className="font-mono text-slate-200">#{row.id}</div>
        {row.numero_externo && (
          <div className="mt-0.5 font-mono text-[10px] text-slate-500">
            {row.numero_externo}
          </div>
        )}
      </td>
      <td className="py-3 pr-3 align-top">
        <StatusBadge status={row.status} />
      </td>
      <td className="py-3 pr-3 align-top text-slate-300">
        {CONTRATO_TIPO_LABEL[row.tipo] ?? row.tipo}
      </td>
      <td className="py-3 pr-3 align-top">
        <div className="text-slate-200">
          {row.corretora_name ?? <span className="text-slate-500">—</span>}
        </div>
        {row.corretora_slug && (
          <div className="mt-0.5 text-[10px] text-slate-500">
            /{row.corretora_slug}
          </div>
        )}
      </td>
      <td className="py-3 pr-3 align-top">
        <div className="max-w-[180px] truncate text-slate-200" title={row.lead_nome ?? undefined}>
          {row.lead_nome ?? <span className="text-slate-500">—</span>}
        </div>
        <div className="mt-0.5 text-[10px] text-slate-500">#{row.lead_id}</div>
      </td>
      <td className="py-3 pr-3 align-top text-slate-300 tabular-nums">
        {formatDatePtBR(row.created_at)}
      </td>
      <td className="py-3 pr-2 align-top text-right">
        <Link
          href={`/admin/mercado-do-cafe/contratos/${row.id}`}
          className="inline-flex items-center rounded-lg bg-emerald-600/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-emerald-500"
        >
          Ver auditoria →
        </Link>
      </td>
    </tr>
  );
}

function ContratoCardMobile({ row }: { row: ContratoAdminListItem }) {
  return (
    <li className="rounded-xl bg-slate-900/80 p-3 ring-1 ring-white/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge status={row.status} />
            <span className="font-mono text-[11px] text-slate-400">
              #{row.id}
            </span>
          </div>
          <div className="mt-1.5 text-sm font-medium text-slate-100">
            {CONTRATO_TIPO_LABEL[row.tipo] ?? row.tipo}
          </div>
          {row.numero_externo && (
            <div className="mt-0.5 font-mono text-[10px] text-slate-500">
              {row.numero_externo}
            </div>
          )}
        </div>
        <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
          {formatDatePtBR(row.created_at)}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
        <dt className="text-slate-500">Corretora</dt>
        <dd className="text-right text-slate-200 truncate" title={row.corretora_name ?? undefined}>
          {row.corretora_name ?? "—"}
        </dd>
        <dt className="text-slate-500">Lead</dt>
        <dd className="text-right text-slate-200 truncate" title={row.lead_nome ?? undefined}>
          {row.lead_nome ?? `#${row.lead_id}`}
        </dd>
      </dl>
      <Link
        href={`/admin/mercado-do-cafe/contratos/${row.id}`}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-emerald-500"
      >
        Ver auditoria →
      </Link>
    </li>
  );
}

function Pagination({
  meta,
  loading,
  onPage,
}: {
  meta: { page: number; total_pages: number; total: number };
  loading: boolean;
  onPage: (page: number) => void;
}) {
  if (meta.total_pages <= 1) return null;
  const prev = Math.max(1, meta.page - 1);
  const next = Math.min(meta.total_pages, meta.page + 1);
  return (
    <nav
      aria-label="Paginação da listagem de contratos"
      className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-400"
    >
      <span>
        Página{" "}
        <span className="font-mono text-slate-200">{meta.page}</span> de{" "}
        <span className="font-mono text-slate-200">{meta.total_pages}</span> ·{" "}
        <span className="font-mono text-slate-200">{meta.total}</span> contratos
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading || meta.page <= 1}
          onClick={() => onPage(prev)}
          className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-1.5 font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-40"
        >
          ← Anterior
        </button>
        <button
          type="button"
          disabled={loading || meta.page >= meta.total_pages}
          onClick={() => onPage(next)}
          className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-1.5 font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-100 disabled:opacity-40"
        >
          Próxima →
        </button>
      </div>
    </nav>
  );
}
