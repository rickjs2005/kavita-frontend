"use client";

// Seção pública de cases comerciais.
// Layout editorial: case destaque + grid de cases secundários.
//
// Case destaque agora renderiza:
//   1. Hero com cover (cinematográfico)
//   2. BeforeAfterComparison (slider antes/depois) — quando houver
//      both before_image_url e after_image_url
//   3. CaseMetricsBar (até 6 métricas) — quando admin cadastrou
//   4. Resumo + depoimento textual
//
// Estado vazio elegante quando não há cases cadastrados.
// Fonte: GET /api/public/drones/cases?model=...

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Award, MapPin, Quote } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { absUrl } from "@/utils/absUrl";
import type { DroneCase } from "@/types/drones";
import BeforeAfterComparison from "./cases/BeforeAfterComparison";
import CaseMetricsBar from "./cases/CaseMetricsBar";

export default function CasesSection({ modelKey }: { modelKey?: string }) {
  const [cases, setCases] = useState<DroneCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const qs = modelKey ? `?model=${encodeURIComponent(modelKey)}` : "";
        const res = await apiClient.get<{ items?: DroneCase[] }>(
          `/api/public/drones/cases${qs}`,
        );
        if (cancelled) return;
        setCases(Array.isArray(res?.items) ? res.items : []);
      } catch {
        if (!cancelled) setCases([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modelKey]);

  if (loading) return null;

  const featured = cases[0];
  const rest = cases.slice(1, 4);

  return (
    <section className="relative py-16 sm:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-72 w-[40rem] rounded-full bg-emerald-500/8 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="max-w-3xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
            Em campo, com produtores reais
          </p>
          <h2 className="mt-3 text-2xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[2.6rem]">
            Cases Kavita Drones
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Histórias de uso real — fazendas, hectares aplicados,
            depoimento direto e comparação visual do antes e depois.
          </p>
        </div>

        {!cases.length ? <EmptyState /> : null}

        {featured ? (
          <div className="mt-12 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            {/* Case destaque (com BeforeAfter quando disponível) */}
            <FeaturedCaseCard caseItem={featured} />

            {/* Cases secundários (até 3) */}
            {rest.length > 0 ? (
              <div className="grid gap-3 lg:content-start">
                {rest.map((c) => (
                  <SmallCaseCard key={c.id} caseItem={c} />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FeaturedCaseCard({ caseItem }: { caseItem: DroneCase }) {
  const hasBeforeAfter = Boolean(
    caseItem.before_image_url && caseItem.after_image_url,
  );
  const hasMetrics = Boolean(caseItem.metrics?.length);

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-emerald-400/20 bg-[rgba(8,12,22,0.7)] backdrop-blur-md transition hover:shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 h-72 w-72 rounded-full bg-emerald-500/12 blur-3xl"
      />

      {/* Bloco 1: hero com cover */}
      {caseItem.cover_image_url ? (
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={absUrl(caseItem.cover_image_url)}
            alt={caseItem.title}
            fill
            quality={82}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"
          />

          <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-200 backdrop-blur">
            <Award className="h-3 w-3" aria-hidden />
            Case Kavita
          </div>

          <div className="absolute inset-x-5 bottom-5">
            <h3 className="text-2xl font-extrabold tracking-tight text-white sm:text-[1.7rem]">
              {caseItem.title}
            </h3>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200/90">
              <MapPin className="h-3 w-3" aria-hidden />
              {caseItem.farm_name}
              {caseItem.city ? ` · ${caseItem.city}` : ""}
              {caseItem.uf ? `/${caseItem.uf}` : ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="aspect-[16/10] w-full bg-gradient-to-br from-emerald-900/40 via-slate-900 to-black" />
      )}

      <div className="relative grid gap-6 p-5 sm:p-6">
        {/* Tags rápidas */}
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
          {caseItem.hectares != null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-bold tabular-nums">
              {caseItem.hectares} ha
            </span>
          )}
          {caseItem.model_key && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-extrabold uppercase text-emerald-200">
              {caseItem.model_key}
            </span>
          )}
        </div>

        {/* Bloco 2: ANTES x DEPOIS — só renderiza se admin subiu as 2 imagens */}
        {hasBeforeAfter ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
                Antes × Depois
              </p>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Comparação visual
              </span>
            </div>
            <BeforeAfterComparison
              beforeUrl={caseItem.before_image_url || ""}
              afterUrl={caseItem.after_image_url || ""}
              beforeLabel={caseItem.before_label}
              afterLabel={caseItem.after_label}
              alt={caseItem.title}
            />
          </div>
        ) : null}

        {/* Bloco 3: métricas em HUD horizontal */}
        {hasMetrics && caseItem.metrics ? (
          <CaseMetricsBar metrics={caseItem.metrics} />
        ) : null}

        {/* Bloco 4: resumo + depoimento */}
        {caseItem.summary ? (
          <p className="text-[13.5px] leading-relaxed text-slate-300">
            {caseItem.summary}
          </p>
        ) : null}

        {caseItem.testimonial ? (
          <blockquote className="relative rounded-2xl border border-white/8 bg-black/30 p-4 pl-9 text-[13px] leading-relaxed text-slate-200">
            <Quote
              className="absolute left-3 top-3 h-4 w-4 text-emerald-300/60"
              aria-hidden
            />
            <span className="line-clamp-4">{caseItem.testimonial}</span>
            {caseItem.producer_name ? (
              <footer className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                — {caseItem.producer_name}
              </footer>
            ) : null}
          </blockquote>
        ) : null}
      </div>
    </article>
  );
}

function SmallCaseCard({ caseItem }: { caseItem: DroneCase }) {
  return (
    <article className="group flex gap-3 overflow-hidden rounded-2xl border border-white/8 bg-[rgba(8,12,22,0.55)] p-3 transition hover:-translate-y-0.5 hover:border-white/20">
      {caseItem.cover_image_url ? (
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-black/40">
          <Image
            src={absUrl(caseItem.cover_image_url)}
            alt={caseItem.title}
            fill
            quality={75}
            sizes="96px"
            className="object-cover transition duration-500 group-hover:scale-[1.05]"
          />
        </div>
      ) : (
        <div className="aspect-square w-24 shrink-0 rounded-xl bg-gradient-to-br from-emerald-900/30 to-slate-900" />
      )}

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[13px] font-extrabold text-white">
          {caseItem.title}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">
          {caseItem.farm_name}
          {caseItem.city ? ` · ${caseItem.city}` : ""}
          {caseItem.uf ? `/${caseItem.uf}` : ""}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
          {caseItem.hectares != null && (
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-bold tabular-nums text-slate-300">
              {caseItem.hectares} ha
            </span>
          )}
          {caseItem.model_key && (
            <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 font-extrabold uppercase text-emerald-200">
              {caseItem.model_key}
            </span>
          )}
          {/* Pílula sinaliza que o card secundário tem material
              de antes/depois disponível (mesmo sem ser destaque). */}
          {caseItem.before_image_url && caseItem.after_image_url ? (
            <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 font-extrabold uppercase text-cyan-200">
              Antes × Depois
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(8,12,22,0.5)] p-8 text-center backdrop-blur-md sm:p-12">
      <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/10 text-emerald-300">
        <Award className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="mt-4 text-lg font-extrabold text-white sm:text-xl">
        Os primeiros cases estão chegando
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
        Estamos finalizando o material das primeiras operações Kavita
        Drones em campo. Em breve você verá fazendas reais, hectares
        aplicados, comparação antes/depois e depoimentos diretos.
      </p>
      <a
        href="#drones-representatives"
        className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-extrabold text-emerald-200 transition hover:bg-emerald-500/20"
      >
        Falar com representante
        <ArrowRight className="h-3 w-3" aria-hidden />
      </a>
    </div>
  );
}
