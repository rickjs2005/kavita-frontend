// src/utils/absUrl.ts
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export function absUrl(raw?: string | null): string {
  if (!raw) return "/placeholder.png"; // ✅ RETORNA PLACEHOLDER em vez de string vazia

  const src = String(raw).trim().replace(/\\/g, "/");
  if (!src) return "/placeholder.png"; // ✅ PLACEHOLDER aqui também

  // data URL
  if (src.startsWith("data:")) return src;

  // URL absoluta
  if (/^https?:\/\//i.test(src)) return src;

  // se começa com '/', prefixa com API sem /uploads/
  if (src.startsWith("/")) {
    return `${API}/${src.replace(/^\/+/, "")}`;
  }

  // se já vier uploads/...
  if (src.startsWith("uploads/")) {
    return `${API}/${src}`;
  }

  // se vier só nome de arquivo
  return `${API}/uploads/${src}`;
}