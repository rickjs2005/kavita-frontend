// src/hooks/useCorretorasAdmin.ts
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import type { CorretoraAdmin } from "@/types/corretora";

type Props = {
  onUnauthorized?: () => void;
};

export function useCorretorasAdmin({ onUnauthorized }: Props) {
  const [rows, setRows] = useState<CorretoraAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    status: "" as "" | "active" | "inactive",
    city: "",
    search: "",
    page: 1,
    includeArchived: false, // Sprint 4: mostra soft-deleted (deleted_at NOT NULL) quando true
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.city) params.set("city", filters.city);
      if (filters.search) params.set("search", filters.search);
      if (filters.includeArchived) params.set("include_archived", "1");
      params.set("page", String(filters.page));
      params.set("limit", "20");

      const res = await apiClient.get<any>(`/api/admin/mercado-do-cafe?${params}`);
      setRows(Array.isArray(res?.data ?? res) ? (res?.data ?? res) : []);
      setTotal(res?.meta?.total ?? 0);
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        onUnauthorized?.();
      }
      toast.error(e?.message || "Erro ao carregar corretoras.");
    } finally {
      setLoading(false);
    }
  }, [filters, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      if (Number(a.is_featured) !== Number(b.is_featured))
        return Number(b.is_featured) - Number(a.is_featured);
      return a.name.localeCompare(b.name);
    });
  }, [rows]);

  const toggleStatus = useCallback(
    async (id: number, status: "active" | "inactive") => {
      try {
        await apiClient.patch(`/api/admin/mercado-do-cafe/corretoras/${id}/status`, {
          status,
        });
        toast.success(status === "active" ? "Corretora ativada." : "Corretora inativada.");
        await load();
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403))
          onUnauthorized?.();
        toast.error(e?.message || "Erro ao atualizar status.");
      }
    },
    [load, onUnauthorized]
  );

  const toggleFeatured = useCallback(
    async (id: number, featured: boolean) => {
      try {
        await apiClient.patch(`/api/admin/mercado-do-cafe/corretoras/${id}/featured`, {
          is_featured: featured,
        });
        toast.success(featured ? "Corretora destacada." : "Destaque removido.");
        await load();
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403))
          onUnauthorized?.();
        toast.error(e?.message || "Erro ao atualizar destaque.");
      }
    },
    [load, onUnauthorized]
  );

  /**
   * Envia (ou reenvia) o convite de primeiro acesso para uma corretora.
   * Usado pelo modal "Criar acesso" da tabela admin. Idempotente no
   * backend: mesma chamada cobre criação e reenvio.
   *
   * Retorna true em caso de sucesso para o modal poder fechar.
   * Lança o ApiError original em caso de erro (inclusive 409 de
   * "corretora já tem conta ativa"), para o modal tratar a mensagem.
   */
  const inviteUser = useCallback(
    async (
      id: number,
      payload: { nome: string; email: string },
    ): Promise<{ ok: true; resent: boolean } | never> => {
      try {
        const res = await apiClient.post<{ resent?: boolean }>(
          `/api/admin/mercado-do-cafe/corretoras/${id}/users/invite`,
          payload,
        );
        const resent = Boolean(res?.resent);
        toast.success(
          resent
            ? "Convite reenviado. A corretora receberá um novo e-mail."
            : "Convite enviado. A corretora receberá um e-mail com o link.",
        );
        return { ok: true, resent };
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          onUnauthorized?.();
        }
        // Não damos toast aqui — o modal mostra o erro inline para
        // que o admin possa corrigir nome/email sem perder contexto.
        throw e;
      }
    },
    [onUnauthorized],
  );

  // Arquivar/Restaurar (Sprint 4 — soft delete). Padrão consistente
  // com toggleStatus/toggleFeatured: POSTa, toast, recarrega lista.
  const archive = useCallback(
    async (id: number) => {
      try {
        await apiClient.post(
          `/api/admin/mercado-do-cafe/corretoras/${id}/archive`,
        );
        toast.success("Corretora arquivada.");
        await load();
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403))
          onUnauthorized?.();
        toast.error(e?.message || "Erro ao arquivar.");
      }
    },
    [load, onUnauthorized],
  );

  const restore = useCallback(
    async (id: number) => {
      try {
        await apiClient.post(
          `/api/admin/mercado-do-cafe/corretoras/${id}/restore`,
        );
        toast.success("Corretora restaurada.");
        await load();
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403))
          onUnauthorized?.();
        toast.error(e?.message || "Erro ao restaurar.");
      }
    },
    [load, onUnauthorized],
  );

  return {
    rows: sorted,
    loading,
    total,
    filters,
    setFilters,
    load,
    toggleStatus,
    toggleFeatured,
    inviteUser,
    archive,
    restore,
  };
}
