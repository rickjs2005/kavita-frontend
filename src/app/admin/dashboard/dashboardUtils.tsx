// Pure functions and shared UI primitives for the admin dashboard.

import type { AlertNivel } from "./dashboardTypes";
import {
  formatNumber as _formatNumber,
  formatCurrency,
  formatDateShort,
  formatDateWithYear,
} from "@/utils/formatters";

// ---------------------------------------------------------------------------
// Formatters — delegam aos helpers centrais (utils/formatters) pra manter
// uma única fonte de verdade. Mantemos os nomes locais por compat com o
// resto do dashboard (varios componentes importam daqui).
// ---------------------------------------------------------------------------

export function formatNumber(n: number) {
  return _formatNumber(n);
}

export function formatMoney(n: number) {
  return formatCurrency(n);
}

export function formatShortDate(dateStr: string) {
  // Mantém o parsing manual local porque a entrada vem como "YYYY-MM-DD"
  // sem hora; new Date(yyyy-mm-dd) interpreta como UTC e desloca o dia.
  const [y, m, d] = dateStr.split("-").map((v) => parseInt(v, 10));
  const dt = new Date(y || 2000, (m || 1) - 1, d || 1);
  return formatDateShort(dt);
}

export function formatLogDate(dateStr: string) {
  return formatDateWithYear(dateStr) || "—";
}

export function calcVariation(current: number, previous: number): number | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
}

export function formatVariation(variation: number | null): string {
  if (variation === null) return "";
  const sign = variation >= 0 ? "+" : "";
  return `${sign}${variation.toFixed(1)}%`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export function getAlertColors(nivel: AlertNivel) {
  switch (nivel) {
    case "danger":
      return {
        badge: "bg-rose-500/10 text-rose-300 border border-rose-500/60",
        dot: "bg-rose-500",
      };
    case "warning":
      return {
        badge: "bg-amber-500/10 text-amber-200 border border-amber-500/60",
        dot: "bg-amber-400",
      };
    default:
      return {
        badge: "bg-sky-500/10 text-sky-200 border border-sky-500/60",
        dot: "bg-sky-400",
      };
  }
}

// ---------------------------------------------------------------------------
// Shared UI atoms (used in multiple sections)
// ---------------------------------------------------------------------------

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" }) {
  const base =
    "inline-block animate-spin rounded-full border-2 border-emerald-400 border-t-transparent";
  const sizes = size === "sm" ? "h-4 w-4 border-[1.5px]" : "h-5 w-5 border-2";
  return <span className={`${base} ${sizes}`} aria-hidden="true" />;
}

// Recharts passes arbitrary props dynamically — intentionally typed as any.
export function SalesTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value: number = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs text-slate-50 shadow-xl">
      <div className="font-medium text-emerald-300">{label}</div>
      <div className="mt-1 text-[11px] text-slate-300">
        Faturamento:{" "}
        <span className="font-semibold text-emerald-400">
          {formatMoney(value)}
        </span>
      </div>
    </div>
  );
}
