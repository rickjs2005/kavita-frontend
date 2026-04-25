"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import toast from "react-hot-toast";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RotaResumo, RotaStatus } from "@/lib/rotas/types";
import { RotaStatusBadge } from "./_components/StatusBadge";

const STATUS_OPTIONS: Array<{ value: RotaStatus | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "pronta", label: "Pronta" },
  { value: "em_rota", label: "Em rota" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
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

      {loading ? (
        <LoadingState message="Carregando rotas…" />
      ) : data.length === 0 ? (
        <EmptyState message="Nenhuma rota encontrada para o filtro atual." />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <Link
              key={r.id}
              href={`/admin/rotas/${r.id}`}
              className="block rounded-xl bg-dark-800 ring-1 ring-white/10 hover:ring-primary/40 p-4 transition"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-semibold">
                      Rota #{r.id}
                    </span>
                    <RotaStatusBadge status={r.status} />
                    <span className="text-xs text-gray-400">
                      📅 {r.data_programada}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {r.regiao_label || "Sem região"}
                    {r.motorista_nome ? ` · 🧑‍✈️ ${r.motorista_nome}` : " · Sem motorista"}
                    {r.veiculo ? ` · 🚗 ${r.veiculo}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1 text-xs text-gray-300">
                  <div>
                    {r.total_entregues}/{r.total_paradas}{" "}
                    {r.total_paradas === 1 ? "entrega" : "entregas"}
                  </div>
                  {r.tempo_total_minutos != null && (
                    <div className="text-gray-500">
                      ⏱ {Math.floor(r.tempo_total_minutos / 60)}h
                      {String(r.tempo_total_minutos % 60).padStart(2, "0")}min
                    </div>
                  )}
                  {(r.km_real ?? r.km_estimado) && (
                    <div className="text-gray-500">
                      🛣 {r.km_real ? `${r.km_real} km` : `~${r.km_estimado} km`}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
