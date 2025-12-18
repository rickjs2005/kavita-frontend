// src/lib/api/http.ts
export type ApiErrorShape = {
  ok?: boolean;
  code?: string;
  message?: string;
  mensagem?: string;
  details?: any;
};

export async function apiPublic<T>(path: string, init?: RequestInit): Promise<T> {
  const base =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5000";

  const res = await fetch(`${base}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store", // público: sempre “fresco”; depois você pode trocar por revalidate
    ...init,
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as ApiErrorShape;
      msg = j?.message || j?.mensagem || msg;
    } catch {}
    throw new Error(msg);
  }

  return (await res.json()) as T;
}
