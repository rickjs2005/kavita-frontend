// src/utils/absUrl.ts
const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export function absUrl(raw?: string | null): string {
  if (!raw) return "";

  let src = String(raw).trim().replace(/\\/g, "/");
  if (!src) return "";

  // data URL
  if (src.startsWith("data:")) return src;

  // URL absoluta
  if (/^https?:\/\//i.test(src)) return src;

  // remove múltiplas barras no começo
  src = src.replace(/^\/+/, "");

  // se já vier uploads/...
  if (src.startsWith("uploads/")) {
    return `${API}/${src}`;
  }

  // se vier só nome de arquivo
  return `${API}/uploads/${src}`;
}