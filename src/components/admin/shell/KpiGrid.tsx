"use client";

import React from "react";

type KpiGridProps = {
  /**
   * Variante do grid:
   * - `default`: 1/2/4 colunas (mobile/sm/lg). Use com 3–4 KPIs.
   * - `wide`: 1/2/4/7 colunas (mobile/sm/lg/xl). Use com 5+ KPIs (ex: dashboard regional).
   *
   * Em mobile sempre `grid-cols-1` para evitar overflow horizontal:
   * a área útil em 320px (após paddings aninhados do shell + página + card)
   * é de ~240px, o que não acomoda 2 colunas com KPI cards p-3 + valor
   * `text-2xl tabular-nums` sem cortar.
   */
  variant?: "default" | "wide";
  className?: string;
  children: React.ReactNode;
};

export default function KpiGrid({
  variant = "default",
  className = "",
  children,
}: KpiGridProps) {
  const variantCls =
    variant === "wide"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
      : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid w-full min-w-0 gap-3 ${variantCls} ${className}`}>
      {children}
    </div>
  );
}
