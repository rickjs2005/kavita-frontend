// src/hooks/useMyKycStatus.ts
//
// Status KYC da corretora autenticada — usado pelo painel para
// decidir se libera "Gerar contrato" e se mostra banner.

"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

export type KycStatus =
  | "pending_verification"
  | "under_review"
  | "verified"
  | "rejected";

export type MyKycStatusResponse = {
  kyc_status: KycStatus;
  kyc_verified_at: string | null;
  cnpj: string | null;
  razao_social: string | null;
  rejected_reason: string | null;
  can_emit_contracts: boolean;
};

export function useMyKycStatus() {
  const [data, setData] = useState<MyKycStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<MyKycStatusResponse>(
        "/api/corretora/kyc",
      );
      setData(res);
    } catch (err) {
      setError((err as Error)?.message ?? "Erro ao carregar KYC.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
