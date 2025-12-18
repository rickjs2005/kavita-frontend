export const ALLOWED_SLUGS = [
  "dolar",
  "cafe-arabica",
  "cafe-robusta",
  "soja",
  "milho",
  "boi-gordo",
  "boi-gordo-futuro",
  "milho-futuro",
  "soja-futuro",
  "cafe-arabica-futuro",
] as const;

export function formatDateTimeBR(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("pt-BR");
}

export function fmtNum(v: any, digits = 4) {
  if (v === null || v === undefined || v === "") return "—";
  const n = Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) return String(v);
  return n.toFixed(digits);
}
