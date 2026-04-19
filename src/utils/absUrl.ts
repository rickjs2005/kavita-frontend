// API_BASE sempre vazio — caminhos como "/uploads/..." ficam relativos
// ao host acessado em qualquer ambiente (SSR + browser). O next.config.ts
// faz rewrite interno pro backend, então o browser requisita
// http://<host-acessado>/uploads/... e o Next proxy pro Express.
//
// Antes era "" no browser e "http://localhost:5000" no server — isso
// causava hydration mismatch em <img src={absUrl(...)}>: o HTML do SSR
// trazia URL absoluta e o hydrate esperava relativa. Agora é consistente.
//
// Para SEO (JSON-LD, metadata OG) que precisa de URL absoluta real,
// use `absoluteUrl()` abaixo — resolve via NEXT_PUBLIC_SITE_URL (ou o
// NEXT_PUBLIC_API_URL como fallback em dev).
export const API_BASE = "";

export function absUrl(raw?: string | null): string {
  if (!raw) return "/placeholder.png";

  let src = String(raw).trim().replace(/\\/g, "/");
  if (!src) return "/placeholder.png";

  // data URL — passthrough
  if (src.startsWith("data:")) return src;

  // URL absoluta — passthrough
  if (/^https?:\/\//i.test(src)) return src;

  // remove barras iniciais
  src = src.replace(/^\/+/, "");

  // já veio completo com uploads/
  if (src.startsWith("uploads/")) return `${API_BASE}/${src}`;

  // veio só a subpasta/arquivo, ex: products/x.jpg
  if (
    src.startsWith("products/") ||
    src.startsWith("colaboradores/") ||
    src.startsWith("logos/") ||
    src.startsWith("news/") ||
    src.startsWith("drones/") ||
    src.startsWith("hero/") ||
    src.startsWith("services/") ||
    src.startsWith("corretoras/")
  ) {
    return `${API_BASE}/uploads/${src}`;
  }

  // veio só nome de arquivo
  return `${API_BASE}/uploads/${src}`;
}

// ─── URL absoluta para SEO (JSON-LD, OG image, canonical) ───────────────────
// Casos onde o consumidor precisa de http(s)://...: structured data do
// Google, web crawlers, og:image compartilhado externamente. Usa o
// NEXT_PUBLIC_SITE_URL (origem pública do frontend) como base, com
// fallback para localhost em dev.
const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"
).replace(/\/+$/, "");

export function absoluteUrl(raw?: string | null): string {
  const rel = absUrl(raw);
  if (/^https?:\/\//i.test(rel) || rel.startsWith("data:")) return rel;
  return `${SITE_ORIGIN}${rel.startsWith("/") ? "" : "/"}${rel}`;
}