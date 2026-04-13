"use client";

// src/app/painel/corretora/PanelClient.tsx
//
// Dashboard da Sala Reservada. Três zonas de cima para baixo:
//   1. Hero row — kicker + saudação + contexto (data) + CTA secundário
//   2. KPI grid — 5 cards monocromáticos com hierarquia
//   3. Recent leads — título + link "ver todos" + tabela

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

function formatTodayPt() {
  try {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

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
        apiClient.get<{ items: CorretoraLead[] }>(
          "/api/corretora/leads?limit=5",
        ),
      ]);
      setSummary(summaryData);
      setRecent(leadsRes.items ?? []);
    } catch (err) {
      setError(formatApiError(err, "Erro ao carregar painel.").message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = user?.nome?.split(" ")[0] ?? "bem-vinda";
  const todayLabel = formatTodayPt();

  return (
    <div className="space-y-8 md:space-y-10">
      {/* HERO */}
      <section className="kavita-rise-in flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700">
            Painel
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
            Olá, {firstName}
          </h1>
          <p className="mt-1 text-sm text-stone-500 first-letter:uppercase">
            {todayLabel}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/painel/corretora/leads"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition-colors hover:from-amber-400 hover:to-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50"
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            Abrir leads
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/painel/corretora/perfil"
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-sm shadow-stone-900/[0.03] transition-colors hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50"
          >
            Editar perfil
          </Link>
        </div>
      </section>

      {/* WELCOME BANNER — only when all KPIs are zero */}
      {!loading && summary.total === 0 && (
        <section className="kavita-rise-in" style={{ animationDelay: "100ms" }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/60 to-stone-50 p-5 ring-1 ring-amber-200/40 md:p-6">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl"
            />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700/80">
                  Bem-vinda ao seu painel
                </p>
                <h2 className="mt-1 text-base font-semibold text-stone-900">
                  Sua corretora já está visível no Mercado do Café
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  Leads chegarão assim que produtores entrarem em contato pela sua página pública. Enquanto isso, aproveite para completar seu perfil.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href="/mercado-do-cafe/corretoras"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition-colors hover:from-amber-400 hover:to-amber-500"
                >
                  Ver página pública
                  <span aria-hidden>↗</span>
                </a>
                <Link
                  href="/painel/corretora/perfil"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3.5 py-2 text-xs font-semibold text-amber-800 shadow-sm transition-colors hover:bg-amber-50"
                >
                  Completar perfil
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* KPI GRID */}
      <section aria-label="Resumo de leads">
        <StatsCards summary={summary} loading={loading} />
      </section>

      {/* RECENT LEADS */}
      <section
        className="kavita-rise-in"
        style={{ animationDelay: "420ms" }}
      >
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
              Atividade recente
            </p>
            <h2 className="mt-1 text-lg font-semibold text-stone-900">
              Últimos leads recebidos
            </h2>
          </div>
          <Link
            href="/painel/corretora/leads"
            className="text-xs font-semibold text-amber-700 underline-offset-4 hover:text-amber-800 hover:underline"
          >
            Ver todos →
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
          >
            {error}
          </div>
        )}

        <LeadsTable
          leads={recent}
          onChanged={load}
          emptyMessage="Assim que um produtor entrar em contato pela sua página pública, o lead aparecerá aqui em tempo real."
        />
      </section>
    </div>
  );
}
