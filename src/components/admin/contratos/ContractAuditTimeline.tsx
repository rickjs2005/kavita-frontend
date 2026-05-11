// src/components/admin/contratos/ContractAuditTimeline.tsx
//
// Renderiza a trilha append-only de eventos de um contrato no admin
// (Fase 10.5). Foco em rastreabilidade jurídica: cada item exibe
// quem/quando/de-onde/para-onde, sem expor JSON técnico por default.
"use client";

import { useMemo } from "react";
import {
  AUDIT_ACTOR_LABEL,
  AUDIT_EVENT_LABEL,
  type AuditActorType,
  type AuditEventType,
  type ContractAuditEvent,
} from "@/types/contrato";
import { useContractAuditLog } from "@/hooks/useContractAuditLog";

type Props = {
  contratoId: number;
  onUnauthorized?: () => void;
};

// Paleta de cores por tipo de evento — neutra, administrativa, alinhada
// ao restante do admin (slate/dark). Mantém em sync com AuditEventType.
type Tone =
  | "green"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "slate"
  | "violet";

const EVENT_TONE: Record<AuditEventType, Tone> = {
  created: "emerald",
  sent_to_signature: "blue",
  signed: "green",
  cancelled: "rose",
  expired: "amber",
  blocked_by_plan: "amber",
  blocked_by_kyc: "amber",
  downloaded: "slate",
  webhook_applied: "violet",
  webhook_blocked: "rose",
  immutable_blocked: "rose",
};

const TONE_BADGE_CLASS: Record<Tone, string> = {
  green: "bg-green-500/15 text-green-300 ring-1 ring-green-400/30",
  emerald: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
  blue: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/30",
  amber: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
  rose: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30",
  slate: "bg-slate-500/20 text-slate-300 ring-1 ring-slate-400/30",
  violet: "bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/30",
};

const TONE_DOT_CLASS: Record<Tone, string> = {
  green: "bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.45)]",
  emerald: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]",
  blue: "bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.45)]",
  amber: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]",
  rose: "bg-rose-400 shadow-[0_0_10px_rgba(244,114,182,0.45)]",
  slate: "bg-slate-400",
  violet: "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.45)]",
};

function toneFor(eventType: string): Tone {
  return (EVENT_TONE as Record<string, Tone>)[eventType] ?? "slate";
}

function labelFor(eventType: string): string {
  return (
    (AUDIT_EVENT_LABEL as Record<string, string>)[eventType] ?? eventType
  );
}

function actorLabelFor(actorType: string): string {
  return (
    (AUDIT_ACTOR_LABEL as Record<string, string>)[actorType] ?? actorType
  );
}

function formatDateTimePtBR(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// Resume user_agent gigante em algo legível (sistema/browser básico).
// Não tenta parser — só corta. UA completo fica no <details>.
function shortenUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  const trimmed = ua.trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 77)}…`;
}

export function ContractAuditTimeline({ contratoId, onUnauthorized }: Props) {
  const { items, loading, error, reload } = useContractAuditLog({
    contratoId,
    onUnauthorized,
  });

  // Backend já devolve DESC (mais recente primeiro). Memoizamos pra
  // evitar reordenação se algum endpoint futuro mudar o sort default.
  const ordered = useMemo(() => items.slice(), [items]);

  return (
    <section
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20 md:p-6"
      aria-label="Trilha de auditoria do contrato"
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Trilha de auditoria do contrato
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Eventos append-only registrados para rastreabilidade jurídica.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-200 ring-1 ring-white/[0.05] transition-colors hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </header>

      {loading && items.length === 0 && (
        <p className="rounded-lg bg-slate-800/60 px-4 py-6 text-center text-xs text-slate-400">
          Carregando trilha de auditoria…
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          <p className="font-semibold">Não foi possível carregar a auditoria.</p>
          <p className="mt-1 text-xs text-rose-300/80">{error}</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="rounded-lg bg-slate-800/60 px-4 py-6 text-center text-xs text-slate-400">
          Nenhum evento de auditoria encontrado para este contrato.
        </p>
      )}

      {items.length > 0 && (
        <ol className="relative space-y-4 border-l border-slate-700/70 pl-5">
          {ordered.map((ev) => (
            <AuditItem key={ev.id} ev={ev} />
          ))}
        </ol>
      )}
    </section>
  );
}

function AuditItem({ ev }: { ev: ContractAuditEvent }) {
  const tone = toneFor(ev.event_type);
  const eventLabel = labelFor(ev.event_type);
  const actorLabel = actorLabelFor(ev.actor_type);
  const uaShort = shortenUserAgent(ev.user_agent);

  return (
    <li className="relative">
      <span
        aria-hidden
        className={`absolute -left-[27px] top-1.5 inline-block h-3 w-3 rounded-full ring-2 ring-slate-900 ${TONE_DOT_CLASS[tone]}`}
      />
      <div className="rounded-xl bg-slate-900/80 p-4 ring-1 ring-white/[0.06]">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${TONE_BADGE_CLASS[tone]}`}
          >
            {eventLabel}
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            #{ev.id}
          </span>
          <span className="ml-auto text-[11px] tabular-nums text-slate-400">
            {formatDateTimePtBR(ev.created_at)}
          </span>
        </div>

        {/* Linha 2 — actor + transição de status. Cada chip só aparece
            quando o dado existe; minimiza ruído visual. */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-slate-300">
          <span>
            <span className="text-slate-500">Por:</span>{" "}
            <span className="font-medium text-slate-200">{actorLabel}</span>
            {ev.actor_id ? (
              <span className="ml-1 text-slate-500">#{ev.actor_id}</span>
            ) : null}
          </span>

          {(ev.previous_status || ev.new_status) && (
            <span className="font-mono">
              <span className="text-slate-500">Status:</span>{" "}
              <span className="text-slate-300">
                {ev.previous_status ?? "—"}
              </span>
              <span className="mx-1 text-slate-500">→</span>
              <span className="text-emerald-300">{ev.new_status ?? "—"}</span>
            </span>
          )}
        </div>

        {/* Linha 3 — provider + IP + user_agent. Só quando existem. */}
        {(ev.provider || ev.provider_document_id || ev.ip || uaShort) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
            {ev.provider && (
              <span>
                <span className="text-slate-500">Provider:</span>{" "}
                <span className="font-mono text-slate-300">{ev.provider}</span>
              </span>
            )}
            {ev.provider_document_id && (
              <span className="max-w-[260px] truncate">
                <span className="text-slate-500">Doc:</span>{" "}
                <span
                  className="font-mono text-slate-300"
                  title={ev.provider_document_id}
                >
                  {ev.provider_document_id}
                </span>
              </span>
            )}
            {ev.ip && (
              <span>
                <span className="text-slate-500">IP:</span>{" "}
                <span className="font-mono text-slate-300">{ev.ip}</span>
              </span>
            )}
            {uaShort && (
              <span
                className="max-w-[420px] truncate"
                title={ev.user_agent ?? undefined}
              >
                <span className="text-slate-500">UA:</span>{" "}
                <span className="text-slate-300">{uaShort}</span>
              </span>
            )}
          </div>
        )}

        {/* Payload técnico — colapsado por default. Mantém os bytes da
            verdade jurídica acessíveis sem poluir a timeline. */}
        {ev.payload && Object.keys(ev.payload).length > 0 && (
          <details className="group mt-3">
            <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 transition-colors hover:text-slate-200">
              <span className="inline-block transition-transform group-open:rotate-90">
                ▸
              </span>{" "}
              Detalhes técnicos (payload)
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950/70 p-3 text-[11px] leading-relaxed text-slate-300 ring-1 ring-white/[0.05]">
              {JSON.stringify(ev.payload, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </li>
  );
}
