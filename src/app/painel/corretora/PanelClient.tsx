"use client";

// src/app/painel/corretora/PanelClient.tsx

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { StatsCards } from "@/components/painel-corretora/StatsCards";
import { LeadsTable } from "@/components/painel-corretora/LeadsTable";
import { useCorretoraAuth } from "@/context/CorretoraAuthContext";
import type { CorretoraLead, LeadsSummary } from "@/types/lead";

const EMPTY_SUMMARY: LeadsSummary = {
  total: 0,
  new: 0,
  contacted: 0,
  closed: 0,
  lost: 0,
};

export default function PanelClient() {
  const { user } = useCorretoraAuth();
  const [summary, setSummary] = useState<LeadsSummary>(EMPTY_SUMMARY);
  const [recent, setRecent] = useState<CorretoraLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, leadsRes] = await Promise.all([
        apiClient.get<LeadsSummary>("/api/corretora/leads/summary"),
        apiClient.get<{ data: CorretoraLead[] }>(
          "/api/corretora/leads?limit=5",
        ),
      ]);
      setSummary(summaryData);
      // apiClient já retorna o envelope parseado; extraímos data de forma defensiva
      const list = Array.isArray(leadsRes)
        ? (leadsRes as unknown as CorretoraLead[])
        : ((leadsRes as { data?: CorretoraLead[] }).data ?? []);
      setRecent(list);
    } catch (err) {
      setError(formatApiError(err, "Erro ao carregar painel.").message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold text-zinc-900">
          Olá, {user?.nome?.split(" ")[0] ?? "bem-vinda"} 👋
        </h2>
        <p className="text-sm text-zinc-500">
          Resumo da sua atividade no Mercado do Café.
        </p>
      </section>

      <StatsCards summary={summary} loading={loading} />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-900">
            Últimos leads recebidos
          </h3>
          <Link
            href="/painel/corretora/leads"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        <LeadsTable
          leads={recent}
          onChanged={load}
          emptyMessage="Ainda não há leads. Assim que um produtor entrar em contato, ele aparecerá aqui."
        />
      </section>
    </div>
  );
}
