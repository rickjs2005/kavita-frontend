// src/data/absUrl.ts
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Devolve URL absoluta para qualquer caminho retornado pelo backend */
export default function absUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const src = String(raw).trim().replace(/\\/g, "/");

  // já é absoluto?
  if (/^https?:\/\//i.test(src)) return src;

  // caminhos comuns do backend
  if (src.startsWith("/uploads")) return `${API}${src}`;
  if (src.startsWith("uploads")) return `${API}/${src}`;

  // se vier só o filename, aponta para /uploads
  if (!src.startsWith("/")) return `${API}/uploads/${src}`;

  // último caso: prefixa API
  return `${API}${src}`;
}
