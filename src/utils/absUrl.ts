// No browser, API_BASE vira "" — caminhos como "/uploads/..." ficam
// relativos ao host acessado, passando pelo rewrite do next.config.ts
// que faz proxy pro backend. Isso evita cross-origin: o cookie de auth
// fica no mesmo domínio (localhost OU IP da rede) sem SameSite=None.
//
// No server (RSC, SSR), mantém a URL absoluta do backend — o server
// não tem "host acessado" pra herdar, precisa apontar direto.
const IS_SERVER = typeof window === "undefined";

export const API_BASE = IS_SERVER
  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(
      /\/+$/,
      "",
    )
  : "";

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