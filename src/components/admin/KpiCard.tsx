"use client";

import { ReactNode } from "react";

type KpiVariant = "default" | "success" | "warning" | "danger";

interface KpiCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  variant?: KpiVariant;
  className?: string;
}

export function KpiCard({
  label,
  value,
  helper,
  icon,
  variant = "default",
  className = "",
}: KpiCardProps) {
  const variantStyles: Record<KpiVariant, string> = {
    default:
      "border-slate-800 bg-slate-950/80 shadow-[0_10px_30px_rgba(15,23,42,0.55)]",
    success:
      "border-emerald-500/30 bg-gradient-to-br from-emerald-950/70 via-slate-950 to-slate-950",
    warning:
      "border-amber-500/30 bg-gradient-to-br from-amber-950/70 via-slate-950 to-slate-950",
    danger:
      "border-rose-500/30 bg-gradient-to-br from-rose-950/70 via-slate-950 to-slate-950",
  };

  const badgeStyles: Record<KpiVariant, string> = {
    default: "bg-slate-900/80 text-slate-300 border-slate-700/80",
    success: "bg-emerald-900/60 text-emerald-300 border-emerald-600/60",
    warning: "bg-amber-900/60 text-amber-200 border-amber-600/60",
    danger: "bg-rose-900/60 text-rose-200 border-rose-600/60",
  };

  return (
    <div
      className={`
        group flex flex-col justify-between rounded-2xl border px-4 py-4
        transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(0,0,0,0.75)]
        ${variantStyles[variant]} ${className}
      `}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </span>

          <span className="text-xl font-semibold text-slate-50 sm:text-2xl">
            {value}
          </span>
        </div>

        {icon && (
          <div
            className={`
              flex h-10 w-10 items-center justify-center rounded-2xl border text-lg
              shadow-inner backdrop-blur-sm
              ${badgeStyles[variant]}
            `}
          >
            {icon}
          </div>
        )}
      </div>

      {helper && (
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          {helper}
        </p>
      )}
    </div>
  );
}
