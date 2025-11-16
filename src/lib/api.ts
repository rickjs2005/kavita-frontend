export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "include",
    ...init,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      msg = (j as any)?.mensagem || (j as any)?.message || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}
