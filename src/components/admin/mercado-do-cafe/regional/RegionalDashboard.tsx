"use client";

// src/components/admin/mercado-do-cafe/regional/RegionalDashboard.tsx
//
// Dashboard regional do admin — Sprint 3. Visão consolidada da
// operação do Mercado do Café, com foco em Manhuaçu e Zona da Mata.
//
// 4 blocos:
//   1. KPIs gerais (corretoras ativas, cidades, leads, SLA)
//   2. Leads por cidade (onde a plataforma gera tração)
//   3. Leads pendurados (alertas operacionais)
//   4. Performance das corretoras (ranking)

import Link from "next/link";
import {
  useRegionalStats,
  type LeadsPorCidadeRow,
  type CorretoraPerfRow,
  type LeadPenduradoRow,
} from "@/hooks/useRegionalStats";

type Props = {
  onUnauthorized?: () => void;
};

/** Segundos → formato humano (1h23, 45min, 2d). */
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

/** SLA em segundos → cor semântica (verde <2h, ambar <6h, vermelho >=6h). */
function slaColor(secs: number | null): string {
  if (secs == null) return "text-slate-500";
  if (secs < 7200) return "text-emerald-300";
  if (secs < 21600) return "text-amber-300";
  return "text-rose-300";
}

export default function RegionalDashboard({ onUnauthorized }: Props) {
  const { kpis, leadsPorCidade, corretorasPerf, leadsPendurados, loading, error, reload } =
    useRegionalStats({ onUnauthorized });

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-xs text-slate-400">
        Carregando estatísticas regionais...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center">
        <p className="text-sm text-rose-200">{error}</p>
        <button
          type="button"
          onClick={reload}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-1.5 text-[11px] font-semibold text-rose-200 ring-1 ring-rose-500/30 transition-colors hover:bg-rose-500/20"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. KPIs gerais */}
      {kpis && <KpisRow kpis={kpis} onReload={reload} />}

      {/* 2. Leads pendurados (alerta operacional) */}
      {leadsPendurados.length > 0 && (
        <PenduradosSection rows={leadsPendurados} />
      )}

      {/* 3. Leads por cidade + Manhuaçu em destaque */}
      <LeadsPorCidadeSection rows={leadsPorCidade} />

      {/* 4. Performance de corretoras */}
      <CorretorasPerformanceSection rows={corretorasPerf} />
    </div>
  );
}

// ─── KPIs Row ────────────────────────────────────────────────────────────────

function KpisRow({
  kpis,
  onReload,
}: {
  kpis: NonNullable<ReturnType<typeof useRegionalStats>["kpis"]>;
  onReload: () => void;
}) {
  const cards = [
    { kicker: "Corretoras", value: kpis.corretoras_ativas, hint: "ativas" },
    { kicker: "Cidades", value: kpis.cidades_cobertas, hint: "cobertas" },
    { kicker: "Leads", value: kpis.leads_periodo, hint: `${kpis.days_back}d` },
    {
      kicker: "Alta prior.",
      value: kpis.leads_alta_prioridade,
      hint: "≥ 200 sacas",
      accent: true,
    },
    { kicker: "Fechados", value: kpis.leads_fechados, hint: "negócios" },
    {
      kicker: "SLA médio",
      value: formatSeconds(kpis.sla_medio_segundos),
      hint: "1ª resposta",
      textual: true,
      slaColorClass: slaColor(kpis.sla_medio_segundos),
    },
    {
      kicker: "Pendentes",
      value: kpis.submissions_pendentes,
      hint: "solicitações",
      warn: kpis.submissions_pendentes > 0,
    },
  ];

  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
            Visão geral · últimos {kpis.days_back} dias
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-slate-50">
            Operação Zona da Mata
          </h3>
        </div>
        <button
          type="button"
          onClick={onReload}
          className="text-[11px] font-semibold text-amber-300 hover:text-amber-200"
        >
          Atualizar ↻
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {cards.map((c, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-xl border bg-slate-950/60 p-3 ${
              c.accent
                ? "border-amber-500/30"
                : c.warn
                  ? "border-rose-500/30"
                  : "border-slate-800"
            }`}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
            />
            <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {c.kicker}
            </p>
            <p
              className={`mt-1.5 text-2xl font-semibold tracking-tight tabular-nums ${
                c.textual
                  ? c.slaColorClass
                  : c.accent
                    ? "text-amber-200"
                    : c.warn
                      ? "text-rose-200"
                      : "text-slate-50"
              }`}
            >
              {c.value}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">{c.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Leads pendurados ────────────────────────────────────────────────────────

function PenduradosSection({ rows }: { rows: LeadPenduradoRow[] }) {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/[0.04] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className="flex h-2 w-2 shrink-0 rounded-full bg-rose-400"
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-300">
          Alerta operacional
        </p>
      </div>
      <h3 className="text-sm font-semibold text-slate-50">
        {rows.length} lead{rows.length > 1 ? "s" : ""} sem resposta há mais de 24h
      </h3>
      <p className="mt-1 text-[11px] text-slate-400">
        Corretoras lentas prejudicam a experiência do produtor e a marca
        Kavita. Considere acionar quem aparece aqui com frequência.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-[10px] uppercase tracking-[0.14em] text-slate-400">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Lead</th>
              <th className="px-3 py-2.5 font-semibold">Cidade</th>
              <th className="px-3 py-2.5 font-semibold">Corretora</th>
              <th className="px-3 py-2.5 text-right font-semibold">Sem resposta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.slice(0, 10).map((r) => (
              <tr key={r.id} className="text-slate-200">
                <td className="px-3 py-2.5">
                  <p className="font-medium">{r.nome}</p>
                  {r.volume_range && (
                    <p className="mt-0.5 text-[10px] text-amber-300/80">
                      {r.volume_range.replace("_", "–")} sacas
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-slate-400">
                  {r.cidade ?? "—"}
                </td>
                <td className="px-3 py-2.5">
                  <Link
                    href={`/mercado-do-cafe/corretoras/${r.corretora.slug}`}
                    target="_blank"
                    className="font-medium text-amber-300 hover:text-amber-200"
                  >
                    {r.corretora.name}
                  </Link>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {r.corretora.city}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-rose-300 tabular-nums">
                  {r.horas_sem_resposta}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Leads por cidade ────────────────────────────────────────────────────────

function LeadsPorCidadeSection({ rows }: { rows: LeadsPorCidadeRow[] }) {
  const max = rows.length > 0 ? Math.max(...rows.map((r) => r.total), 1) : 1;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
          Regional
        </p>
        <h3 className="mt-0.5 text-base font-semibold text-slate-50">
          Leads gerados por cidade do produtor
        </h3>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Onde a plataforma está gerando tração regional.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          Sem leads com cidade identificada no período.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 10).map((r) => {
            const pct = (r.total / max) * 100;
            return (
              <div
                key={r.cidade}
                className="group rounded-lg border border-slate-800/70 bg-slate-950/40 p-2.5 hover:border-amber-500/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium text-slate-100">
                    {r.cidade}
                  </p>
                  <div className="flex shrink-0 items-center gap-3 text-[11px] tabular-nums">
                    {r.alta_prioridade > 0 && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">
                        {r.alta_prioridade} alta prior.
                      </span>
                    )}
                    {r.fechados > 0 && (
                      <span className="text-emerald-300">
                        {r.fechados} fechado{r.fechados > 1 ? "s" : ""}
                      </span>
                    )}
                    <span
                      className={`font-mono text-[10px] ${slaColor(r.sla_medio_segundos)}`}
                    >
                      SLA {formatSeconds(r.sla_medio_segundos)}
                    </span>
                    <span className="font-semibold text-slate-50">
                      {r.total}
                    </span>
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
      )}
    </div>
  );
}

// ─── Performance corretoras ──────────────────────────────────────────────────

function CorretorasPerformanceSection({ rows }: { rows: CorretoraPerfRow[] }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
          Ranking
        </p>
        <h3 className="mt-0.5 text-base font-semibold text-slate-50">
          Performance das corretoras
        </h3>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Leads recebidos, conversão, SLA e alta prioridade por corretora.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          Sem dados de performance no período.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] uppercase tracking-[0.14em] text-slate-400">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Corretora</th>
                <th className="px-3 py-2.5 text-right font-semibold">Leads</th>
                <th className="px-3 py-2.5 text-right font-semibold">Alta prior.</th>
                <th className="px-3 py-2.5 text-right font-semibold">Fechados</th>
                <th className="px-3 py-2.5 text-right font-semibold">Conv.</th>
                <th className="px-3 py-2.5 text-right font-semibold">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.slice(0, 30).map((r) => (
                <tr
                  key={r.id}
                  className={`text-slate-200 transition-colors hover:bg-slate-900/50 ${r.status === "inactive" ? "opacity-50" : ""}`}
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/admin/mercado-do-cafe/corretora/${r.id}`}
                      className="group block"
                    >
                      <div className="flex items-center gap-2">
                        <p className="min-w-0 truncate font-medium transition-colors group-hover:text-amber-200">
                          {r.name}
                        </p>
                        {r.is_featured && (
                          <span
                            aria-label="Destaque"
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
                          />
                        )}
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-500">
                        {r.city} · {r.state}
                      </p>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                    {r.leads_total}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-amber-200">
                    {r.leads_alta_prioridade || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-emerald-300">
                    {r.leads_fechados || "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">
                    {r.taxa_conversao_pct != null
                      ? `${r.taxa_conversao_pct}%`
                      : "—"}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right font-mono text-[10px] tabular-nums ${slaColor(r.sla_medio_segundos)}`}
                  >
                    {formatSeconds(r.sla_medio_segundos)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
