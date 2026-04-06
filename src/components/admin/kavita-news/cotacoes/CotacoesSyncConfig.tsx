"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

type SyncConfig = {
  cotacoes_sync_enabled: boolean;
  cotacoes_sync_cron: string;
  cotacoes_provider_enabled: boolean;
  runtime: {
    enabled: boolean;
    cronExpr: string | null;
    running: boolean;
    lastRunAt: string | null;
    lastStatus: "success" | "partial" | "error" | null;
    lastError: string | null;
    lastReport: {
      total: number;
      ok: number;
      error: number;
      durationMs: number;
    } | null;
  };
};

const CRON_PRESETS: { label: string; value: string }[] = [
  { label: "A cada 1 hora", value: "0 */1 * * *" },
  { label: "A cada 2 horas", value: "0 */2 * * *" },
  { label: "A cada 4 horas", value: "0 */4 * * *" },
  { label: "A cada 6 horas", value: "0 */6 * * *" },
  { label: "A cada 12 horas", value: "0 */12 * * *" },
];

function cronLabel(expr: string): string {
  const preset = CRON_PRESETS.find((p) => p.value === expr);
  return preset ? preset.label : expr;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function statusBadge(status: string | null) {
  if (!status) return null;
  const map: Record<string, { bg: string; text: string; label: string }> = {
    success: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Sucesso" },
    partial: { bg: "bg-amber-50", text: "text-amber-700", label: "Parcial" },
    error: { bg: "bg-rose-50", text: "text-rose-700", label: "Erro" },
  };
  const s = map[status] || { bg: "bg-slate-50", text: "text-slate-600", label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

type Props = {
  onSyncAll?: () => Promise<void>;
  syncingAll?: boolean;
};

export default function CotacoesSyncConfig({ onSyncAll, syncingAll = false }: Props) {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<SyncConfig>("/api/admin/news/cotacoes/config");
      setConfig(data);
    } catch {
      // endpoint may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSyncNow = async () => {
    setMessage(null);
    try {
      if (onSyncAll) {
        await onSyncAll();
      }
      await load();
      setMessage({ type: "ok", text: "Sync executado." });
    } catch {
      setMessage({ type: "err", text: "Erro ao executar sync." });
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (!config) return null;

  const rt = config.runtime;
  const providerOk = config.cotacoes_provider_enabled;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Sincronização de Cotações</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Controlado por variáveis de ambiente no servidor.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${rt.enabled ? "bg-emerald-500" : "bg-slate-400"}`} />
          <span className="text-xs font-medium text-slate-700">
            {rt.enabled ? "Automático" : "Manual"}
          </span>
        </div>
      </div>

      {/* Provider warning */}
      {!providerOk && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Provider desabilitado (COTACOES_PROVIDER_ENABLED != true). O sync não buscará dados externos.
        </div>
      )}

      {/* Mode description */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {rt.enabled ? (
          <>
            Atualização automática ativa:{" "}
            <span className="font-semibold">{rt.cronExpr ? cronLabel(rt.cronExpr) : "—"}</span>.
            {" "}As cotações ativas são sincronizadas periodicamente com as fontes externas (BCB, Stooq).
          </>
        ) : (
          <>
            Modo manual ativo. As cotações só são atualizadas quando você clica em &quot;Atualizar&quot;.
            Para ativar automação, defina{" "}
            <code className="text-xs bg-white px-1 py-0.5 rounded border border-slate-200">
              COTACOES_SYNC_ENABLED=true
            </code>{" "}
            no .env do backend.
          </>
        )}
      </div>

      {/* Action */}
      <div>
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncingAll || rt.running}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
        >
          {syncingAll || rt.running ? "Sincronizando..." : "Executar sync agora"}
        </button>
      </div>

      {/* Feedback */}
      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          message.type === "ok"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-rose-50 text-rose-700 border border-rose-200"
        }`}>
          {message.text}
        </div>
      )}

      {/* Runtime status */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status operacional</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Modo ativo</p>
            <p className="text-slate-900 font-medium">{rt.enabled ? "Automático" : "Manual"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Frequência</p>
            <p className="text-slate-900 font-medium">{rt.cronExpr ? cronLabel(rt.cronExpr) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Última execução</p>
            <p className="text-slate-900 font-medium">{formatDate(rt.lastRunAt)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Último status</p>
            <div className="mt-0.5">{statusBadge(rt.lastStatus) || <span className="text-slate-400">—</span>}</div>
          </div>
        </div>

        {rt.lastReport && (
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
            <span>{rt.lastReport.total} cotações</span>
            <span className="text-emerald-600">{rt.lastReport.ok} OK</span>
            {rt.lastReport.error > 0 && (
              <span className="text-rose-600">{rt.lastReport.error} falhas</span>
            )}
            <span>{(rt.lastReport.durationMs / 1000).toFixed(1)}s</span>
          </div>
        )}

        {rt.lastError && (
          <p className="text-xs text-rose-600 mt-1">{rt.lastError}</p>
        )}
      </div>
    </div>
  );
}
