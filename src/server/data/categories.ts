// src/server/data/categories.ts
import "server-only";

const API_BASE =
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:5000";

export type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  is_active?: 0 | 1 | boolean;
  sort_order?: number;
  total_products?: number;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Erro ao carregar categorias (${res.status}): ${text.slice(0, 200)}`);
  }

  return (await res.json()) as T;
}

export async function fetchPublicCategories(): Promise<PublicCategory[]> {
  const base = String(API_BASE).replace(/\/$/, "");

  // Fallbacks para não quebrar se mudar rota PT/EN
  const tryUrls = [
    `${base}/api/public/categorias`,
    `${base}/api/categorias`,
    `${base}/api/public/categories`,
    `${base}/api/categories`,
  ];

  let lastErr: unknown = null;

  for (const url of tryUrls) {
    try {
      const data = await fetchJson<any>(url);

      const arr: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.categories)
          ? data.categories
          : Array.isArray(data?.data)
            ? data.data
            : [];

      const onlyActive = arr.filter(
        (c) => c?.is_active === undefined || c?.is_active === 1 || c?.is_active === true
      );

      onlyActive.sort((a, b) => {
        const sa = a?.sort_order ?? 0;
        const sb = b?.sort_order ?? 0;
        if (sa !== sb) return sa - sb;
        const na = String(a?.name ?? "");
        const nb = String(b?.name ?? "");
        return na.localeCompare(nb);
      });

      return onlyActive as PublicCategory[];
    } catch (err) {
      lastErr = err;
      continue;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    throw lastErr instanceof Error ? lastErr : new Error("Falha ao buscar categorias.");
  }
  return [];
}
