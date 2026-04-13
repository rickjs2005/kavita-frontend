"use client";

import Link from "next/link";
import type { AlertItem } from "../dashboardTypes";
import { getAlertColors, LoadingSpinner } from "../dashboardUtils";

type Props = {
  alertas: AlertItem[];
  alertasLoading: boolean;
  alertasError: string | null;
};

function AlertCard({ alerta }: { alerta: AlertItem }) {
  const colors = getAlertColors(alerta.nivel);

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800/70 bg-slate-900/80 px-3 py-2.5">
      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${colors.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-[1px] text-[10px] font-medium uppercase tracking-[0.14em] ${colors.badge}`}
          >
            {alerta.tipo.toUpperCase()}
          </span>
        </div>
        <p className="mt-1 text-xs font-semibold text-slate-100">
          {alerta.titulo}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-300">{alerta.mensagem}</p>
        {alerta.link && alerta.link_label && (
          <Link
            href={alerta.link}
            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
          >
            {alerta.link_label}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export function OperationsSection({
  alertas,
  alertasLoading,
  alertasError,
}: Props) {
  const dangerAlerts = alertas.filter((a) => a.nivel === "danger");
  const warningAlerts = alertas.filter((a) => a.nivel === "warning");
  const infoAlerts = alertas.filter((a) => a.nivel === "info");

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300">
            Central de alertas
          </p>
          <h2 className="text-sm font-semibold text-slate-50">
            O que precisa da sua atenção agora
          </h2>
        </div>
        {alertas.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-200">
            {dangerAlerts.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500/80 px-1 text-[10px] font-bold text-white">
                {dangerAlerts.length}
              </span>
            )}
            {warningAlerts.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/80 px-1 text-[10px] font-bold text-white">
                {warningAlerts.length}
              </span>
            )}
            {infoAlerts.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500/80 px-1 text-[10px] font-bold text-white">
                {infoAlerts.length}
              </span>
            )}
            <span>{alertas.length} alerta(s)</span>
          </span>
        )}
      </div>

      {alertasLoading && (
        <div className="flex items-center justify-center py-6 text-xs text-slate-400">
          <LoadingSpinner size="sm" />
          <span className="ml-2">Verificando status da loja...</span>
        </div>
      )}

      {alertasError && !alertasLoading && (
        <p className="py-4 text-xs text-rose-300">{alertasError}</p>
      )}

      {!alertasLoading && !alertasError && alertas.length === 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <p className="text-xs text-emerald-200">
            Tudo certo! Nenhum alerta no momento. Sua loja está saudável.
          </p>
        </div>
      )}

      {!alertasLoading && !alertasError && alertas.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {/* Danger alerts first, then warnings, then info */}
          {dangerAlerts.map((a) => (
            <AlertCard key={a.id} alerta={a} />
          ))}
          {warningAlerts.map((a) => (
            <AlertCard key={a.id} alerta={a} />
          ))}
          {infoAlerts.map((a) => (
            <AlertCard key={a.id} alerta={a} />
          ))}
        </div>
      )}
    </section>
  );
}
