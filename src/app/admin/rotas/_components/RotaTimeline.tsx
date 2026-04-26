"use client";

import type { RotaCompleta } from "@/lib/rotas/types";

interface Step {
  label: string;
  at: string | null;
  status: "done" | "current" | "future" | "warn" | "danger";
  hint?: string;
}

function fmt(at: string | null): string {
  if (!at) return "—";
  return new Date(at).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Timeline operacional da rota — derivada de campos ja existentes
 * (created_at, iniciada_em, finalizada_em + paradas com entregue_em).
 *
 * Sem migration. Mostra os marcos cruciais que o admin precisa em uma
 * conversa com motorista: "que horas a rota saiu? quando foi a ultima
 * entrega? alguma deu problema?".
 */
export default function RotaTimeline({ rota }: { rota: RotaCompleta }) {
  const paradasEntregues = rota.paradas.filter(
    (p) => p.status === "entregue" && p.entregue_em,
  );
  const ultimaEntrega =
    paradasEntregues.length > 0
      ? paradasEntregues
          .map((p) => p.entregue_em as string)
          .sort()
          .at(-1)!
      : null;

  const paradasProblema = rota.paradas.filter((p) => p.status === "problema");

  const steps: Step[] = [
    {
      label: "Criada",
      at: rota.created_at,
      status: "done",
    },
    {
      label: "Pronta",
      at: rota.status === "rascunho" ? null : rota.updated_at,
      status: rota.status === "rascunho" ? "future" : "done",
      hint:
        rota.status === "rascunho"
          ? "Aguardando motorista ou paradas"
          : undefined,
    },
    {
      label: "Iniciada",
      at: rota.iniciada_em,
      status: rota.iniciada_em
        ? rota.status === "em_rota"
          ? "current"
          : "done"
        : rota.status === "cancelada"
          ? "future"
          : "future",
      hint:
        !rota.iniciada_em && rota.status === "pronta"
          ? "Motorista ainda não chegou em rota"
          : undefined,
    },
    ...(ultimaEntrega
      ? [
          {
            label: `Última entrega (${paradasEntregues.length}/${rota.total_paradas})`,
            at: ultimaEntrega,
            status: "done" as const,
          },
        ]
      : []),
    ...(paradasProblema.length > 0
      ? [
          {
            label: `${paradasProblema.length} ${paradasProblema.length === 1 ? "ocorrência" : "ocorrências"}`,
            at: paradasProblema
              .map((p) => p.updated_at)
              .sort()
              .at(-1)!,
            status: "danger" as const,
          },
        ]
      : []),
    {
      label: rota.status === "cancelada" ? "Cancelada" : "Finalizada",
      at: rota.finalizada_em,
      status:
        rota.status === "cancelada"
          ? "danger"
          : rota.finalizada_em
            ? "done"
            : "future",
    },
  ];

  return (
    <div className="rounded-xl bg-dark-800 ring-1 ring-white/10 p-4">
      <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold mb-3">
        Timeline
      </div>
      <ol className="space-y-2.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="relative flex flex-col items-center">
              <span className={`block h-2.5 w-2.5 rounded-full ${dotColor(s.status)}`} />
              {i < steps.length - 1 && (
                <span className="absolute top-2.5 h-full w-px bg-white/10" />
              )}
            </div>
            <div className="flex-1 pb-2 -mt-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className={`text-xs font-semibold ${textColor(s.status)}`}>
                  {s.label}
                </span>
                <span className="text-[11px] text-gray-500 font-mono">
                  {fmt(s.at)}
                </span>
              </div>
              {s.hint && (
                <p className="text-[11px] text-gray-500 italic mt-0.5">{s.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function dotColor(s: Step["status"]): string {
  switch (s) {
    case "done":
      return "bg-emerald-500";
    case "current":
      return "bg-amber-400 animate-pulse";
    case "warn":
      return "bg-amber-500";
    case "danger":
      return "bg-rose-500";
    case "future":
    default:
      return "bg-gray-700";
  }
}

function textColor(s: Step["status"]): string {
  switch (s) {
    case "done":
      return "text-gray-200";
    case "current":
      return "text-amber-200";
    case "warn":
      return "text-amber-200";
    case "danger":
      return "text-rose-200";
    case "future":
    default:
      return "text-gray-500";
  }
}
