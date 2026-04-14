"use client";

// src/app/painel/corretora/PanelClient.tsx
//
// Dashboard da Sala Reservada — v2 com continuidade visual premium.
//
// Mudanças-chave em relação à v1:
//   - Editorial chapter numbers (01..04) em cada seção, como na
//     página pública do Mercado do Café
//   - Setup Panel mudou de amber pastel para dark committed (echo do
//     hero), criando segunda âncora premium
//   - Empty state da activity também virou dark, fechando a composição
//     dark→light→dark→light (ritmo)
//   - Hairline amber dividers entre blocos principais
//   - Secondary KPI cards com gradient e amber highlights

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { StatsCards } from "@/components/painel-corretora/StatsCards";
import { LeadsTable } from "@/components/painel-corretora/LeadsTable";
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

// ============================================================
// ChapterHeader — cabeçalho editorial de seção no estilo da
// página pública: número + kicker mono + título + hint opcional.
// ============================================================
function ChapterHeader({
  number,
  kicker,
  title,
  hint,
  action,
}: {
  number: string;
  kicker: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {/* Hairline amber no topo do bloco */}
      <span
        aria-hidden
        className="absolute inset-x-0 -top-1 h-px bg-gradient-to-r from-amber-300/40 via-stone-300/20 to-transparent"
      />
      <div className="flex items-end justify-between gap-4 pt-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-amber-700">
              {number}
            </span>
            <span aria-hidden className="h-px w-6 bg-amber-300/50" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
              {kicker}
            </span>
          </div>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-stone-900 md:text-xl">
            {title}
          </h2>
          {hint && (
            <p className="mt-0.5 text-xs text-stone-500">{hint}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
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
  const corretoraName = user?.corretora_name;
  const todayLabel = formatTodayPt();
  const corretoraSlug = user?.corretora_slug;
  const publicUrl = corretoraSlug
    ? `/mercado-do-cafe/corretoras/${corretoraSlug}`
    : "/mercado-do-cafe/corretoras";
  const showSetupPanel = !loading && summary.total === 0;

  return (
    <div className="space-y-8 md:space-y-10">
      {/* ============================================================
          01 — HERO COMMAND CARD
         ============================================================ */}
      <section
        aria-label="Centro de comando"
        className="kavita-rise-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-stone-900 p-7 shadow-2xl shadow-stone-900/30 ring-1 ring-stone-900/40 md:p-9"
      >
        {/* Top highlight amber */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"
        />

        {/* Atmospheric glows */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-amber-500/[0.1] blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-orange-700/[0.08] blur-3xl"
        />

        {/* Large decorative brand mark */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -bottom-16 text-stone-700/15"
        >
          <PanelBrandMark className="h-64 w-64" />
        </span>

        <div className="relative flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          {/* LEFT — editorial kicker + saudação + nameplate + status */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold tracking-[0.22em] text-amber-400/90">
                01
              </span>
              <span aria-hidden className="h-px w-8 bg-amber-300/40" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
                Sala Reservada
              </span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-tight text-stone-50 md:text-[2.75rem]">
              Olá,{" "}
              <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>

            {/* Corretora nameplate + date */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-400">
              {corretoraName && (
                <>
                  <span className="font-medium text-stone-200">
                    {corretoraName}
                  </span>
                  <span aria-hidden className="h-3 w-px bg-stone-600" />
                </>
              )}
              <span className="first-letter:uppercase">{todayLabel}</span>
            </div>

            {/* Status pills */}
            <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-semibold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-500/30">
                <span aria-hidden className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Ativa
              </span>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1 font-medium text-stone-300 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/[0.08] hover:text-amber-200"
              >
                <span aria-hidden>👁</span>
                <span>Visível no Mercado do Café</span>
                <span aria-hidden className="text-stone-500 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300">
                  ↗
                </span>
              </a>
            </div>
          </div>

          {/* RIGHT — ações principais */}
          <div className="flex flex-col gap-2 sm:flex-row md:items-end md:self-end">
            <Link
              href="/painel/corretora/leads"
              className="group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-500/30 transition-colors hover:from-amber-200 hover:to-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            >
              <span aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              Abrir leads
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/painel/corretora/perfil"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-stone-200 backdrop-blur-sm transition-colors hover:bg-white/[0.08] hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
            >
              Editar perfil
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          02 — SETUP / ATIVAÇÃO (dark, echo do hero)
         ============================================================ */}
      {showSetupPanel && (
        <section
          className="kavita-rise-in space-y-4"
          style={{ animationDelay: "120ms" }}
        >
          <ChapterHeader
            number="02"
            kicker="Ativação"
            title="Prepare sua sala para o primeiro lead"
            hint="Enquanto o primeiro contato não chega, garanta que seu perfil está completo."
          />

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-stone-900 p-6 shadow-xl shadow-stone-900/25 ring-1 ring-stone-900/40 md:p-7">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/[0.08] blur-3xl"
            />

            <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
              {/* Checklist */}
              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] font-bold text-emerald-300 ring-1 ring-emerald-500/40"
                  >
                    ✓
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-100">
                      Corretora cadastrada e publicada
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Você já aparece no Mercado do Café
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/50"
                  >
                    2
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-100">
                      Complete descrição e canais de contato
                    </p>
                    <p className="text-[11px] text-stone-400">
                      Perfis completos recebem mais contatos
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[10px] font-bold text-stone-400 ring-1 ring-white/15"
                  >
                    3
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-300">
                      Aguarde o primeiro lead
                    </p>
                    <p className="text-[11px] text-stone-500">
                      Ele chegará em tempo real nesta sala
                    </p>
                  </div>
                </li>
              </ol>

              {/* CTAs */}
              <div className="flex shrink-0 flex-col gap-2 md:items-end md:self-center">
                <Link
                  href="/painel/corretora/perfil"
                  className="group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-500/30 transition-colors hover:from-amber-200 hover:to-amber-400"
                >
                  <span aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                  Completar perfil
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </Link>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2 text-xs font-semibold text-stone-200 backdrop-blur-sm transition-colors hover:bg-white/[0.08] hover:text-amber-200"
                >
                  Ver página pública
                  <span aria-hidden>↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          03 — PIPELINE (stats)
         ============================================================ */}
      <section aria-label="Pipeline" className="space-y-4">
        <ChapterHeader
          number={showSetupPanel ? "03" : "02"}
          kicker="Pipeline"
          title="Resumo de leads"
          hint="Distribuição dos contatos recebidos pela sua página pública."
        />
        <StatsCards summary={summary} loading={loading} />
      </section>

      {/* ============================================================
          04 — ATIVIDADE RECENTE
         ============================================================ */}
      <section
        className="kavita-rise-in space-y-4"
        style={{ animationDelay: "420ms" }}
      >
        <ChapterHeader
          number={showSetupPanel ? "04" : "03"}
          kicker="Atividade"
          title="Últimos leads recebidos"
          action={
            <Link
              href="/painel/corretora/leads"
              className="text-xs font-semibold text-amber-700 underline-offset-4 hover:text-amber-800 hover:underline"
            >
              Ver todos →
            </Link>
          }
        />

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
          >
            {error}
          </div>
        )}

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
// Educational Empty State — dark committed, echoa o hero. Mostra o
// fluxo de como um lead chega em 3 steps. Fecha a composição da
// página com mais uma âncora premium (antes o último bloco era um
// card branco, agora é um painel dark com a mesma linguagem do hero).
// ===================================================================
function EducationalEmptyState({ publicUrl }: { publicUrl: string }) {
  const steps = [
    {
      n: "01",
      title: "Produtor visita sua página",
      desc: "Sua corretora aparece no Mercado do Café com perfil e canais de contato.",
    },
    {
      n: "02",
      title: "Deixa contato ou mensagem",
      desc: "Preenche o formulário da sua página ou usa seus canais diretos.",
    },
    {
      n: "03",
      title: "Lead chega nesta sala",
      desc: "Em tempo real, com status, mensagem e campo para notas internas.",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-stone-900 p-7 shadow-xl shadow-stone-900/25 ring-1 ring-stone-900/40 md:p-9">
      {/* Top highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"
      />

      {/* Glows */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-500/[0.08] blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-orange-700/[0.07] blur-3xl"
      />

      <div className="relative">
        {/* Header centered */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 text-amber-300 ring-1 ring-amber-400/30">
            <PanelBrandMark className="h-9 w-9" />
          </div>
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-stone-50 md:text-xl">
              Sua sala está pronta
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-400">
              Leads aparecerão aqui em tempo real. Veja o caminho até o primeiro contato chegar.
            </p>
          </div>
        </div>

        {/* Flow 3 steps */}
        <ol className="relative mt-8 grid gap-3 md:grid-cols-3 md:gap-4">
          {steps.map((step) => (
            <li
              key={step.n}
              className="relative overflow-hidden rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/[0.06]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/20 to-transparent"
              />
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-amber-400">
                  {step.n}
                </span>
                <span aria-hidden className="h-px flex-1 bg-amber-300/20" />
              </div>
              <p className="mt-2 text-sm font-semibold text-stone-100">
                {step.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-5 py-2.5 text-xs font-semibold text-stone-950 shadow-lg shadow-amber-500/30 transition-colors hover:from-amber-200 hover:to-amber-400"
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            Visitar minha página pública
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">↗</span>
          </a>
          <Link
            href="/painel/corretora/perfil"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-stone-200 backdrop-blur-sm transition-colors hover:bg-white/[0.08] hover:text-amber-200"
          >
            Aprimorar perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
