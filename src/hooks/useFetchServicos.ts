// src/hooks/useFetchServicos.ts
"use client";

import useSWR from "swr";
import { apiFetch } from "@/lib/apiClient";
import { handleApiError } from "@/lib/handleApiError";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Params = {
  q?: string;
  especialidade?: string | number | null;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
};

type AnyObj = Record<string, any>;

type ApiListResponse<T> = {
  data?: T[];
  items?: T[];
  results?: T[];
  servicos?: T[];
  rows?: T[];
  total?: number;
  totalPages?: number;
  page?: number;
  meta?: {
    total?: number;
    totalPages?: number;
    page?: number;
    [k: string]: any;
  };
  [k: string]: any;
};

function pickList<T>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];

  const p = payload as AnyObj;

  const directKeys = ["data", "items", "results", "servicos", "rows"];
  for (const k of directKeys) {
    if (Array.isArray(p?.[k])) return p[k] as T[];
  }

  // casos tipo { data: { items: [...] } } etc.
  if (p?.data && typeof p.data === "object") {
    for (const k of directKeys) {
      if (Array.isArray(p.data?.[k])) return p.data[k] as T[];
    }
  }

  return [];
}

function pickMeta(payload: any, fallbackPage: number) {
  const p = (payload || {}) as AnyObj;

  const metaFromMeta = p?.meta || p?.data?.meta;
  const total =
    Number(metaFromMeta?.total ?? p?.total ?? p?.data?.total ?? 0) || 0;

  const totalPages =
    Number(
      metaFromMeta?.totalPages ??
        p?.totalPages ??
        p?.data?.totalPages ??
        1
    ) || 1;

  const page =
    Number(metaFromMeta?.page ?? p?.page ?? p?.data?.page ?? fallbackPage) ||
    fallbackPage;

  return { total, totalPages, page };
}

const fetcher = async (url: string) => {
  return apiFetch(url);
};

export function useFetchServicos({
  q,
  especialidade,
  page = 1,
  limit = 12,
  sort = "id",
  order = "desc",
}: Params = {}) {
  // ✅ ROTA PÚBLICA (coerente com ServicosSection)
  const url = new URL("/api/public/servicos", API_BASE);

  if (q && String(q).trim().length > 0) url.searchParams.set("q", String(q));

  if (
    especialidade !== undefined &&
    especialidade !== null &&
    String(especialidade).length > 0
  ) {
    url.searchParams.set("especialidade", String(especialidade));
  }

  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", String(sort));
  url.searchParams.set("order", order);

  const { data, error, isLoading } = useSWR<ApiListResponse<any>>(
    url.toString(),
    fetcher
  );

  const list = pickList<any>(data);
  const meta = pickMeta(data, page);

  const errorMessage = error
    ? handleApiError(error, {
        silent: true,
        fallback: "Não foi possível carregar os serviços.",
      })
    : null;

  return {
    data: list,
    meta,
    loading: isLoading,
    error: errorMessage,
  };
}
