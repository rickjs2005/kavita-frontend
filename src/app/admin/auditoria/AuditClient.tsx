"use client";

// src/app/admin/auditoria/AuditClient.tsx
//
// Histórico de ações administrativas do módulo Mercado do Café.
// Design: timeline administrativa (não log de TI). Cada evento vira
// uma frase humana ("Ana aprovou a corretora Café do João"), com
// data amigável, alvo clicável, e detalhes secundários em tradução
// humana ("Destaque ativado", "Status alterado para Ativa") —
// payload cru fica escondido atrás de um disclosure discreto.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";

type AuditLog = {
  id: number;
  admin_id: number | null;
  admin_nome: string | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
};

// ─── Catálogo de ações conhecidas ──────────────────────────────────
// Cada ação tem: verbo humano, cor semântica, ícone e resumo curto.

type ActionTone = "positive" | "negative" | "neutral" | "warning";

type ActionMeta = {
  /** Frase curta para o chip ("Corretora aprovada"). */
  label: string;
  /** Verbo para compor a frase principal ("aprovou a corretora X"). */
  verb: string;
  /** Tom semântico — define cor. */
  tone: ActionTone;
  /** Emoji discreto. */
  icon: string;
};

const ACTIONS: Record<string, ActionMeta> = {
  "corretora.approved": {
    label: "Corretora aprovada",
    verb: "aprovou a corretora",
    tone: "positive",
    icon: "✓",
  },
  "corretora.rejected": {
    label: "Cadastro rejeitado",
    verb: "rejeitou o cadastro de",
    tone: "negative",
    icon: "✕",
  },
  "corretora.status_changed": {
    label: "Status da corretora alterado",
    verb: "alterou o status de",
    tone: "warning",
    icon: "◐",
  },
  "corretora.featured_changed": {
    label: "Destaque alterado",
    verb: "atualizou o destaque de",
    tone: "warning",
    icon: "★",
  },
  "review.moderated": {
    label: "Avaliação moderada",
    verb: "moderou uma avaliação de",
    tone: "neutral",
    icon: "✎",
  },
  "plan.assigned": {
    label: "Plano atribuído",
    verb: "atribuiu um plano a",
    tone: "positive",
    icon: "◆",
  },
};

const TONE_CHIP: Record<ActionTone, string> = {
  positive:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  negative: "border-rose-500/30 bg-rose-500/10 text-rose-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  neutral: "border-sky-500/30 bg-sky-500/10 text-sky-200",
};

const TONE_DOT: Record<ActionTone, string> = {
  positive: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
  negative: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]",
  warning: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]",
  neutral: "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]",
};

// ─── Helpers de apresentação ───────────────────────────────────────

function targetHref(
  targetType: string | null,
  targetId: number | null,
): string | null {
  if (!targetType || !targetId) return null;
  if (targetType === "corretora") {
    return `/admin/mercado-do-cafe/corretora/${targetId}`;
  }
  if (targetType === "submission") {
    return `/admin/mercado-do-cafe/solicitacoes/${targetId}`;
  }
  return null;
}

/** "corretora" → "a corretora" (genérico para compor frase). */
function targetNoun(targetType: string | null): string {
  if (!targetType) return "um registro";
  const map: Record<string, string> = {
    corretora: "a corretora",
    submission: "a solicitação",
    review: "a avaliação",
    plan: "o plano",
  };
  return map[targetType] ?? targetType;
}

/** Nome exibível do alvo — usa meta.name se existir, senão ID. */
function targetDisplay(log: AuditLog): string {
  const m = log.meta ?? {};
  const candidates = [
    m.corretora_name,
    m.name,
    m.nome,
    m.title,
  ];
  const found = candidates.find(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
  if (found) return String(found);
  if (log.target_id) return `#${log.target_id}`;
  return "—";
}

/** Data relativa humana ("há 3 min", "ontem às 14h"), com fallback. */
function formatRelative(iso: string): string {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "agora há pouco";
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `há ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "ontem";
    if (diffD < 7) return `há ${diffD} dias`;
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatAbsolute(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Traduz o meta cru em bullets humanos.
 * Ex: { featured: true }        → "Destaque ativado"
 *     { status: "active" }      → "Status alterado para Ativa"
 *     { rejection_reason: "..." } → "Motivo: ..."
 *
 * Campos desconhecidos viram "chave: valor" em cinza. Se nenhum
 * campo conhecido → lista crua como fallback (não some informação).
 */
function humanizeMeta(
  action: string,
  meta: Record<string, unknown> | null,
): { label: string; value: string; emphasis?: boolean }[] {
  if (!meta) return [];
  const entries: { label: string; value: string; emphasis?: boolean }[] = [];

  // status
  if ("status" in meta || "to" in meta || "new_status" in meta) {
    const raw = String(meta.status ?? meta.to ?? meta.new_status ?? "");
    const map: Record<string, string> = {
      active: "Ativa",
      inactive: "Inativa",
      approved: "Aprovada",
      rejected: "Rejeitada",
      pending: "Pendente",
    };
    if (raw) {
      entries.push({
        label: "Novo status",
        value: map[raw] ?? raw,
        emphasis: true,
      });
    }
  }

  // featured (boolean)
  if ("featured" in meta || "is_featured" in meta) {
    const v = meta.featured ?? meta.is_featured;
    entries.push({
      label: "Destaque",
      value: v ? "Ativado" : "Desativado",
      emphasis: true,
    });
  }

  // rejection reason
  if (typeof meta.rejection_reason === "string" && meta.rejection_reason.trim()) {
    entries.push({
      label: "Motivo",
      value: meta.rejection_reason,
      emphasis: true,
    });
  } else if (typeof meta.reason === "string" && meta.reason.trim()) {
    entries.push({ label: "Motivo", value: meta.reason, emphasis: true });
  }

  // plan
  if ("plan_id" in meta || "plan_slug" in meta || "plan_name" in meta) {
    const name = meta.plan_name ?? meta.plan_slug ?? meta.plan_id;
    if (name) {
      entries.push({
        label: "Plano",
        value: String(name),
        emphasis: true,
      });
    }
  }

  // review decision
  if (action === "review.moderated") {
    const decision = meta.decision ?? meta.to;
    const map: Record<string, string> = {
      approved: "Aprovada",
      rejected: "Rejeitada",
    };
    if (typeof decision === "string") {
      entries.push({
        label: "Decisão",
        value: map[decision] ?? decision,
        emphasis: true,
      });
    }
    if (typeof meta.rating === "number") {
      entries.push({
        label: "Nota original",
        value: `${meta.rating} ★`,
      });
    }
  }

  return entries;
}

// ─── Componente principal ──────────────────────────────────────────

// Fase 7.2 — escopos do módulo Mercado do Café. Label legível +
// key (bate com SCOPE_PREFIXES no backend).
const SCOPES: { key: string; label: string }[] = [
  { key: "", label: "Todos" },
  { key: "mercado_cafe", label: "Mercado do Café" },
  { key: "monetizacao", label: "Monetização" },
  { key: "corretoras", label: "Corretoras" },
  { key: "planos", label: "Planos" },
  { key: "assinaturas", label: "Assinaturas" },
  { key: "reviews", label: "Reviews" },
];

export default function AuditClient() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Disclosure por-linha para ver payload técnico original.
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: "30",
      });
      if (actionFilter) qs.set("action", actionFilter);
      if (scopeFilter) qs.set("scope", scopeFilter);
      const res = await apiClient.get<AuditLog[]>(
        `/api/admin/audit?${qs.toString()}`,
      );
      setRows(Array.isArray(res) ? res : []);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        window.location.href = "/admin/login";
        return;
      }
      setError("Não foi possível carregar o histórico agora.");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, scopeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filterKeys = useMemo(() => ["", ...Object.keys(ACTIONS)], []);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="relative min-h-screen w-full">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <nav
              aria-label="Caminho"
              className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold"
            >
              <Link
                href="/admin"
                className="text-slate-500 transition-colors hover:text-amber-300"
              >
                Admin
              </Link>
              <span aria-hidden className="text-slate-700">
                ›
              </span>
              <Link
                href="/admin/mercado-do-cafe"
                className="text-slate-400 transition-colors hover:text-amber-300"
              >
                Mercado do Café
              </Link>
              <span aria-hidden className="text-slate-700">
                ›
              </span>
              <span className="text-amber-200">Histórico de ações</span>
            </nav>

            <h1 className="mt-1.5 text-lg font-semibold tracking-tight text-slate-50 sm:text-xl">
              Histórico do Mercado do Café
            </h1>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-slate-400 sm:text-[13px]">
              Tudo que foi feito pela equipe Kavita neste módulo — aprovações,
              moderações, mudanças de status, destaques e planos. Os registros
              servem para consulta e rastreabilidade; não podem ser editados.
              Precisa de logs técnicos do sistema?{" "}
              <Link
                href="/admin/logs"
                className="font-semibold text-slate-300 hover:text-amber-300"
              >
                Abrir logs do sistema
              </Link>
              .
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-3 pb-12 pt-5 sm:px-5">
        {/* ─── Filtro de escopo (Fase 7.2) ────────────────────── */}
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Escopo
          </p>
          <div className="flex flex-wrap gap-2">
            {SCOPES.map((s) => {
              const active = scopeFilter === s.key;
              return (
                <button
                  key={s.key || "all-scope"}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setScopeFilter(s.key);
                  }}
                  className={`inline-flex min-h-[32px] items-center rounded-full border px-3.5 py-1 text-[11px] font-semibold transition-colors ${
                    active
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
                      : "border-slate-800 bg-slate-950/30 text-slate-400 hover:border-amber-500/30 hover:text-slate-100"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Filtros ────────────────────────────────────────── */}
        <div className="mb-5">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Filtrar por tipo de ação
          </p>
          <div className="flex flex-wrap gap-2">
            {filterKeys.map((key) => {
              const active = actionFilter === key;
              const label = key ? ACTIONS[key].label : "Todas as ações";
              return (
                <button
                  key={key || "all"}
                  type="button"
                  onClick={() => {
                    setPage(1);
                    setActionFilter(key);
                  }}
                  className={`inline-flex min-h-[36px] items-center rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
                      : "border-slate-800 bg-slate-950/30 text-slate-300 hover:border-amber-500/30 hover:text-slate-100"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Loading ─────────────────────────────────────────── */}
        {loading && rows.length === 0 && (
          <ul className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-slate-800/60 bg-slate-950/40"
              />
            ))}
          </ul>
        )}

        {/* ─── Erro ────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-200">
            <p className="font-semibold">Histórico indisponível</p>
            <p className="mt-1 text-[13px] text-rose-200/80">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 inline-flex items-center rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/20"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* ─── Empty state ─────────────────────────────────────── */}
        {!loading && rows.length === 0 && !error && (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-8 text-center sm:p-10">
            <div
              aria-hidden
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/30"
            >
              <span className="text-xl">☕</span>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-100">
              {actionFilter
                ? "Nenhuma movimentação deste tipo por enquanto"
                : "Nenhuma movimentação registrada ainda"}
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-slate-400">
              {actionFilter
                ? "Tente trocar o filtro acima ou voltar para “Todas as ações”. As movimentações aparecem aqui assim que a equipe agir sobre o módulo."
                : "Sempre que a equipe aprovar um cadastro, mudar o status de uma corretora, moderar uma avaliação ou ajustar um plano, o registro aparece aqui."}
            </p>
            {actionFilter && (
              <button
                type="button"
                onClick={() => setActionFilter("")}
                className="mt-4 inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-amber-500/40 hover:text-amber-200"
              >
                Ver todas as ações
              </button>
            )}
          </div>
        )}

        {/* ─── Timeline ────────────────────────────────────────── */}
        {rows.length > 0 && (
          <ul className="space-y-3">
            {rows.map((r) => {
              const meta = ACTIONS[r.action];
              const tone = meta?.tone ?? "neutral";
              const href = targetHref(r.target_type, r.target_id);
              const display = targetDisplay(r);
              const bullets = humanizeMeta(r.action, r.meta);
              const isExpanded = expanded.has(r.id);
              const hasRawMeta =
                r.meta && Object.keys(r.meta).length > 0;

              return (
                <li
                  key={r.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 transition-colors hover:border-slate-700"
                >
                  {/* Top hairline sutil com a cor do tom */}
                  <span
                    aria-hidden
                    className={`pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent ${
                      tone === "positive"
                        ? "via-emerald-400/40"
                        : tone === "negative"
                          ? "via-rose-400/40"
                          : tone === "warning"
                            ? "via-amber-400/40"
                            : "via-sky-400/40"
                    } to-transparent`}
                  />

                  <div className="flex gap-4 p-4 sm:p-5">
                    {/* Dot colorido — âncora visual da timeline */}
                    <div className="shrink-0 pt-1.5">
                      <span
                        aria-hidden
                        className={`block h-2.5 w-2.5 rounded-full ${TONE_DOT[tone]}`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Chip + data relativa */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${TONE_CHIP[tone]}`}
                        >
                          <span aria-hidden>{meta?.icon ?? "•"}</span>
                          {meta?.label ?? r.action}
                        </span>
                        <span
                          className="text-[11px] text-slate-400"
                          title={formatAbsolute(r.created_at)}
                        >
                          {formatRelative(r.created_at)}
                        </span>
                      </div>

                      {/* Frase humana principal */}
                      <p className="mt-2 text-[14px] leading-relaxed text-slate-100 sm:text-[15px]">
                        <span className="font-semibold text-slate-50">
                          {r.admin_nome ?? "Administrador"}
                        </span>{" "}
                        <span className="text-slate-300">
                          {meta?.verb ?? "registrou uma ação em"}
                        </span>{" "}
                        <span className="text-slate-300">
                          {targetNoun(r.target_type)}
                        </span>{" "}
                        {href ? (
                          <Link
                            href={href}
                            className="font-semibold text-amber-200 underline-offset-4 hover:underline"
                          >
                            {display}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-100">
                            {display}
                          </span>
                        )}
                        <span className="text-slate-300">.</span>
                      </p>

                      {/* Bullets de tradução humana */}
                      {bullets.length > 0 && (
                        <dl className="mt-3 grid gap-1.5 sm:grid-cols-2">
                          {bullets.map((b, i) => (
                            <div
                              key={i}
                              className="flex items-baseline gap-2 text-[12px]"
                            >
                              <dt className="shrink-0 text-slate-500">
                                {b.label}:
                              </dt>
                              <dd
                                className={
                                  b.emphasis
                                    ? "font-semibold text-slate-100"
                                    : "text-slate-300"
                                }
                              >
                                {b.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}

                      {/* Footer discreto + disclosure */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-800/70 pt-2.5 text-[11px] text-slate-500">
                        {r.ip && (
                          <span
                            title="Endereço de rede de onde partiu a ação"
                            className="tabular-nums"
                          >
                            Origem {r.ip}
                          </span>
                        )}
                        {hasRawMeta && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(r.id)}
                            className="ml-auto inline-flex items-center gap-1 text-slate-500 transition-colors hover:text-amber-300"
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? "Ocultar" : "Ver"} detalhes técnicos
                            <span
                              aria-hidden
                              className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            >
                              ▾
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Payload cru — escondido por padrão */}
                      {isExpanded && hasRawMeta && (
                        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900/70 p-3 text-[10.5px] leading-relaxed text-slate-400 ring-1 ring-slate-800">
                          {JSON.stringify(r.meta, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* ─── Paginação ──────────────────────────────────────── */}
        {rows.length >= 30 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-amber-500/30 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ← Mais recentes
            </button>
            <span className="text-[11px] text-slate-400 tabular-nums">
              Página {page}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-amber-500/30 hover:text-amber-200"
            >
              Anteriores →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
