// src/lib/absUrl.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function absUrl(p?: string | null) {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;

  // se vier só o nome do arquivo, prefixa /uploads
  const path = p.startsWith("/uploads/") ? p : `/uploads/${p}`;
  return `${API_BASE}${path}`;
}
