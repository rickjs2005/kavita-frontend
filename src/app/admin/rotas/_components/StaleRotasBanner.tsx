"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import type { StaleRotaResult } from "@/lib/rotas/types";

/**
 * Fase 4 — banner que aparece no /admin/rotas quando ha rotas em
 * andamento sem update ha mais de N horas (default 6h, configuravel
 * via env ROTA_STALE_HOURS no backend).
 *
 * Read-only. Click no card abre a rota correspondente.
 * Falha silenciosa (sem banner) se endpoint indisponivel.
 */
export default function StaleRotasBanner() {
  const [data, setData] = useState<StaleRotaResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    apiClient
      .get<StaleRotaResult>("/api/admin/rotas/stale")
      .then(setData)
      .catch(() => {
        // Falha silenciosa — banner some.
      });
  }, []);

  if (!data || data.count === 0) return null;

  return (
    <div className="rounded-xl bg-amber-500/10 ring-1 ring-amber-500/40 p-3 sm:p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-amber-300 text-lg" aria-hidden>
            ⚠️
          </span>
          <p className="text-sm text-amber-100 font-semibold">
            {data.count}{" "}
            {data.count === 1 ? "rota parada" : "rotas paradas"} há mais de{" "}
            {data.threshold_hours}h sem atualização
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-amber-200 underline hover:text-amber-100"
        >
          {expanded ? "Ocultar detalhes" : "Ver detalhes"}
        </button>
      </div>

      {expanded && (
        <ul className="space-y-1 pt-1">
          {data.items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/admin/rotas/${r.id}`}
                className="text-xs text-amber-100 hover:text-white underline"
              >
                Rota #{r.id}
                {r.motorista_nome ? ` · ${r.motorista_nome}` : ""}
                {" — "}
                {r.total_entregues}/{r.total_paradas} entregas, parada há{" "}
                {r.horas_paradas}h
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
