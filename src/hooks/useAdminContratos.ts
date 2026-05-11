// src/hooks/useAdminContratos.ts
//
// Listagem admin de contratos com filtros e paginação (Fase 10.10).
// Padrão usado em useCorretorasAdmin: hook controla state local de
// filtros + paginação, dispara fetch a cada mudança, expõe
// { items, meta, loading, error, filters, setFilters, reload }.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import apiClient from "@/lib/apiClient";
import { isApiError } from "@/lib/errors";
import type {
  AdminContratosFilters,
  AdminContratosListMeta,
  AdminContratosListResponse,
  ContratoAdminListItem,
} from "@/types/contrato";

type Props = {
  initial?: AdminContratosFilters;
  onUnauthorized?: () => void;
};

const DEFAULT_META: AdminContratosListMeta = {
  total: 0,
  page: 1,
  limit: 20,
  total_pages: 1,
};

// O apiClient retorna o `data` do envelope { ok, data }; backend usa
// response.ok(res, { items, meta }), então T aqui é o próprio shape.
// Hidratação defensiva para sobreviver a {data: {...}} se ele vier.
function pickList(raw: unknown): AdminContratosListResponse {
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.items) && r.meta) {
      return raw as AdminContratosListResponse;
    }
    if (r.data && typeof r.data === "object") {
      const inner = r.data as Record<string, unknown>;
      if (Array.isArray(inner.items) && inner.meta) {
        return inner as unknown as AdminContratosListResponse;
      }
    }
  }
  return { items: [], meta: DEFAULT_META };
}

function buildQuery(filters: AdminContratosFilters): string {
  const p = new URLSearchParams();
  if (filters.status) p.set("status", filters.status);
  if (filters.tipo) p.set("tipo", filters.tipo);
  if (filters.corretora_id) p.set("corretora_id", String(filters.corretora_id));
  if (filters.lead_id) p.set("lead_id", String(filters.lead_id));
  if (filters.q && filters.q.trim()) p.set("q", filters.q.trim());
  if (filters.date_from) p.set("date_from", filters.date_from);
  if (filters.date_to) p.set("date_to", filters.date_to);
  p.set("page", String(filters.page ?? 1));
  p.set("limit", String(filters.limit ?? 20));
  return p.toString();
}

export type UseAdminContratosResult = {
  items: ContratoAdminListItem[];
  meta: AdminContratosListMeta;
  loading: boolean;
  error: string | null;
  filters: AdminContratosFilters;
  setFilters: (
    next: AdminContratosFilters | ((prev: AdminContratosFilters) => AdminContratosFilters),
  ) => void;
  clear: () => void;
  reload: () => Promise<void>;
};

export function useAdminContratos({
  initial,
  onUnauthorized,
}: Props = {}): UseAdminContratosResult {
  const [filters, setFiltersState] = useState<AdminContratosFilters>(
    initial ?? { page: 1, limit: 20 },
  );
  const [items, setItems] = useState<ContratoAdminListItem[]>([]);
  const [meta, setMeta] = useState<AdminContratosListMeta>(DEFAULT_META);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Evita race condition: se o usuário muda o filtro rápido, mantemos
  // só o resultado da última chamada disparada.
  const seqRef = useRef(0);

  const load = useCallback(async () => {
    const my = ++seqRef.current;
    setLoading(true);
    setError(null);
    try {
      const qs = buildQuery(filters);
      const raw = await apiClient.get<AdminContratosListResponse>(
        `/api/admin/contratos?${qs}`,
      );
      if (my !== seqRef.current) return; // outra chamada já está em curso
      const { items: nextItems, meta: nextMeta } = pickList(raw);
      setItems(nextItems);
      setMeta(nextMeta);
    } catch (err) {
      if (my !== seqRef.current) return;
      if (isApiError(err) && (err.status === 401 || err.status === 403)) {
        onUnauthorized?.();
      }
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar contratos.",
      );
      setItems([]);
      setMeta(DEFAULT_META);
    } finally {
      if (my === seqRef.current) setLoading(false);
    }
  }, [filters, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  // setFilters: aceita objeto OU função (estilo setState do React).
  // Sempre resseta page=1 quando filtros mudam — exceto quando o
  // próprio caller já definiu page (caso da paginação).
  const setFilters = useCallback<
    UseAdminContratosResult["setFilters"]
  >((next) => {
    setFiltersState((prev) => {
      const computed = typeof next === "function" ? next(prev) : next;
      const sameKeys =
        prev.status === computed.status &&
        prev.tipo === computed.tipo &&
        prev.corretora_id === computed.corretora_id &&
        prev.lead_id === computed.lead_id &&
        prev.q === computed.q &&
        prev.date_from === computed.date_from &&
        prev.date_to === computed.date_to &&
        prev.limit === computed.limit;
      // Se só mudou page, preserve. Senão, reseta page=1 a menos que o
      // caller tenha mandado page explicitamente.
      if (sameKeys) return computed;
      return { ...computed, page: computed.page ?? 1 };
    });
  }, []);

  const clear = useCallback(() => {
    setFiltersState({ page: 1, limit: 20 });
  }, []);

  return useMemo(
    () => ({
      items,
      meta,
      loading,
      error,
      filters,
      setFilters,
      clear,
      reload: load,
    }),
    [items, meta, loading, error, filters, setFilters, clear, load],
  );
}
