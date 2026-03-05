"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DronesTabs from "@/components/admin/drones/DronesTabs";
import CloseButton from "@/components/buttons/CloseButton";
import { KpiCard } from "@/components/admin/KpiCard";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isAuthError(res: Response) {
  return res.status === 401 || res.status === 403;
}

function redirectToLogin() {
  if (typeof window !== "undefined") window.location.assign("/admin/login");
}

async function readSafe(res: Response) {
  const txt = await res.text();
  return { txt, data: safeJson(txt) };
}

type Kpis = {
  models: number;
  gallery: number;
  representatives: number;
  comments: number;
};

export default function AdminDronesPage() {
  const [kpis, setKpis] = useState<Kpis>({ models: 0, gallery: 0, representatives: 0, comments: 0 });
  const [kpisLoading, setKpisLoading] = useState(false);
  const [kpisMsg, setKpisMsg] = useState<string | null>(null);

  const loadKpis = useCallback(async () => {
    setKpisLoading(true);
    setKpisMsg(null);
    try {
      const [modelsRes, galleryRes, repsRes, commentsRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/drones/models?includeInactive=1`, { credentials: "include", cache: "no-store" }),
        fetch(`${API_BASE}/api/admin/drones/galeria`, { credentials: "include", cache: "no-store" }),
        fetch(`${API_BASE}/api/admin/drones/representantes?page=1&limit=1`, { credentials: "include", cache: "no-store" }),
        fetch(`${API_BASE}/api/admin/drones/comentarios?page=1&limit=1`, { credentials: "include", cache: "no-store" }),
      ]);

      if ([modelsRes, galleryRes, repsRes, commentsRes].some((r) => isAuthError(r))) {
        redirectToLogin();
        return;
      }

      const [modelsBody, galleryBody, repsBody, commentsBody] = await Promise.all([
        readSafe(modelsRes),
        readSafe(galleryRes),
        readSafe(repsRes),
        readSafe(commentsRes),
      ]);

      if (!modelsRes.ok) throw new Error(modelsBody?.data?.message || "Falha ao carregar modelos");
      if (!galleryRes.ok) throw new Error(galleryBody?.data?.message || "Falha ao carregar galeria");
      if (!repsRes.ok) throw new Error(repsBody?.data?.message || "Falha ao carregar representantes");
      if (!commentsRes.ok) throw new Error(commentsBody?.data?.message || "Falha ao carregar comentários");

      const modelsItems = Array.isArray(modelsBody.data?.items)
        ? modelsBody.data.items
        : Array.isArray(modelsBody.data)
          ? modelsBody.data
          : [];

      const galleryItems = Array.isArray(galleryBody.data?.items)
        ? galleryBody.data.items
        : Array.isArray(galleryBody.data)
          ? galleryBody.data
          : Array.isArray(galleryBody.data?.data)
            ? galleryBody.data.data
            : [];

      const repsTotal = Number(repsBody.data?.total || 0);
      const commentsTotal = Number(commentsBody.data?.total || 0);

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
      { label: "Modelos", value: kpis.models, helper: "Cadastrados no painel", variant: "success" as const },
      { label: "Itens na galeria", value: kpis.gallery, helper: "Vídeos e fotos", variant: "default" as const },
      { label: "Representantes", value: kpis.representatives, helper: "Lojas cadastradas", variant: "warning" as const },
      { label: "Comentários", value: kpis.comments, helper: "Total no painel", variant: "danger" as const },
    ],
    [kpis]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header sticky + responsivo */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile: voltar */}
            <div className="sm:hidden">
              <CloseButton className="text-slate-300 hover:text-white" />
            </div>

            <div>
              <p className="text-[11px] font-medium text-slate-400">Admin</p>
              <h1 className="text-lg font-extrabold sm:text-xl">Kavita Drones</h1>
              <p className="mt-0.5 hidden text-xs text-slate-400 sm:block">
                Configure landing, galeria, representantes e moderação de comentários.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadKpis}
              disabled={kpisLoading}
              className={[
                "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200",
                "hover:bg-white/10",
                kpisLoading ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              {kpisLoading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {kpisMsg ? (
          <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {kpisMsg}
          </div>
        ) : null}

        {/* KPIs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((c) => (
            <KpiCard key={c.label} label={c.label} value={c.value} helper={c.helper} variant={c.variant} />
          ))}
        </div>

        {/* Conteúdo */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-5">
          <DronesTabs />
        </div>
      </div>
    </div>
  );
}
