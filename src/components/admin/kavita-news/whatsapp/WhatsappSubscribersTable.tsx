"use client";

import React from "react";
import type {
  WhatsappSubscriberRow,
  WhatsappSubscriberStatus,
} from "@/utils/kavita-news/whatsappSubscribers";

type Props = {
  items: WhatsappSubscriberRow[];
  isLoading: boolean;
  /** id que está sofrendo PATCH agora — desabilita os botoes pra evitar duplo clique. */
  pendingId: number | null;

  onChangeStatus: (
    row: WhatsappSubscriberRow,
    next: WhatsappSubscriberStatus,
  ) => void;

  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

/* =========================
 * Helpers de apresentacao
 * ========================= */

function formatPhone(raw: string): string {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function relativeTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `há ${diffD}d`;
  return formatDateTime(value);
}

const STATUS_CHIP: Record<
  WhatsappSubscriberStatus,
  { label: string; cls: string; dot: string }
> = {
  pending: {
    label: "Pendente",
    cls: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  active: {
    label: "Ativo",
    cls: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  unsubscribed: {
    label: "Desinscrito",
    cls: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
};

function StatusChip({ status }: { status: WhatsappSubscriberStatus }) {
  const s = STATUS_CHIP[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${s.cls}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function SourceChip({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      {source || "—"}
    </span>
  );
}

/* =========================
 * Acoes por linha
 * ========================= */

function RowActions({
  row,
  pending,
  onChangeStatus,
}: {
  row: WhatsappSubscriberRow;
  pending: boolean;
  onChangeStatus: Props["onChangeStatus"];
}) {
  // Quais transicoes fazem sentido a partir do status atual.
  const buttons: { label: string; next: WhatsappSubscriberStatus; cls: string }[] = [];

  if (row.status !== "active") {
    buttons.push({
      label: "Aprovar",
      next: "active",
      cls: "bg-emerald-600 text-white hover:bg-emerald-700",
    });
  }
  if (row.status !== "pending") {
    buttons.push({
      label: "Voltar pra pendente",
      next: "pending",
      cls: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    });
  }
  if (row.status !== "unsubscribed") {
    buttons.push({
      label: "Desinscrever",
      next: "unsubscribed",
      cls: "bg-white text-rose-600 border border-rose-300 hover:bg-rose-50",
    });
  }

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {buttons.map((b) => (
        <button
          key={b.next}
          type="button"
          disabled={pending}
          onClick={() => onChangeStatus(row, b.next)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${b.cls}`}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

/* =========================
 * Skeleton
 * ========================= */

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 w-full max-w-[160px] rounded bg-slate-200" />
        </td>
      ))}
    </tr>
  );
}

/* =========================
 * Tabela
 * ========================= */

export default function WhatsappSubscribersTable({
  items,
  isLoading,
  pendingId,
  onChangeStatus,
  page,
  totalPages,
  onPageChange,
}: Props) {
  const showEmpty = !isLoading && items.length === 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      {/* Tabela desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Cadastrado</th>
              <th className="px-4 py-3">Confirmado</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {showEmpty && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  Nenhum cadastro encontrado para esse filtro.
                </td>
              </tr>
            )}

            {!isLoading &&
              items.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-sm text-slate-900">
                    {formatPhone(row.phone)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    <SourceChip source={row.source} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div>{relativeTime(row.criado_em)}</div>
                    <div className="text-[11px] text-slate-400">
                      {formatDateTime(row.criado_em)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDateTime(row.confirmed_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RowActions
                      row={row}
                      pending={pendingId === row.id}
                      onChangeStatus={onChangeStatus}
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Cards mobile */}
      <div className="md:hidden divide-y divide-slate-100">
        {isLoading && (
          <div className="space-y-3 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        )}

        {showEmpty && (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            Nenhum cadastro encontrado.
          </div>
        )}

        {!isLoading &&
          items.map((row) => (
            <article key={row.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {formatPhone(row.phone)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <StatusChip status={row.status} />
                    <SourceChip source={row.source} />
                  </div>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <dt className="text-slate-500">Cadastrado</dt>
                  <dd className="font-medium text-slate-700">
                    {relativeTime(row.criado_em)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Confirmado</dt>
                  <dd className="font-medium text-slate-700">
                    {formatDateTime(row.confirmed_at)}
                  </dd>
                </div>
              </dl>

              <div className="mt-3">
                <RowActions
                  row={row}
                  pending={pendingId === row.id}
                  onChangeStatus={onChangeStatus}
                />
              </div>
            </article>
          ))}
      </div>

      {/* Paginacao */}
      {totalPages > 1 && (
        <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page <= 1 || isLoading}
              onClick={() => onPageChange(page - 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages || isLoading}
              onClick={() => onPageChange(page + 1)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </footer>
      )}
    </section>
  );
}
