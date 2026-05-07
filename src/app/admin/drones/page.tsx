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
  pendingComments: number;
  newLeads: number;
  activeCases: number;
};

export default function AdminDronesPage() {
  const [kpis, setKpis] = useState<Kpis>({
    models: 0,
    gallery: 0,
    representatives: 0,
    comments: 0,
    pendingComments: 0,
    newLeads: 0,
    activeCases: 0,
  });
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpisMsg, setKpisMsg] = useState<string | null>(null);

  const loadKpis = useCallback(async () => {
    setKpisLoading(true);
    setKpisMsg(null);
    try {
      const [
        modelsData,
        galleryData,
        repsData,
        commentsData,
        pendingCommentsData,
        leadsData,
        casesData,
      ] = await Promise.all([
        apiClient.get<any>("/api/admin/drones/models?includeInactive=1"),
        apiClient.get<any>("/api/admin/drones/galeria"),
        apiClient.get<any>("/api/admin/drones/representantes?page=1&limit=1"),
        apiClient.get<any>("/api/admin/drones/comentarios?page=1&limit=1"),
        apiClient.get<any>("/api/admin/drones/comentarios?page=1&limit=1&status=PENDENTE"),
        apiClient.get<any>("/api/admin/drones/leads?page=1&limit=1&status=NOVO"),
        apiClient.get<any>("/api/admin/drones/cases"),
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
      const pendingCommentsTotal = Number(pendingCommentsData?.total || 0);
      const newLeadsTotal = Number(leadsData?.total || 0);

      const casesItemsAll = Array.isArray(casesData?.items) ? casesData.items : [];
      const activeCasesCount = casesItemsAll.filter(
        (c: { is_active?: number }) => Number(c.is_active ?? 1) === 1,
      ).length;

      setKpis({
        models: modelsItems.length,
        gallery: galleryItems.length,
        representatives: Number.isFinite(repsTotal) ? repsTotal : 0,
        comments: Number.isFinite(commentsTotal) ? commentsTotal : 0,
        pendingComments: Number.isFinite(pendingCommentsTotal)
          ? pendingCommentsTotal
          : 0,
        newLeads: Number.isFinite(newLeadsTotal) ? newLeadsTotal : 0,
        activeCases: activeCasesCount,
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
        label: "Leads novos",
        value: kpis.newLeads,
        helper: "Aguardando contato",
        variant: "warning" as const,
      },
      {
        label: "Comentários pendentes",
        value: kpis.pendingComments,
        helper: "Aguardando moderação",
        variant: "danger" as const,
      },
      {
        label: "Cases ativos",
        value: kpis.activeCases,
        helper: "Publicados na landing",
        variant: "success" as const,
      },
      {
        label: "Modelos ativos",
        value: kpis.models,
        helper: "DJI Agras cadastrados",
        variant: "success" as const,
      },
      {
        label: "Representantes",
        value: kpis.representatives,
        helper: "Lojas autorizadas",
        variant: "default" as const,
      },
    ],
    [kpis],
  );

  return (
    <div className="min-h-screen bg-[#0A0E14] text-slate-100">
      {/* Header limpo, sem blur excessivo */}
      <div className="sticky top-0 z-30 border-b border-white/8 bg-[#0A0E14]/95 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-4 sm:px-7">
          <AdminPageHeader
            kicker="Admin"
            title="Kavita Drones"
            subtitle="Painel operacional do módulo — leads, conteúdo, moderação e configuração."
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
                  "inline-flex w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 sm:w-auto",
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

      <div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-7">
        {kpisMsg ? (
          <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
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

        {/* Workspace — sem caixa adicional, ar mais natural */}
        <div className="mt-6">
          <DronesTabs
            pendingComments={kpis.pendingComments}
            newLeads={kpis.newLeads}
          />
        </div>
      </div>
    </div>
  );
}
