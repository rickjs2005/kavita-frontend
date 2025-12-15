// src/utils/absUrl.ts
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function absUrl(raw?: string | null): string {
  if (!raw) return "";

  const src = String(raw).trim().replace(/\\/g, "/");
  if (!src) return "";

  // data url
  if (src.startsWith("data:")) return src;

  // absoluto
  if (/^https?:\/\//i.test(src)) return src;

  // já veio com / (qualquer caminho)
  if (src.startsWith("/")) return `${API}${src}`;

  // caminhos comuns
  if (src.startsWith("uploads")) return `${API}/${src}`;

  // fallback: assume uploads/filename
  return `${API}/uploads/${src}`;
}
