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

// Asset estático servido por Next/public, NÃO pelo backend.
// Mover para /images/ evita o caminho legado "/uploads/placeholder.png"
// que aparecia quando alguém passava o nome cru "placeholder.png" para
// `absUrl` — o algoritmo prefixava /uploads/ e o backend não tem esse
// arquivo, gerando o erro do Next/Image:
//   "isn't a valid image for /uploads/placeholder.png received null".
export const PLACEHOLDER_IMAGE = "/images/placeholder.png";

// Pastas servidas estaticamente pelo Next (public/), portanto NÃO devem
// receber prefixo /uploads/. Mantido como Set para lookup O(1).
const PUBLIC_ASSET_PREFIXES = ["images/", "icons/"];

export function absUrl(raw?: string | null): string {
  if (!raw) return PLACEHOLDER_IMAGE;

  let src = String(raw).trim().replace(/\\/g, "/");
  if (!src) return PLACEHOLDER_IMAGE;

  // data URL — passthrough
  if (src.startsWith("data:")) return src;

  // URL absoluta — passthrough
  if (/^https?:\/\//i.test(src)) return src;

  // remove barras iniciais
  src = src.replace(/^\/+/, "");

  // Asset estático do front (pasta public). Nunca prefixar com /uploads/.
  if (PUBLIC_ASSET_PREFIXES.some((p) => src.startsWith(p))) {
    return `/${src}`;
  }

  // Nome literal do placeholder (com ou sem barra). Caso clássico em que
  // o backend devolvia "placeholder.png" como default — antes era
  // transformado em /uploads/placeholder.png e quebrava o Next/Image.
  if (src === "placeholder.png" || src === "images/placeholder.png") {
    return PLACEHOLDER_IMAGE;
  }

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

// Garante uma string utilizável como `src` de <Image>/<img> mesmo se o
// chamador esquecer de tratar null/undefined/"". Use como wrapper
// explícito quando o componente não puder confiar no formato do dado.
//
// Diferença para `absUrl`: nunca lança, nunca devolve string vazia,
// nunca devolve URL relativa quebrada (ex.: "uploads/" sem nome). Para
// strings já válidas (http(s), data:, /images/...) faz passthrough via
// absUrl. Para o placeholder ("placeholder.png"), retorna a versão
// /images/placeholder.png — evitando a regressão histórica.
export function getSafeImageSrc(value?: string | null): string {
  if (value == null) return PLACEHOLDER_IMAGE;
  const trimmed = String(value).trim();
  if (!trimmed) return PLACEHOLDER_IMAGE;
  const resolved = absUrl(trimmed);
  // Defensivo: se por algum motivo absUrl retornar string vazia ou
  // terminar com "/uploads/" (sem nome), cai no placeholder.
  if (!resolved || resolved.endsWith("/uploads/")) return PLACEHOLDER_IMAGE;
  return resolved;
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
