"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { calcRotaAlertas, type RotaResumo, type RotaStatus } from "@/lib/rotas/types";
import StaleRotasBanner from "./_components/StaleRotasBanner";
import RotaCard from "./_components/RotaCard";

const STATUS_OPTIONS: Array<{ value: RotaStatus | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "pronta", label: "Pronta" },
  { value: "em_rota", label: "Em rota" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
];

function todayIso() {
  // YYYY-MM-DD em LOCAL TIME (BRT), nao UTC. Mesmo motivo do
  // /admin/rotas/nova/page.tsx — toISOString() retorna UTC.
  return new Date().toLocaleDateString("en-CA");
}

export default function AdminRotasPage() {
  const [data, setData] = useState<RotaResumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroData, setFiltroData] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<RotaStatus | "">("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroData) params.set("data", filtroData);
      if (filtroStatus) params.set("status", filtroStatus);
      const url = `/api/admin/rotas${params.toString() ? `?${params.toString()}` : ""}`;
      const result = await apiClient.get<RotaResumo[]>(url);
      setData(result ?? []);
    } catch (err) {
      toast.error(formatApiError(err, "Falha ao carregar rotas.").message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroData, filtroStatus]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-primary">
            Rotas de Entrega
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {data.length} {data.length === 1 ? "rota" : "rotas"} listada
            {data.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/admin/rotas/nova"
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold text-sm"
        >
          + Nova rota
        </Link>
      </div>

      {/* Fase 4 — alerta de rotas paradas (em_rota sem update > 6h) */}
      <StaleRotasBanner />

      {/* Filtros */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center bg-dark-800 ring-1 ring-white/10 rounded-xl p-3">
        <div className="flex flex-col">
          <label
            htmlFor="filtro-data"
            className="text-[10px] font-semibold uppercase tracking-wide text-gray-400"
          >
            Data
          </label>
          <input
            id="filtro-data"
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="rounded-lg bg-dark-900 border border-white/10 px-3 py-1.5 text-sm text-white"
          />
        </div>
        <div className="flex flex-col">
          <label
            htmlFor="filtro-status"
            className="text-[10px] font-semibold uppercase tracking-wide text-gray-400"
          >
            Status
          </label>
          <select
            id="filtro-status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as RotaStatus | "")}
            className="rounded-lg bg-dark-900 border border-white/10 px-3 py-1.5 text-sm text-white"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button
            onClick={() => {
              setFiltroData(todayIso());
              setFiltroStatus("");
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
          >
            Hoje
          </button>
          <button
            onClick={() => {
              setFiltroData("");
              setFiltroStatus("");
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* KPIs operacionais agregados */}
      {!loading && data.length > 0 && <RotasKPIs rotas={data} />}

      {loading ? (
        <LoadingState message="Carregando rotas…" />
      ) : data.length === 0 ? (
        <EmptyState message="Nenhuma rota encontrada para o filtro atual." />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <RotaCard key={r.id} rota={r} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Strip de KPIs em cima da lista — operador entende a saude do dia
 * sem precisar percorrer cards.
 */
function RotasKPIs({ rotas }: { rotas: RotaResumo[] }) {
  const stats = useMemo(() => {
    const byStatus: Record<RotaStatus, number> = {
      rascunho: 0,
      pronta: 0,
      em_rota: 0,
      finalizada: 0,
      cancelada: 0,
    };
    let entregues = 0;
    let pendentes = 0;
    let problemas = 0;
    let comAlerta = 0;
    for (const r of rotas) {
      byStatus[r.status]++;
      entregues += Number(r.paradas_entregues) || 0;
      pendentes += Number(r.paradas_pendentes) || 0;
      problemas += Number(r.paradas_problema) || 0;
      if (calcRotaAlertas(r).some((a) => a.level !== "info")) comAlerta++;
    }
    return { byStatus, entregues, pendentes, problemas, comAlerta };
  }, [rotas]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <KPI label="Em rota" value={stats.byStatus.em_rota} accent="emerald" />
      <KPI label="Prontas" value={stats.byStatus.pronta} accent="primary" />
      <KPI
        label="Problemas"
        value={stats.problemas}
        accent={stats.problemas > 0 ? "rose" : "muted"}
      />
      <KPI
        label="Com alerta"
        value={stats.comAlerta}
        accent={stats.comAlerta > 0 ? "amber" : "muted"}
      />
    </div>
  );
}

function KPI({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "primary" | "emerald" | "rose" | "amber" | "muted";
}) {
  const tone = {
    primary: "text-primary",
    emerald: "text-emerald-300",
    rose: "text-rose-300",
    amber: "text-amber-300",
    muted: "text-gray-400",
  }[accent];
  return (
    <div className="rounded-xl bg-dark-800 ring-1 ring-white/10 px-4 py-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
        {label}
      </div>
      <div className={`text-xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}
