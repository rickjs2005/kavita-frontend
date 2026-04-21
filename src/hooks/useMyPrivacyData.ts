// src/hooks/useMyPrivacyData.ts
//
// Hook que carrega /api/produtor/privacidade/meus-dados.
"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import type { MyPrivacyData } from "@/types/privacy";

export function useMyPrivacyData() {
  const [data, setData] = useState<MyPrivacyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<MyPrivacyData>(
        "/api/produtor/privacidade/meus-dados",
      );
      setData(res);
    } catch (err) {
      setError((err as Error)?.message ?? "Erro ao carregar seus dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
