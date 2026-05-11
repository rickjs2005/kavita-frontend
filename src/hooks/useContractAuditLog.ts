// src/hooks/useContractAuditLog.ts
//
// Busca a trilha de auditoria de um contrato no admin (Fase 10.5).
// Padrão de hooks de listagem admin já usado em useCorretorasAdmin.
"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { ApiError, isApiError } from "@/lib/errors";
import type { ContractAuditEvent } from "@/types/contrato";

type ListResponse = {
  items: ContractAuditEvent[];
};

// O apiClient pode devolver o payload completo `{ ok, data }` ou só o
// `data`, dependendo de como a rota foi montada. As rotas novas (Fase
// 10.5+) usam `response.ok(res, { items })`, então `apiClient.get<T>`
// recebe `{ items: [...] }`. Mantemos hidratação defensiva para
// sobreviver a futuros endpoints que retornem `{ data: { items } }`.
function pickItems(raw: unknown): ContractAuditEvent[] {
  if (!raw || typeof raw !== "object") return [];
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.items)) return r.items as ContractAuditEvent[];
  if (r.data && typeof r.data === "object") {
    const inner = (r.data as Record<string, unknown>).items;
    if (Array.isArray(inner)) return inner as ContractAuditEvent[];
  }
  return [];
}

export type UseContractAuditLogResult = {
  items: ContractAuditEvent[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

type Props = {
  contratoId: number | null;
  onUnauthorized?: () => void;
};

export function useContractAuditLog({
  contratoId,
  onUnauthorized,
}: Props): UseContractAuditLogResult {
  const [items, setItems] = useState<ContractAuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!contratoId || !Number.isInteger(contratoId) || contratoId <= 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const raw = await apiClient.get<ListResponse>(
        `/api/admin/contratos/${contratoId}/audit-log`,
      );
      setItems(pickItems(raw));
    } catch (err) {
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        onUnauthorized?.();
      }
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Erro ao carregar auditoria do contrato.",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [contratoId, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}
