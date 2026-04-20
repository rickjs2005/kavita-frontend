// src/hooks/useLeadContratos.ts
//
// Hook que encapsula a listagem de contratos de um lead para a
// corretora. Usa apiClient (CSRF + cookie incluídos automaticamente).

"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { Contrato } from "@/types/contrato";

type ListResponse = { items: Contrato[] };

export function useLeadContratos(leadId: number) {
  const [items, setItems] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ListResponse>(
        `/api/corretora/contratos?lead_id=${leadId}`,
      );
      setItems(res?.items ?? []);
    } catch (err) {
      setError((err as Error)?.message ?? "Erro ao listar contratos.");
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { items, loading, error, refetch };
}
