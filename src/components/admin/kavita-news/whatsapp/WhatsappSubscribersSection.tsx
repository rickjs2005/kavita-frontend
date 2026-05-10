"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  listWhatsappSubscribers,
  updateWhatsappSubscriberStatus,
  type WhatsappSubscriberRow,
  type WhatsappSubscriberStatus,
} from "@/utils/kavita-news/whatsappSubscribers";

import WhatsappSubscribersTable from "./WhatsappSubscribersTable";

const PAGE_SIZE = 25;

const STATUS_FILTERS: {
  key: WhatsappSubscriberStatus | "all";
  label: string;
}[] = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendentes" },
  { key: "active", label: "Ativos" },
  { key: "unsubscribed", label: "Desinscritos" },
];

export default function WhatsappSubscribersSection() {
  const [statusFilter, setStatusFilter] = useState<
    WhatsappSubscriberStatus | "all"
  >("all");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<WhatsappSubscriberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await listWhatsappSubscribers({
        page,
        pageSize: PAGE_SIZE,
        status: statusFilter,
      });
      setItems(res.rows);
      setTotal(res.total);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro inesperado ao buscar a lista.";
      setLoadError(msg);
      setItems([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Quando o filtro muda, voltamos pra pagina 1.
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleChangeStatus = useCallback(
    async (
      row: WhatsappSubscriberRow,
      next: WhatsappSubscriberStatus,
    ) => {
      if (row.status === next || pendingId === row.id) return;

      // Optimistic UI: atualiza local antes da resposta. Em erro, rollback.
      const previousStatus = row.status;
      setItems((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)),
      );
      setPendingId(row.id);

      try {
        const updated = await updateWhatsappSubscriberStatus(row.id, next);
        // Reaplica payload do backend (pega timestamps frescos).
        setItems((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
        toast.success(
          next === "active"
            ? "Aprovado — agora está no canal."
            : next === "pending"
              ? "Voltou pra pendente."
              : "Desinscrito com sucesso.",
        );
      } catch (err) {
        // Rollback do optimistic update.
        setItems((prev) =>
          prev.map((r) =>
            r.id === row.id ? { ...r, status: previousStatus } : r,
          ),
        );
        const msg =
          err instanceof Error
            ? err.message
            : "Não foi possível atualizar o status.";
        toast.error(msg);
      } finally {
        setPendingId(null);
      }
    },
    [pendingId],
  );

  return (
    <div className="space-y-4">
      {/* Header da secao */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-50">
            Lista de interesse — Canal WhatsApp
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            O canal de disparo em massa ainda não está ativo. Aprove manualmente
            os números que enviarem a mensagem de opt-in pelo WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400">
            {total} {total === 1 ? "cadastro" : "cadastros"}
          </span>
          <button
            type="button"
            onClick={reload}
            disabled={isLoading}
            className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div
        role="tablist"
        aria-label="Filtrar por status"
        className="flex flex-wrap gap-2"
      >
        {STATUS_FILTERS.map((f) => {
          const isActive = f.key === statusFilter;
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                  : "border-slate-800 bg-slate-950/40 text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Erro de load (acima da tabela) */}
      {loadError && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <p className="font-semibold">Erro ao carregar a lista</p>
          <p className="mt-0.5 text-xs text-rose-300/80">{loadError}</p>
        </div>
      )}

      {/* Tabela */}
      <WhatsappSubscribersTable
        items={items}
        isLoading={isLoading}
        pendingId={pendingId}
        onChangeStatus={handleChangeStatus}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
