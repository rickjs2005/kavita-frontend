"use client";

// src/app/painel/corretora/PanelClient.tsx
//
// Dashboard da Sala Reservada — v3 com identidade café editorial.
//
// Mudanças estruturais em relação à v2:
//   - MarketStrip no topo (editorial masthead: data + safra + região)
//   - Serif italic no primeiro nome (accent premium editorial)
//   - BeanScatter decorativo em TODAS as superfícies dark (hero, setup,
//     empty state, stats hero card) — traz textura café sutil
//   - OrnamentalDivider entre capítulos (grão + hairline amber)
//   - Sidebar de meta-info no hero (logo mark + número da sala)
//   - Composição assimétrica (não mais grid retangular perfeito)

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { StatsCards } from "@/components/painel-corretora/StatsCards";
import { LeadsTable } from "@/components/painel-corretora/LeadsTable";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";
import {
  BeanScatter,
  OrnamentalDivider,
  MarketStrip,
  MarketStripItem,
  MarketStripDivider,
} from "@/components/painel-corretora/PanelOrnaments";
import { useCorretoraAuth } from "@/context/CorretoraAuthContext";
import type { CorretoraLead, LeadsSummary } from "@/types/lead";

const EMPTY_SUMMARY: LeadsSummary = {
  total: 0,
  new: 0,
  contacted: 0,
  closed: 0,
  lost: 0,
};

function formatTodayShort() {
  try {
    return new Date()
      .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
      .replace(".", "")
      .toUpperCase();
  } catch {
    return "";
  }
}

function formatTodayFull() {
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

function currentSafra() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  // Safra de café vai de maio a abril. Antes de maio, ainda é a safra anterior.
  if (month < 5) return `SAFRA ${year - 1}/${String(year).slice(2)}`;
  return `SAFRA ${year}/${String(year + 1).slice(2)}`;
}

// ============================================================
// ChapterHeader — cabeçalho editorial com número romano-like,
// kicker mono, título e hint opcional.
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
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-700/10 font-mono text-[10px] font-bold text-amber-800 ring-1 ring-amber-700/20">
            {number}
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
            {kicker}
          </span>
        </div>
        <h2 className="mt-2 font-serif text-xl font-semibold tracking-tight text-stone-900 md:text-2xl">
          {title}
        </h2>
        {hint && (
          <p className="mt-0.5 text-xs text-stone-500">{hint}</p>
        )}
      </div>
      {action}
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
  const corretoraSlug = user?.corretora_slug;
  const publicUrl = corretoraSlug
    ? `/mercado-do-cafe/corretoras/${corretoraSlug}`
    : "/mercado-do-cafe/corretoras";
  const showSetupPanel = !loading && summary.total === 0;
  const todayShort = formatTodayShort();
  const todayFull = formatTodayFull();
  const safra = currentSafra();

  return (
    <div className="space-y-7 md:space-y-9">
      {/* ============================================================
          MARKET STRIP — masthead editorial
         ============================================================ */}
      <MarketStrip>
        <MarketStripItem pulse>{todayShort}</MarketStripItem>
        <MarketStripDivider />
        <MarketStripItem accent>{safra}</MarketStripItem>
        <MarketStripDivider />
        <MarketStripItem>Mercado do Café</MarketStripItem>
        <MarketStripDivider />
        <MarketStripItem>Sala Reservada · Kavita</MarketStripItem>
      </MarketStrip>

      {/* ============================================================
          01 — HERO COMMAND CARD (dark com bean scatter)
         ============================================================ */}
      <section
        aria-label="Centro de comando"
        className="kavita-rise-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-[#1f1914] to-stone-900 p-7 shadow-2xl shadow-stone-900/40 ring-1 ring-amber-900/20 md:p-10"
      >
        {/* Top highlight amber */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/70 to-transparent"
        />

        {/* Atmospheric glows */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-40 h-[32rem] w-[32rem] rounded-full bg-amber-500/[0.12] blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-orange-700/[0.1] blur-3xl"
        />

        {/* Bean scatter texture */}
        <BeanScatter tone="dark" density="heavy" />

        <div className="relative grid gap-7 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
          {/* LEFT — editorial masthead + saudação */}
          <div className="min-w-0">
            {/* Chapter label */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/10 font-mono text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/30">
                01
              </span>
              <span aria-hidden className="h-px w-10 bg-amber-300/40" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300/90">
                Sala Reservada
              </span>
            </div>

            {/* Greeting with serif italic accent */}
            <h1 className="mt-5 font-serif text-4xl font-semibold leading-[1.02] tracking-tight text-stone-50 md:text-[3rem]">
              <span className="font-sans font-light text-stone-300">Olá,</span>{" "}
              <span className="italic">
                <span className="bg-gradient-to-r from-amber-200 via-amber-300 to-orange-300 bg-clip-text text-transparent">
                  {firstName}
                </span>
                <span className="text-amber-300/50">.</span>
              </span>
            </h1>

            {/* Corretora nameplate */}
            {corretoraName && (
              <p className="mt-4 font-serif text-base text-stone-400 md:text-lg">
                <span className="text-stone-100">{corretoraName}</span>
                <span className="ml-2 font-sans text-xs uppercase tracking-[0.2em] text-stone-500">
                  · Corretora parceira
                </span>
              </p>
            )}

            {/* Date + status */}
            <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
              <span className="text-stone-400 first-letter:uppercase">
                {todayFull}
              </span>
              <span aria-hidden className="h-3 w-px bg-stone-700" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-semibold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-500/30">
                <span aria-hidden className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                Sala ativa
              </span>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-0.5 font-medium text-stone-300 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/[0.08] hover:text-amber-200"
              >
                <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden>
                  <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2" />
                  <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </svg>
                <span>Visível no Mercado do Café</span>
                <span aria-hidden className="text-stone-500 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-300">
                  ↗
                </span>
              </a>
            </div>

            {/* CTAs */}
            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/painel/corretora/leads"
                className="group relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-6 py-2.5 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-500/30 transition-colors hover:from-amber-200 hover:to-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
              >
                <span aria-hidden className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
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

          {/* RIGHT — aside card com metadata (stone + amber) */}
          <aside className="relative shrink-0 rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/[0.08] backdrop-blur-sm md:w-[220px]">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
            />
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 text-amber-300 ring-1 ring-amber-400/30">
                <PanelBrandMark className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                  Terminal
                </p>
                <p className="truncate text-xs font-semibold text-stone-100">
                  Kavita
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Status
                </span>
                <span className="text-[11px] font-semibold text-emerald-300">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Região
                </span>
                <span className="text-[11px] font-semibold text-stone-200">
                  Zona da Mata
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Safra
                </span>
                <span className="text-[11px] font-semibold text-amber-200">
                  {safra.replace("SAFRA ", "")}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ============================================================
          02 — SETUP / ATIVAÇÃO (dark, se não há leads)
         ============================================================ */}
      {showSetupPanel && (
        <>
          <OrnamentalDivider label="Ativação" />

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

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-950 via-[#1f1914] to-stone-900 p-6 shadow-xl shadow-stone-900/30 ring-1 ring-amber-900/20 md:p-7">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/[0.1] blur-3xl"
              />
              <BeanScatter tone="dark" density="medium" />

              <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 font-mono text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/40"
                    >
                      ✓
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-sm font-semibold text-stone-100 md:text-base">
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
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400/15 font-mono text-[10px] font-bold text-amber-300 ring-1 ring-amber-400/50"
                    >
                      02
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-sm font-semibold text-stone-100 md:text-base">
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
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[10px] font-bold text-stone-400 ring-1 ring-white/15"
                    >
                      03
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-sm font-semibold text-stone-300 md:text-base">
                        Aguarde o primeiro lead
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Ele chegará em tempo real nesta sala
                      </p>
                    </div>
                  </li>
                </ol>

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
        </>
      )}

      {/* ============================================================
          03 — PIPELINE
         ============================================================ */}
      <OrnamentalDivider label="Pipeline" />

      <section aria-label="Pipeline" className="space-y-4">
        <ChapterHeader
          number={showSetupPanel ? "03" : "02"}
          kicker="Pipeline"
          title="Resumo dos contatos"
          hint="Distribuição dos leads recebidos pela sua página pública."
        />
        <StatsCards summary={summary} loading={loading} />
      </section>

      {/* ============================================================
          04 — ATIVIDADE RECENTE
         ============================================================ */}
      <OrnamentalDivider label="Atividade" />

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
              className="group inline-flex items-center gap-1 text-xs font-semibold text-amber-700 underline-offset-4 hover:text-amber-800 hover:underline"
            >
              Ver todos
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
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
// EducationalEmptyState — dark committed com bean scatter, explica o
// fluxo de como um lead chega em 3 steps editoriais.
// ===================================================================
function EducationalEmptyState({ publicUrl }: { publicUrl: string }) {
  const steps = [
    {
      n: "01",
      title: "Produtor visita sua página",
      desc: "Sua corretora aparece listada no Mercado do Café com perfil e canais de contato.",
    },
    {
      n: "02",
      title: "Deixa um contato ou mensagem",
      desc: "Preenche o formulário da página ou utiliza seus canais diretos.",
    },
    {
      n: "03",
      title: "Lead chega nesta sala",
      desc: "Em tempo real, com status, mensagem e campo para notas internas.",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-950 via-[#1f1914] to-stone-900 p-8 shadow-xl shadow-stone-900/30 ring-1 ring-amber-900/20 md:p-10">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-500/[0.1] blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-orange-700/[0.08] blur-3xl"
      />
      <BeanScatter tone="dark" density="heavy" />

      <div className="relative">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400/25 to-amber-600/10 text-amber-300 ring-1 ring-amber-400/40">
            <span
              aria-hidden
              className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl"
            />
            <PanelBrandMark className="relative h-10 w-10" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/80">
              Empty State
            </p>
            <h3 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
              Sua sala está <span className="italic text-amber-300">pronta</span>
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-stone-400">
              Leads aparecerão aqui em tempo real. Veja o caminho até o primeiro contato chegar.
            </p>
          </div>
        </div>

        <ol className="mt-10 grid gap-3 md:grid-cols-3 md:gap-5">
          {steps.map((step, i) => (
            <li
              key={step.n}
              className="relative overflow-hidden rounded-xl bg-white/[0.04] p-5 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/[0.06]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
              />
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-amber-400">
                  {step.n}
                </span>
                <span aria-hidden className="h-px flex-1 bg-amber-300/20" />
                <span className="font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-stone-500">
                  {i === 0 ? "Descoberta" : i === 1 ? "Contato" : "Sala"}
                </span>
              </div>
              <p className="mt-3 font-serif text-base font-semibold text-stone-100">
                {step.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-9 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-6 py-2.5 text-sm font-semibold text-stone-950 shadow-lg shadow-amber-500/30 transition-colors hover:from-amber-200 hover:to-amber-400"
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
            Visitar página pública
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">↗</span>
          </a>
          <Link
            href="/painel/corretora/perfil"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-stone-200 backdrop-blur-sm transition-colors hover:bg-white/[0.08] hover:text-amber-200"
          >
            Aprimorar perfil
          </Link>
        </div>
      </div>
    </div>
  );
}
