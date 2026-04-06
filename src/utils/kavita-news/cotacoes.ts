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

// ─── Trend description ──────────────────────────────────────────────────────

/**
 * Returns a human-readable trend phrase based on variation_day percentage.
 * Designed for producers — plain Portuguese, not financial jargon.
 */
export function describeTrend(variation: number | null): string {
  if (variation === null) return "Sem variação disponível";
  if (variation > 3) return "Alta expressiva no dia";
  if (variation > 1) return "Alta moderada no dia";
  if (variation > 0.3) return "Leve alta no dia";
  if (variation >= -0.3) return "Estável no dia";
  if (variation >= -1) return "Leve queda no dia";
  if (variation >= -3) return "Queda moderada no dia";
  return "Queda expressiva no dia";
}

// ─── Local unit conversion ──────────────────────────────────────────────────

/**
 * Conversion factors from international units to Brazilian local units.
 * - Café: 1 saca = 60 kg = 132.277 lb
 * - Soja/Milho: 1 saca = 60 kg; 1 bu soja ≈ 27.216 kg; 1 bu milho ≈ 25.401 kg
 * - Boi: 1 cwt = 100 lb ≈ 45.359 kg; 1 arroba = 15 kg
 */
const LOCAL_UNIT_MAP: Record<string, { factor: number; label: string }> = {
  "cafe-arabica": { factor: 132.277, label: "saca 60kg" },   // R$/lb × 132.277 = R$/saca
  "cafe-robusta": { factor: 0.06, label: "saca 60kg" },      // R$/ton × 0.06 = R$/saca (60kg / 1000kg)
  soja: { factor: 2.2046, label: "saca 60kg" },              // R$/bu × 2.2046 = R$/saca
  milho: { factor: 2.3622, label: "saca 60kg" },             // R$/bu × 2.3622 = R$/saca
  "boi-gordo": { factor: 1 / 3.024, label: "@" },            // R$/cwt ÷ 3.024 = R$/@
};

/**
 * Converts the BRL price to the local Brazilian unit (saca, arroba).
 * Returns null if no conversion is available for the slug.
 */
export function convertToLocalUnit(
  price: number,
  slug: string,
): { value: number; label: string } | null {
  const mapping = LOCAL_UNIT_MAP[slug];
  if (!mapping) return null;
  return {
    value: Math.round(price * mapping.factor * 100) / 100,
    label: mapping.label,
  };
}

// ─── Source simplification ──────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, string> = {
  "cafe-arabica": "ICE/Nova York",
  "cafe-robusta": "ICE/Londres",
  soja: "CME/Chicago",
  milho: "CME/Chicago",
  "boi-gordo": "CME/Chicago",
  dolar: "BCB",
};

/**
 * Returns a simplified, human-readable source label for the producer.
 * Falls back to the raw source string if no mapping exists.
 */
export function simplifySource(slug?: string | null, rawSource?: string | null): string {
  if (slug && SOURCE_LABELS[slug]) return SOURCE_LABELS[slug];
  if (rawSource) return rawSource;
  return "-";
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
