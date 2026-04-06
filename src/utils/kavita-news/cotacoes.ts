// src/utils/kavita-news/cotacoes.ts
//
// Canonical utilities for the cotações module.
// All formatting/helper functions live here — do NOT duplicate in components.

export const ALLOWED_SLUGS = [
  "dolar",
  "cafe-arabica",
  "cafe-robusta",
  "soja",
  "milho",
  "boi-gordo",
] as const;

// ─── Number helpers ─────────────────────────────────────────────────────────

/** Safely converts any value to number or null. */
export function safeNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/**
 * Formats a number with fixed decimal places.
 * Returns "—" for null/undefined/empty/non-finite values.
 * Handles comma-as-decimal (Portuguese input).
 */
export function fmtNum(v: any, digits = 4): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return String(v);
  return n.toFixed(digits);
}

// ─── Price formatting ───────────────────────────────────────────────────────

/**
 * Formats a price value in pt-BR locale (e.g. "1.234,56").
 * Returns "-" for null/undefined/empty, String(v) for non-numeric.
 */
export function formatPrice(v: any): string {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Returns true if the price value is present and valid.
 * Use to distinguish "no price yet" from "price is 0".
 */
export function hasPrice(v: any): boolean {
  if (v === null || v === undefined || v === "") return false;
  const n = Number(v);
  return !Number.isNaN(n);
}

// ─── Percentage formatting ──────────────────────────────────────────────────

/**
 * Formats a percentage value with sign prefix (e.g. "+2.35%", "-1.20%").
 * Returns "-" for null.
 */
export function formatPct(v: number | null): string {
  if (v === null) return "-";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

// ─── Date formatting ────────────────────────────────────────────────────────

/**
 * Formats an ISO date string in pt-BR locale.
 * @param timeDetail - "short" (e.g. 14:30) or "medium" (e.g. 14:30:00). Default: "short".
 * Returns "—" for falsy/empty, the raw string for invalid dates.
 */
export function formatDatePtBR(
  value?: string | null,
  timeDetail: "short" | "medium" = "short",
): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: timeDetail,
  }).format(d);
}

/**
 * @deprecated Use formatDatePtBR instead. Kept for backward compatibility
 * with admin table that imports this name.
 */
export function formatDateTimeBR(v?: string | null): string {
  return formatDatePtBR(v, "short");
}

// ─── Emoji helpers ──────────────────────────────────────────────────────────

/**
 * Returns a market-themed emoji based on the cotação's metadata.
 * Uses heuristic matching on slug, name, group_key, market, type.
 */
export function getMarketEmoji(item: {
  slug?: string | null;
  name?: string | null;
  group_key?: string | null;
  market?: string | null;
  type?: string | null;
}): string {
  const hay =
    `${item.slug ?? ""} ${item.name ?? ""} ${item.group_key ?? ""} ${item.market ?? ""} ${item.type ?? ""}`.toLowerCase();

  if (hay.includes("cafe") || hay.includes("café")) return "☕";
  if (hay.includes("milho")) return "🌽";
  if (hay.includes("soja")) return "🫘";
  if (hay.includes("boi") || hay.includes("arroba") || hay.includes("gordo"))
    return "🐂";
  if (hay.includes("dolar") || hay.includes("dólar") || hay.includes("usd"))
    return "💵";

  return "🏷";
}
