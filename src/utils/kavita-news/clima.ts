export function normalizeSlug(s: string) {
  return (s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function toNumberOrNull(v: string) {
  const t = (v ?? "").trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function formatDateTimeBR(iso?: string | null) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function parseIbgeId(v: string): number | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseStationCode(v: string): string | null {
  const t = (v ?? "").trim().toUpperCase();
  if (!t) return null;
  // mantém padrão “A827”, mas você pode relaxar depois
  if (!/^[A-Z]\d{3}$/.test(t)) return null;
  return t;
}
