// src/utils/auth.ts
export function getCookie(name: string) {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function getAdminToken(): string | null {
  let t: string | null = null;
  try { t = localStorage.getItem('adminToken'); } catch {}
  if (!t) t = getCookie('adminToken');
  return t;
}
