"use client";

import { useCallback, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";

type SyncConfig = {
  clima_sync_enabled: boolean;
  clima_sync_cron: string;
  clima_sync_delay_ms: number;
  runtime: {
    enabled: boolean;
    cronExpr: string | null;
    running: boolean;
    lastRunAt: string | null;
    lastStatus: "success" | "partial" | "error" | null;
    lastError: string | null;
    lastReport: {
      total: number;
      success: number;
      failed: number;
      durationMs: number;
    } | null;
  };
};

const CRON_PRESETS: { label: string; value: string }[] = [
  { label: "A cada 1 hora", value: "0 */1 * * *" },
  { label: "A cada 3 horas", value: "0 */3 * * *" },
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
    success: { bg: "bg-emerald-900/40", text: "text-emerald-300", label: "Sucesso" },
    partial: { bg: "bg-amber-900/40", text: "text-amber-300", label: "Parcial" },
    error: { bg: "bg-red-900/40", text: "text-red-300", label: "Erro" },
  };
  const s = map[status] || { bg: "bg-slate-700", text: "text-slate-300", label: status };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

export default function ClimaSyncConfig() {
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [cronExpr, setCronExpr] = useState("0 */3 * * *");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<SyncConfig>("/api/admin/news/clima/config");
      setConfig(data);
      setEnabled(data.clima_sync_enabled);
      setCronExpr(data.clima_sync_cron);
    } catch {
      // config table may not exist yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const data = await apiClient.put<SyncConfig>("/api/admin/news/clima/config", {
        clima_sync_enabled: enabled,
        clima_sync_cron: cronExpr,
      });
      setConfig(data);
      setMessage({ type: "ok", text: enabled ? "Modo automático ativado." : "Modo manual ativado." });
    } catch (err) {
      const ui = formatApiError(err, "Erro ao salvar configuração.");
      setMessage({ type: "err", text: ui.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      await apiClient.post("/api/admin/news/clima/sync-all");
      await load(); // refresh runtime state
      setMessage({ type: "ok", text: "Sync executado com sucesso." });
    } catch (err) {
      const ui = formatApiError(err, "Erro ao executar sync.");
      setMessage({ type: "err", text: ui.message });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-700" />
      </div>
    );
  }

  const rt = config?.runtime;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Configuração de Sync</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Controle como os dados de clima são atualizados.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${enabled ? "bg-emerald-400" : "bg-slate-500"}`} />
          <span className="text-xs font-medium text-slate-300">
            {enabled ? "Automático" : "Manual"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mode toggle */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Modo</label>
          <select
            value={enabled ? "auto" : "manual"}
            onChange={(e) => setEnabled(e.target.value === "auto")}
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="manual">Manual</option>
            <option value="auto">Automático</option>
          </select>
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">Frequência</label>
          <select
            value={cronExpr}
            onChange={(e) => setCronExpr(e.target.value)}
            disabled={!enabled}
            className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-slate-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {CRON_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {saving ? "Salvando..." : "Salvar configuração"}
        </button>
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing || rt?.running}
          className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50 transition"
        >
          {syncing || rt?.running ? "Sincronizando..." : "Executar sync agora"}
        </button>
      </div>

      {/* Feedback */}
      {message && (
        <div className={`rounded-lg px-3 py-2 text-sm ${
          message.type === "ok"
            ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/40"
            : "bg-red-900/30 text-red-300 border border-red-700/40"
        }`}>
          {message.text}
        </div>
      )}

      {/* Runtime status */}
      {rt && (
        <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status operacional</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-500">Modo ativo</p>
              <p className="text-slate-200 font-medium">{rt.enabled ? "Automático" : "Manual"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Frequência</p>
              <p className="text-slate-200 font-medium">{rt.cronExpr ? cronLabel(rt.cronExpr) : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Última execução</p>
              <p className="text-slate-200 font-medium">{formatDate(rt.lastRunAt)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Último status</p>
              <div className="mt-0.5">{statusBadge(rt.lastStatus) || <span className="text-slate-500">—</span>}</div>
            </div>
          </div>

          {rt.lastReport && (
            <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
              <span>{rt.lastReport.total} cidades</span>
              <span className="text-emerald-400">{rt.lastReport.success} OK</span>
              {rt.lastReport.failed > 0 && (
                <span className="text-red-400">{rt.lastReport.failed} falhas</span>
              )}
              <span>{(rt.lastReport.durationMs / 1000).toFixed(1)}s</span>
            </div>
          )}

          {rt.lastError && (
            <p className="text-xs text-red-400 mt-1">{rt.lastError}</p>
          )}
        </div>
      )}
    </div>
  );
}
