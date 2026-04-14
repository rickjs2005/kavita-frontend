// src/hooks/useRegionalStats.ts
//
// Hook que consome os endpoints de stats regionais do admin
// (Sprint 3). Carrega tudo em paralelo ao montar; refresh manual
// disponível.

"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

export type RegionalKpis = {
  corretoras_ativas: number;
  cidades_cobertas: number;
  leads_periodo: number;
  leads_alta_prioridade: number;
  leads_fechados: number;
  sla_medio_segundos: number | null;
  submissions_pendentes: number;
  days_back: number;
};

export type LeadsPorCidadeRow = {
  cidade: string;
  total: number;
  alta_prioridade: number;
  fechados: number;
  sla_medio_segundos: number | null;
};

export type CorretoraPerfRow = {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  is_featured: boolean;
  status: "active" | "inactive";
  leads_total: number;
  leads_fechados: number;
  leads_novos: number;
  leads_alta_prioridade: number;
  sla_medio_segundos: number | null;
  taxa_conversao_pct: number | null;
  ultimo_lead_em: string | null;
};

export type LeadPenduradoRow = {
  id: number;
  nome: string;
  cidade: string | null;
  volume_range: string | null;
  created_at: string;
  horas_sem_resposta: number;
  corretora: {
    id: number;
    name: string;
    slug: string;
    city: string;
  };
};

// Sprint 7 — Córregos ativos
export type CorregoAtivoRow = {
  corrego: string;
  total: number;
  alta_prioridade: number;
  corretoras_atingidas: number;
  ultimo_lead: string | null;
};

export type CorregosAtivosResponse = {
  days_back: number;
  items: CorregoAtivoRow[];
};

type Props = {
  onUnauthorized?: () => void;
  daysBack?: number;
};

export function useRegionalStats({ onUnauthorized, daysBack = 30 }: Props = {}) {
  const [kpis, setKpis] = useState<RegionalKpis | null>(null);
  const [leadsPorCidade, setLeadsPorCidade] = useState<LeadsPorCidadeRow[]>([]);
  const [corretorasPerf, setCorretorasPerf] = useState<CorretoraPerfRow[]>([]);
  const [leadsPendurados, setLeadsPendurados] = useState<LeadPenduradoRow[]>([]);
  const [corregosAtivos, setCorregosAtivos] = useState<CorregoAtivoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = `?days=${daysBack}`;
      const [kpisRes, porCidadeRes, perfRes, penduradosRes, corregosRes] =
        await Promise.allSettled([
          apiClient.get<RegionalKpis>(
            `/api/admin/mercado-do-cafe/stats/regional${qs}`,
          ),
          apiClient.get<LeadsPorCidadeRow[]>(
            `/api/admin/mercado-do-cafe/stats/leads-por-cidade${qs}&limit=20`,
          ),
          apiClient.get<CorretoraPerfRow[]>(
            `/api/admin/mercado-do-cafe/stats/corretoras-performance${qs}&limit=100`,
          ),
          apiClient.get<LeadPenduradoRow[]>(
            `/api/admin/mercado-do-cafe/stats/leads-pendurados?hours=24&limit=50`,
          ),
          apiClient.get<CorregosAtivosResponse>(
            `/api/admin/mercado-do-cafe/stats/corregos-ativos?days=7&limit=5`,
          ),
        ]);

      // Unauthorized — redireciona se qualquer endpoint falhar com 401/403
      for (const r of [kpisRes, porCidadeRes, perfRes, penduradosRes, corregosRes]) {
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

      if (kpisRes.status === "fulfilled") setKpis(kpisRes.value);
      if (porCidadeRes.status === "fulfilled")
        setLeadsPorCidade(porCidadeRes.value);
      if (perfRes.status === "fulfilled") setCorretorasPerf(perfRes.value);
      if (penduradosRes.status === "fulfilled")
        setLeadsPendurados(penduradosRes.value);
      if (corregosRes.status === "fulfilled")
        setCorregosAtivos(corregosRes.value?.items ?? []);

      const allFailed =
        kpisRes.status === "rejected" &&
        porCidadeRes.status === "rejected" &&
        perfRes.status === "rejected" &&
        penduradosRes.status === "rejected" &&
        corregosRes.status === "rejected";
      if (allFailed) {
        setError("Não foi possível carregar as estatísticas regionais.");
      }
    } catch (err) {
      console.warn("Erro ao carregar stats regionais:", err);
      setError("Erro ao carregar estatísticas regionais.");
    } finally {
      setLoading(false);
    }
  }, [daysBack, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    kpis,
    leadsPorCidade,
    corretorasPerf,
    leadsPendurados,
    corregosAtivos,
    loading,
    error,
    reload: load,
  };
}
