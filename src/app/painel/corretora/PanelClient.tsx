"use client";

// src/app/painel/corretora/PanelClient.tsx
//
// Dashboard da Sala Reservada — versão redesenhada com mais contraste,
// hierarquia e identidade. Composição:
//
//   1. HeroCommandCard — card dark com gradient + status de visibilidade
//      pública (centro de comando)
//   2. SetupPanel (condicional) — onboarding de 3 zonas quando a
//      corretora ainda não recebeu leads
//   3. StatsCards — hero card "Total" + 2×2 de secundários
//   4. Activity — leads recentes OU empty state educacional ("como
//      funciona quando chega um lead")

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { StatsCards } from "@/components/painel-corretora/StatsCards";
import { LeadsTable } from "@/components/painel-corretora/LeadsTable";
import { PanelCard } from "@/components/painel-corretora/PanelCard";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
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
  const corretoraSlug = user?.corretora_slug;
  const publicUrl = corretoraSlug
    ? `/mercado-do-cafe/corretoras/${corretoraSlug}`
    : "/mercado-do-cafe/corretoras";
  const showSetupPanel = !loading && summary.total === 0;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ============================================================
          1. HERO COMMAND CARD — dark premium centro de comando
         ============================================================ */}
      <section
        aria-label="Centro de comando"
        className="kavita-rise-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-stone-900 p-6 shadow-xl shadow-stone-900/20 ring-1 ring-stone-900/40 md:p-8"
      >
        {/* Top highlight */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"
        />

        {/* Atmospheric glows */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-500/[0.08] blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-orange-700/[0.07] blur-3xl"
        />

        {/* Large decorative brand mark */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-8 -bottom-12 text-stone-700/15"
        >
          <PanelBrandMark className="h-56 w-56" />
        </span>

        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          {/* LEFT — saudação + data + status */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
                Sala Reservada
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-50 md:text-4xl">
              Olá,{" "}
              <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>

            <p className="mt-1.5 text-sm text-stone-400 first-letter:uppercase">
              {todayLabel}
            </p>

            {/* Status pill de visibilidade pública */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-500/30">
                <span
                  aria-hidden
                  className="relative flex h-1.5 w-1.5"
                >
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Ativa
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 font-medium text-stone-300 ring-1 ring-white/10">
                <span aria-hidden>👁</span>
                Visível no Mercado do Café
              </span>
            </div>
          </div>

          {/* RIGHT — ações principais */}
          <div className="flex flex-col gap-2 sm:flex-row md:items-end md:self-end">
            <Link
              href="/painel/corretora/leads"
              className="group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 px-5 py-2.5 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-600/30 transition-colors hover:from-amber-300 hover:to-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
              />
              Abrir leads
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-stone-200 backdrop-blur-sm transition-colors hover:bg-white/[0.08] hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            >
              Página pública
              <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* ============================================================
          2. SETUP PANEL — onboarding para corretoras sem leads ainda
         ============================================================ */}
      {showSetupPanel && (
        <section
          className="kavita-rise-in"
          style={{ animationDelay: "120ms" }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/70 to-stone-50 p-5 ring-1 ring-amber-200/50 md:p-6">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-300/15 blur-3xl"
            />

            <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
              {/* LEFT — mensagem + checklist */}
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Primeiros passos
                </p>
                <h2 className="mt-1.5 text-lg font-semibold text-stone-900 md:text-xl">
                  Prepare sua sala para receber o primeiro lead
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  Sua corretora já está ativa e visível. Enquanto o primeiro contato não chega, garanta que seu perfil está completo.
                </p>

                {/* Checklist 3 passos */}
                <ul className="mt-4 space-y-2">
                  <li className="flex items-start gap-2.5 text-sm">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-500/30"
                    >
                      ✓
                    </span>
                    <span className="text-stone-700">
                      <strong className="font-semibold text-stone-900">Corretora cadastrada</strong> e publicada no Mercado do Café
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-700 ring-1 ring-amber-500/30"
                    >
                      2
                    </span>
                    <span className="text-stone-700">
                      Complete sua <strong className="font-semibold text-stone-900">descrição pública</strong> e canais de contato
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600"
                    >
                      3
                    </span>
                    <span className="text-stone-600">
                      Aguarde o primeiro lead chegar pela sua página pública
                    </span>
                  </li>
                </ul>
              </div>

              {/* RIGHT — CTA principal */}
              <div className="flex shrink-0 flex-col gap-2 md:items-end">
                <Link
                  href="/painel/corretora/perfil"
                  className="group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-600/20 transition-colors hover:from-amber-400 hover:to-amber-500"
                >
                  <span aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                  Completar perfil
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-200/80 bg-white px-4 py-2 text-xs font-semibold text-amber-800 shadow-sm transition-colors hover:bg-amber-50"
                >
                  Ver minha página
                  <span aria-hidden>↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          3. STATS CARDS — hero "Total" + 4 secundários
         ============================================================ */}
      <section aria-label="Resumo de leads">
        <StatsCards summary={summary} loading={loading} />
      </section>

      {/* ============================================================
          4. ACTIVITY — leads recentes ou empty state educacional
         ============================================================ */}
      <section
        className="kavita-rise-in"
        style={{ animationDelay: "420ms" }}
      >
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
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

        {/* Se não há leads, mostra empty state educacional (mais rico) */}
        {!loading && recent.length === 0 ? (
          <EducationalEmptyState publicUrl={publicUrl} />
        ) : (
          <LeadsTable
            leads={recent}
            onChanged={load}
            emptyMessage="Assim que um produtor entrar em contato pela sua página pública, o lead aparecerá aqui em tempo real."
          />
        )}
      </section>
    </div>
  );
}

// ===================================================================
// Educational Empty State — substitui o empty state simples da
// LeadsTable quando a corretora ainda não recebeu nenhum lead.
// Explica o fluxo de como um lead chega, reduzindo a sensação de
// "nada aqui" e virando onboarding informativo.
// ===================================================================
function EducationalEmptyState({ publicUrl }: { publicUrl: string }) {
  const steps = [
    {
      n: "01",
      title: "Produtor visita sua página",
      desc: "Sua corretora aparece listada no Mercado do Café, com perfil e canais de contato.",
    },
    {
      n: "02",
      title: "Deixa um contato ou mensagem",
      desc: "O produtor preenche o formulário da sua página ou usa seus canais diretos.",
    },
    {
      n: "03",
      title: "Lead chega aqui na sua sala",
      desc: "Você recebe o lead em tempo real, com status, mensagem e possibilidade de notas internas.",
    },
  ];

  return (
    <PanelCard density="spacious" className="relative overflow-hidden">
      {/* Warm subtle glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-amber-200/20 blur-3xl"
      />

      <div className="relative">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 ring-1 ring-amber-200/60">
            <PanelBrandMark className="h-9 w-9 text-amber-700" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-900 md:text-lg">
              Sua sala está pronta
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-stone-600">
              Os leads aparecerão aqui automaticamente. Veja como funciona o caminho até o primeiro contato chegar:
            </p>
          </div>
        </div>

        {/* Flow 3 steps */}
        <ol className="mt-7 grid gap-3 md:grid-cols-3 md:gap-4">
          {steps.map((step, i) => (
            <li
              key={step.n}
              className="relative rounded-xl bg-stone-50 p-4 ring-1 ring-stone-900/[0.05]"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                  {step.n}
                </span>
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="hidden h-px flex-1 bg-gradient-to-r from-amber-300/50 to-transparent md:block"
                  />
                )}
              </div>
              <p className="mt-2 text-sm font-semibold text-stone-900">
                {step.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>

        {/* CTA row */}
        <div className="mt-7 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-amber-600/20 transition-colors hover:from-amber-400 hover:to-amber-500"
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            Visitar minha página pública
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">↗</span>
          </a>
          <Link
            href="/painel/corretora/perfil"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-100"
          >
            Aprimorar perfil
          </Link>
        </div>
      </div>
    </PanelCard>
  );
}
