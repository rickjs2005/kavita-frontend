// src/utils/search.ts

/** clamp numérico */
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** parse "1,2,3" -> [1,2,3] */
export function parseIntList(csv: string | null): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/** converte number|string(DECIMAL) -> number */
export function toNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  if (typeof v === "string") {
    const s = v.trim().replace(",", ".");
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

/** converte query param (string) para number ou null */
export function toNumberParam(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function buildQueryString(params: {
  q?: string;
  categories?: number[];
  minPrice?: number | null;
  maxPrice?: number | null;
  promo?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
}) {
  const sp = new URLSearchParams();

  if (params.q && params.q.trim()) sp.set("q", params.q.trim());

  if (params.categories && params.categories.length > 0) {
    sp.set("categories", params.categories.join(","));

    // compat: quando for 1 categoria, manda também nos nomes comuns
    if (params.categories.length === 1) {
      const id = params.categories[0];
      sp.set("category", String(id));
      sp.set("category_id", String(id));
    }
  }

  if (typeof params.minPrice === "number") sp.set("minPrice", String(params.minPrice));
  if (typeof params.maxPrice === "number") sp.set("maxPrice", String(params.maxPrice));
  if (params.promo) sp.set("promo", "true");
  if (params.sort) sp.set("sort", params.sort);

  sp.set("page", String(params.page || 1));
  sp.set("limit", String(params.limit || 12));

  return sp.toString();
}
