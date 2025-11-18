const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function absUrl(raw?: string | null): string {
  if (!raw) return '';
  const src = String(raw).trim().replace(/\\/g, '/');

  // já é absoluto?
  if (/^https?:\/\//i.test(src)) return src;

  // caminhos que já vêm com /uploads
  if (src.startsWith('/uploads')) return `${API}${src}`;
  if (src.startsWith('uploads')) return `${API}/${src}`;

  // se vier só o nome do arquivo, prefixa /uploads/
  const path = src.startsWith('/') ? src : `/uploads/${src}`;
  return `${API}${path}`;
}
