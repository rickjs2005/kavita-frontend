// src/app/admin/mercado-do-cafe/corretora/[id]/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { useAdminAuth } from "@/context/AdminAuthContext";
import type { CorretoraAdmin } from "@/types/corretora";
import { SubscriptionManager } from "@/components/admin/mercado-do-cafe/corretoras/SubscriptionManager";

type Dossie = {
  leads: {
    total: number;
    novos: number;
    contatados: number;
    fechados: number;
    perdidos: number;
    alta_prioridade: number;
    sem_resposta_24h: number;
    ultimo_lead_em: string | null;
    taxa_conversao_pct: number | null;
  };
  sla: {
    medio_segundos: number | null;
    min_segundos: number | null;
    max_segundos: number | null;
  };
  leads_por_cidade: { cidade: string; total: number; fechados: number }[];
  reviews: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    average: number | null;
  };
  days_back: number;
};

function formatSeconds(secs: number | null): string {
  if (secs == null) return "—";
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}min`;
  if (secs < 86400) {
    const h = Math.floor(secs / 3600);
    const m = Math.round((secs % 3600) / 60);
    return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
  }
  return `${Math.floor(secs / 86400)}d`;
}

function slaColor(secs: number | null): string {
  if (secs == null) return "text-slate-500";
  if (secs < 7200) return "text-emerald-300";
  if (secs < 21600) return "text-amber-300";
  return "text-rose-300";
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function CorretoraDrillDownPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { logout } = useAdminAuth();

  const [corretora, setCorretora] = useState<CorretoraAdmin | null>(null);
  const [dossie, setDossie] = useState<Dossie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/admin/login");
  }, [logout, router]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [corretoraRes, dossieRes] = await Promise.allSettled([
        apiClient.get<CorretoraAdmin>(
          `/api/admin/mercado-do-cafe/corretoras/${id}`,
        ),
        apiClient.get<Dossie>(
          `/api/admin/mercado-do-cafe/stats/corretora/${id}?days=90`,
        ),
      ]);

      for (const r of [corretoraRes, dossieRes]) {
        if (
          r.status === "rejected" &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((r.reason as any)?.status === 401 ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (r.reason as any)?.status === 403)
        ) {
          handleUnauthorized();
          return;
        }
      }

      if (corretoraRes.status === "fulfilled") {
        setCorretora(corretoraRes.value);
      } else {
        setError(
          formatApiError(corretoraRes.reason, "Corretora não encontrada.").message,
        );
      }
      if (dossieRes.status === "fulfilled") setDossie(dossieRes.value);
    } finally {
      setLoading(false);
    }
  }, [id, handleUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !corretora) {
    return (
      <div className="relative min-h-screen w-full">
        <div className="mx-auto max-w-6xl px-4 py-10 text-xs text-slate-400">
          Carregando dossiê da corretora...
        </div>
      </div>
    );
  }

  if (error || !corretora) {
    return (
      <div className="relative min-h-screen w-full">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
            <p className="text-sm text-rose-200">
              {error ?? "Corretora não encontrada."}
            </p>
            <Link
              href="/admin/mercado-do-cafe"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200"
            >
              ← Voltar para Mercado do Café
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full">
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <Link
              href="/admin/mercado-do-cafe"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-amber-300"
            >
              ← Mercado do Café
            </Link>
            <h1 className="mt-1 truncate text-base font-semibold text-slate-50 sm:text-lg">
              {corretora.name}
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {corretora.city} · {corretora.state}
              {corretora.is_featured ? " · ⭐ Destaque" : ""} ·{" "}
              <span
                className={
                  corretora.status === "active"
                    ? "text-emerald-300"
                    : "text-slate-500"
                }
              >
                {corretora.status === "active" ? "Ativa" : "Inativa"}
              </span>
            </p>
          </div>
          <Link
            href={`/mercado-do-cafe/corretoras/${corretora.slug}`}
            target="_blank"
            className="shrink-0 rounded-xl bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-amber-200 ring-1 ring-white/10 hover:bg-white/[0.08] hover:ring-amber-400/30"
          >
            Ver página pública ↗
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-3 pb-10 pt-4 sm:px-4">
        {/* Stats principais */}
        {dossie && <LeadsStatsBlock dossie={dossie} />}

        {/* Plano e assinatura */}
        <SubscriptionManager
          corretoraId={corretora.id}
          onUnauthorized={handleUnauthorized}
        />

        {/* 2 colunas: perfil + SLA */}
        <div className="grid gap-5 lg:grid-cols-2">
          <ProfileBlock corretora={corretora} />
          {dossie && <SlaReviewsBlock dossie={dossie} />}
        </div>

        {/* Leads por cidade (se houver) */}
        {dossie && dossie.leads_por_cidade.length > 0 && (
          <LeadsPorCidadeBlock rows={dossie.leads_por_cidade} />
        )}
      </main>
    </div>
  );
}

// ─── Blocks ──────────────────────────────────────────────────────────────────

function LeadsStatsBlock({ dossie }: { dossie: Dossie }) {
  const cards = [
    { label: "Leads total", value: dossie.leads.total },
    {
      label: "Novos",
      value: dossie.leads.novos,
      accent: dossie.leads.novos > 0,
    },
    { label: "Em contato", value: dossie.leads.contatados },
    { label: "Fechados", value: dossie.leads.fechados, good: true },
    {
      label: "Conversão",
      value:
        dossie.leads.taxa_conversao_pct != null
          ? `${dossie.leads.taxa_conversao_pct}%`
          : "—",
      textual: true,
    },
    {
      label: "Alta prior.",
      value: dossie.leads.alta_prioridade,
      amber: dossie.leads.alta_prioridade > 0,
    },
    {
      label: "Sem resposta 24h",
      value: dossie.leads.sem_resposta_24h,
      warn: dossie.leads.sem_resposta_24h > 0,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            Atividade · últimos {dossie.days_back} dias
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-slate-50">
            Performance da corretora
          </h2>
          {dossie.leads.ultimo_lead_em && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              Último lead: {formatDateTime(dossie.leads.ultimo_lead_em)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`relative overflow-hidden rounded-xl border bg-slate-950/60 p-3 ${
              c.warn
                ? "border-rose-500/30"
                : c.amber
                  ? "border-amber-500/30"
                  : c.accent
                    ? "border-emerald-500/30"
                    : "border-slate-800"
            }`}
          >
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {c.label}
            </p>
            <p
              className={`mt-1 text-xl font-semibold tabular-nums ${
                c.warn
                  ? "text-rose-200"
                  : c.amber
                    ? "text-amber-200"
                    : c.good
                      ? "text-emerald-200"
                      : "text-slate-50"
              }`}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileBlock({ corretora }: { corretora: CorretoraAdmin }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
        Perfil
      </p>
      <h2 className="mt-0.5 text-sm font-semibold text-slate-50">
        Dados da corretora
      </h2>

      <dl className="mt-4 space-y-3 text-xs">
        <Row label="Responsável" value={corretora.contact_name} />
        <Row
          label="Localização"
          value={`${corretora.city} · ${corretora.state}${corretora.region ? ` · ${corretora.region}` : ""}`}
        />
        {corretora.description && (
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Descrição
            </p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {corretora.description}
            </p>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3">
          <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Canais
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Channel label="Telefone" value={corretora.phone} />
            <Channel label="WhatsApp" value={corretora.whatsapp} />
            <Channel label="E-mail" value={corretora.email} />
            <Channel label="Site" value={corretora.website} />
            <Channel label="Instagram" value={corretora.instagram} />
            <Channel label="Facebook" value={corretora.facebook} />
          </div>
        </div>
      </dl>

      <Link
        href={`/admin/mercado-do-cafe/corretoras/${corretora.id}`}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-amber-200 ring-1 ring-white/10 hover:bg-white/[0.08] hover:ring-amber-400/30"
      >
        Editar corretora →
      </Link>
    </div>
  );
}

function SlaReviewsBlock({ dossie }: { dossie: Dossie }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
          SLA
        </p>
        <h2 className="mt-0.5 text-sm font-semibold text-slate-50">
          Tempo de resposta
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
              Médio
            </p>
            <p
              className={`mt-1 text-xl font-semibold ${slaColor(dossie.sla.medio_segundos)}`}
            >
              {formatSeconds(dossie.sla.medio_segundos)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
              Mínimo
            </p>
            <p className="mt-1 text-xl font-semibold text-emerald-300">
              {formatSeconds(dossie.sla.min_segundos)}
            </p>
          </div>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
              Máximo
            </p>
            <p
              className={`mt-1 text-xl font-semibold ${slaColor(dossie.sla.max_segundos)}`}
            >
              {formatSeconds(dossie.sla.max_segundos)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
          Reviews
        </p>
        <h2 className="mt-0.5 text-sm font-semibold text-slate-50">Avaliações</h2>
        <div className="mt-4 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/30">
            <span className="text-xl font-semibold tabular-nums text-amber-200">
              {dossie.reviews.average != null
                ? dossie.reviews.average.toFixed(1)
                : "—"}
            </span>
          </div>
          <div className="flex-1 space-y-1 text-xs">
            <p className="text-slate-400">
              <span className="font-semibold text-emerald-300">
                {dossie.reviews.approved}
              </span>{" "}
              aprovadas
            </p>
            <p className="text-slate-400">
              <span className="font-semibold text-amber-300">
                {dossie.reviews.pending}
              </span>{" "}
              pendentes de moderação
            </p>
            <p className="text-slate-400">
              <span className="font-semibold text-rose-300">
                {dossie.reviews.rejected}
              </span>{" "}
              rejeitadas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadsPorCidadeBlock({
  rows,
}: {
  rows: { cidade: string; total: number; fechados: number }[];
}) {
  const max = Math.max(...rows.map((r) => r.total), 1);
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
        Origem dos leads
      </p>
      <h2 className="mt-0.5 text-sm font-semibold text-slate-50">
        Leads desta corretora por cidade do produtor
      </h2>
      <div className="mt-4 space-y-2">
        {rows.map((r) => {
          const pct = (r.total / max) * 100;
          return (
            <div
              key={r.cidade}
              className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-2.5"
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <p className="truncate font-medium text-slate-100">{r.cidade}</p>
                <div className="flex items-center gap-3 tabular-nums">
                  {r.fechados > 0 && (
                    <span className="text-emerald-300">
                      {r.fechados} fechado{r.fechados > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="font-semibold text-slate-50">{r.total}</span>
                </div>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-400/80"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-right text-slate-200">{value}</dd>
    </div>
  );
}

function Channel({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-950/40 px-2.5 py-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-0.5 truncate text-[11px] ${value ? "text-slate-200" : "text-slate-600 italic"}`}
      >
        {value || "não informado"}
      </p>
    </div>
  );
}
