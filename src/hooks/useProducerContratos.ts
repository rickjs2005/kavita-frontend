// src/hooks/useProducerContratos.ts
//
// Hook do painel do produtor — lista contratos em que ele é
// signatário. Backend escopa por email da sessão.

"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { ProducerContrato } from "@/types/contrato";

type ListResponse = { items: ProducerContrato[] };

export function useProducerContratos() {
  const [items, setItems] = useState<ProducerContrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ListResponse>(
        "/api/produtor/contratos",
      );
      setItems(res?.items ?? []);
    } catch (err) {
      setError((err as Error)?.message ?? "Erro ao listar contratos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { items, loading, error, refetch };
}
