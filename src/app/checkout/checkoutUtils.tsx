// Pure functions and shared icons for the checkout flow.
// No React state — safe to import anywhere including tests.

import type { ShippingRuleApplied } from "./checkoutTypes";

// ---------------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------------

export function toPositiveInt(value: unknown, fallback = 1): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.floor(n);
  return i > 0 ? i : fallback;
}

export function toId(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  return i > 0 ? i : null;
}

export function normalizeTipoLocalidade(v: unknown): "URBANA" | "RURAL" {
  const t = String(v || "URBANA").trim().toUpperCase();
  return t === "RURAL" ? "RURAL" : "URBANA";
}

export function formatCepLabel(cep?: string | null): string {
  const d = String(cep || "").replace(/\D/g, "").slice(0, 8);
  if (d.length !== 8) return String(cep || "");
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function ruleLabel(rule?: ShippingRuleApplied): string | null {
  if (!rule) return null;
  if (rule === "PRODUCT_FREE") return "Frete grátis por produto";
  if (rule === "CEP_RANGE") return "Frete por faixa de CEP";
  return "Frete por zona";
}

// ---------------------------------------------------------------------------
// SVG icons shared across checkout sections
// ---------------------------------------------------------------------------

export const CheckoutIcon = {
  user: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-5 0-9 2.5-9 5.5A1.5 1.5 0 0 0 4.5 21h15A1.5 1.5 0 0 0 21 19.5C21 16.5 17 14 12 14Z"
      />
    </svg>
  ),
  pin: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z"
      />
    </svg>
  ),
  card: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2ZM4 6h16v3H4Zm0 12v-7h16v7Z"
      />
    </svg>
  ),
  shield: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 2 4 5v6c0 5 3.4 9.7 8 11 4.6-1.3 8-6 8-11V5Z"
      />
    </svg>
  ),
  truck: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M3 6h11v7h-1.5A3.5 3.5 0 0 0 9 16.5 3.5 3.5 0 0 0 12.5 20H13a3 3 0 0 0 3-3h2a2 2 0 0 0 2-2V9h-3l-2-3H3Zm6 10.5A1.5 1.5 0 1 1 10.5 18 1.5 1.5 0 0 1 9 16.5Z"
      />
    </svg>
  ),
  ticket: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M3 6h18v4a2 2 0 0 1 0 4v4H3v-4a2 2 0 0 1 0-4Z"
      />
    </svg>
  ),
  store: () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M4 4h16l1 5a3 3 0 0 1-3 3h-1v8a1 1 0 0 1-1 1h-3v-7H11v7H8a1 1 0 0 1-1-1v-8H6A3 3 0 0 1 3 9Zm2 2-1 3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1l-1-3Z"
      />
    </svg>
  ),
};
