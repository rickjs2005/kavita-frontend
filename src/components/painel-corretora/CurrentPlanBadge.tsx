"use client";

// src/components/painel-corretora/CurrentPlanBadge.tsx
//
// Badge discreto do plano atual da corretora. Aparece no hero do
// dashboard. CTA sutil para /pricing quando plano = Free.

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";

type PlanContext = {
  plan: {
    slug: string;
    name: string;
    price_cents: number;
  };
  status: string;
};

export function CurrentPlanBadge() {
  const [ctx, setCtx] = useState<PlanContext | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get<PlanContext>("/api/corretora/plan");
        setCtx(data);
      } catch {
        // silent
      }
    })();
  }, []);

  if (!ctx) return null;

  const isFree = ctx.plan.slug === "free";

  return (
    <Link
      href="/pricing"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
        isFree
          ? "bg-white/[0.04] text-stone-300 ring-1 ring-white/10 hover:bg-white/[0.08] hover:text-amber-200"
          : "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/40 hover:bg-amber-500/20"
      }`}
      title={isFree ? "Ver planos pagos" : "Gerenciar assinatura"}
    >
      <span aria-hidden>{isFree ? "☕" : "⭐"}</span>
      Plano {ctx.plan.name}
      {isFree && <span className="ml-0.5 opacity-70">· Upgrade</span>}
    </Link>
  );
}
