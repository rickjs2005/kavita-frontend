"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DronesTabs from "@/components/admin/drones/DronesTabs";
import CloseButton from "@/components/buttons/CloseButton";
import { KpiCard } from "@/components/admin/KpiCard";
import AdminPageHeader from "@/components/admin/shell/AdminPageHeader";
import KpiGrid from "@/components/admin/shell/KpiGrid";
import apiClient from "@/lib/apiClient";

type Kpis = {
  models: number;
  gallery: number;
  representatives: number;
  comments: number;
};

export default function AdminDronesPage() {
  const [kpis, setKpis] = useState<Kpis>({
    models: 0,
    gallery: 0,
    representatives: 0,
    comments: 0,
  });
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpisMsg, setKpisMsg] = useState<string | null>(null);

  const loadKpis = useCallback(async () => {
    setKpisLoading(true);
    setKpisMsg(null);
    try {
      const [modelsData, galleryData, repsData, commentsData] =
        await Promise.all([
          apiClient.get<any>("/api/admin/drones/models?includeInactive=1"),
          apiClient.get<any>("/api/admin/drones/galeria"),
          apiClient.get<any>("/api/admin/drones/representantes?page=1&limit=1"),
          apiClient.get<any>("/api/admin/drones/comentarios?page=1&limit=1"),
        ]);

      const modelsItems = Array.isArray(modelsData?.items)
        ? modelsData.items
        : Array.isArray(modelsData)
          ? modelsData
          : [];

      const galleryItems = Array.isArray(galleryData?.items)
        ? galleryData.items
        : Array.isArray(galleryData)
          ? galleryData
          : Array.isArray(galleryData?.data)
            ? galleryData.data
            : [];

      const repsTotal = Number(repsData?.total || 0);
      const commentsTotal = Number(commentsData?.total || 0);

      setKpis({
        models: modelsItems.length,
        gallery: galleryItems.length,
        representatives: Number.isFinite(repsTotal) ? repsTotal : 0,
        comments: Number.isFinite(commentsTotal) ? commentsTotal : 0,
      });
    } catch (e: any) {
      setKpisMsg(e?.message || "Erro ao carregar KPIs.");
    } finally {
      setKpisLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  const kpiCards = useMemo(
    () => [
      {
        label: "Modelos",
        value: kpis.models,
        helper: "Cadastrados no painel",
        variant: "success" as const,
      },
      {
        label: "Itens na galeria",
        value: kpis.gallery,
        helper: "Vídeos e fotos",
        variant: "default" as const,
      },
      {
        label: "Representantes",
        value: kpis.representatives,
        helper: "Lojas cadastradas",
        variant: "warning" as const,
      },
      {
        label: "Comentários",
        value: kpis.comments,
        helper: "Total no painel",
        variant: "danger" as const,
      },
    ],
    [kpis],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header sticky + responsivo */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
          <AdminPageHeader
            kicker="Admin"
            title="Kavita Drones"
            subtitle="Configure landing, galeria, representantes e moderação de comentários."
            actions={
              <div className="sm:hidden">
                <CloseButton className="text-slate-300 hover:text-white" />
              </div>
            }
            primaryAction={
              <button
                type="button"
                onClick={loadKpis}
                disabled={kpisLoading}
                className={[
                  "inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200",
                  "hover:bg-white/10",
                  kpisLoading ? "cursor-not-allowed opacity-60" : "",
                ].join(" ")}
              >
                {kpisLoading ? "Atualizando..." : "Atualizar"}
              </button>
            }
          />
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {kpisMsg ? (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {kpisMsg}
          </div>
        ) : null}

        {/* KPIs */}
        <KpiGrid>
          {kpiCards.map((c) => (
            <KpiCard
              key={c.label}
              label={c.label}
              value={c.value}
              helper={c.helper}
              variant={c.variant}
            />
          ))}
        </KpiGrid>

        {/* Conteúdo */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-5">
          <DronesTabs />
        </div>
      </div>
    </div>
  );
}
