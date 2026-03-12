const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export function absUrl(raw?: string | null): string {
  if (!raw) return "/placeholder.png";

  let src = String(raw).trim().replace(/\\/g, "/");
  if (!src) return "/placeholder.png";

  // data URL
  if (src.startsWith("data:")) return src;

  // URL absoluta
  if (/^https?:\/\//i.test(src)) return src;

  // remove barras iniciais
  src = src.replace(/^\/+/, "");

  // já veio completo com uploads/
  if (src.startsWith("uploads/")) {
    return `${API}/${src}`;
  }

  // veio só a subpasta/arquivo, ex: products/x.jpg
  if (
    src.startsWith("products/") ||
    src.startsWith("colaboradores/") ||
    src.startsWith("logos/") ||
    src.startsWith("news/") ||
    src.startsWith("drones/")
  ) {
    return `${API}/uploads/${src}`;
  }

  // veio só nome de arquivo
  return `${API}/uploads/${src}`;
}