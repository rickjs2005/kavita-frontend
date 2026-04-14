// src/hooks/useCorretoraReviewsAdmin.ts
"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import type { AdminCorretoraReview } from "@/types/review";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

type Props = {
  onUnauthorized?: () => void;
};

export function useCorretoraReviewsAdmin({ onUnauthorized }: Props = {}) {
  const [rows, setRows] = useState<AdminCorretoraReview[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("status", statusFilter);
      qs.set("limit", "50");

      const [listRes, countRes] = await Promise.allSettled([
        apiClient.get<AdminCorretoraReview[]>(
          `/api/admin/mercado-do-cafe/reviews?${qs.toString()}`,
        ),
        apiClient.get<{ total: number }>(
          `/api/admin/mercado-do-cafe/reviews/pending-count`,
        ),
      ]);

      for (const r of [listRes, countRes]) {
        if (
          r.status === "rejected" &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((r.reason as any)?.status === 401 ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (r.reason as any)?.status === 403)
        ) {
          onUnauthorized?.();
          return;
        }
      }

      if (listRes.status === "fulfilled") {
        setRows(Array.isArray(listRes.value) ? listRes.value : []);
      }
      if (countRes.status === "fulfilled") {
        setPendingCount(countRes.value?.total ?? 0);
      }
    } catch (err) {
      console.warn("Erro ao carregar reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const moderate = useCallback(
    async (
      id: number,
      action: "approve" | "reject",
      rejectionReason?: string,
    ) => {
      try {
        const payload: Record<string, unknown> = { action };
        if (action === "reject" && rejectionReason) {
          payload.rejection_reason = rejectionReason;
        }
        await apiClient.post(
          `/api/admin/mercado-do-cafe/reviews/${id}/moderate`,
          payload,
        );
        toast.success(
          action === "approve"
            ? "Avaliação aprovada e publicada."
            : "Avaliação rejeitada.",
        );
        await load();
      } catch (err) {
        toast.error(formatApiError(err, "Erro ao moderar.").message);
      }
    },
    [load],
  );

  return {
    rows,
    pendingCount,
    loading,
    statusFilter,
    setStatusFilter,
    moderate,
    reload: load,
  };
}
