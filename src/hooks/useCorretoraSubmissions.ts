// src/hooks/useCorretoraSubmissions.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import type { CorretoraSubmission } from "@/types/corretora";

type Props = {
  onUnauthorized?: () => void;
};

export function useCorretoraSubmissions({ onUnauthorized }: Props) {
  const [rows, setRows] = useState<CorretoraSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"pending" | "approved" | "rejected">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      params.set("limit", "50");

      const res = await apiClient.get<any>(`/api/admin/mercado-do-cafe/submissions?${params}`);
      setRows(Array.isArray(res?.data ?? res) ? (res?.data ?? res) : []);

      // Fetch pending count
      try {
        const countRes = await apiClient.get<any>(
          "/api/admin/mercado-do-cafe/submissions/pending-count"
        );
        setPendingCount(countRes?.count ?? 0);
      } catch {
        // non-critical
      }
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        onUnauthorized?.();
      }
      toast.error(e?.message || "Erro ao carregar solicitações.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = useCallback(
    async (id: number) => {
      try {
        await apiClient.post(`/api/admin/mercado-do-cafe/submissions/${id}/approve`);
        toast.success("Corretora aprovada e publicada.");
        await load();
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403))
          onUnauthorized?.();
        toast.error(e?.message || "Erro ao aprovar.");
      }
    },
    [load, onUnauthorized]
  );

  const reject = useCallback(
    async (id: number, reason: string) => {
      try {
        await apiClient.post(`/api/admin/mercado-do-cafe/submissions/${id}/reject`, {
          reason,
        });
        toast.success("Solicitação rejeitada.");
        await load();
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403))
          onUnauthorized?.();
        toast.error(e?.message || "Erro ao rejeitar.");
      }
    },
    [load, onUnauthorized]
  );

  // Bulk actions (Sprint 3). O backend processa sequencialmente e devolve
  // agregado { approved|rejected, failed, results }. Aqui só traduzimos
  // para toast e recarregamos a lista.
  type BulkResult = {
    approved?: number;
    rejected?: number;
    failed: number;
  };

  const bulkApprove = useCallback(
    async (ids: number[]) => {
      try {
        const res = await apiClient.post<BulkResult>(
          "/api/admin/mercado-do-cafe/submissions/bulk-approve",
          { ids },
        );
        const approved = res?.approved ?? 0;
        const failed = res?.failed ?? 0;
        if (failed > 0) {
          toast(
            `${approved} aprovada(s), ${failed} com erro. Veja os detalhes no log.`,
            { icon: "⚠️" },
          );
        } else {
          toast.success(`${approved} aprovada(s).`);
        }
        await load();
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403))
          onUnauthorized?.();
        toast.error(e?.message || "Erro ao aprovar em lote.");
      }
    },
    [load, onUnauthorized],
  );

  const bulkReject = useCallback(
    async (ids: number[], reason: string) => {
      try {
        const res = await apiClient.post<BulkResult>(
          "/api/admin/mercado-do-cafe/submissions/bulk-reject",
          { ids, reason },
        );
        const rejected = res?.rejected ?? 0;
        const failed = res?.failed ?? 0;
        if (failed > 0) {
          toast(
            `${rejected} rejeitada(s), ${failed} com erro.`,
            { icon: "⚠️" },
          );
        } else {
          toast.success(`${rejected} rejeitada(s).`);
        }
        await load();
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403))
          onUnauthorized?.();
        toast.error(e?.message || "Erro ao rejeitar em lote.");
      }
    },
    [load, onUnauthorized],
  );

  return {
    rows,
    loading,
    pendingCount,
    statusFilter,
    setStatusFilter,
    load,
    approve,
    reject,
    bulkApprove,
    bulkReject,
  };
}
