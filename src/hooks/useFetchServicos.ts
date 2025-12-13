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

type ApiListResponse<T> = {
  data: T[];
  total?: number;
  totalPages?: number;
  page?: number;
};

const fetcher = async (url: string) => {
  // apiFetch aceita URL absoluta ou path relativo (dependendo do seu apiClient)
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
  const url = new URL("/api/servicos", API_BASE);

  if (q) url.searchParams.set("q", String(q));

  if (especialidade !== undefined && especialidade !== null && String(especialidade).length > 0) {
    url.searchParams.set("especialidade", String(especialidade));
  }

  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", String(sort));
  url.searchParams.set("order", order);

  const { data, error, isLoading } = useSWR<ApiListResponse<any>>(url.toString(), fetcher);

  const errorMessage = error
    ? handleApiError(error, { silent: true, fallback: "Não foi possível carregar os serviços." })
    : null;

  return {
    data: data?.data || [],
    meta: {
      total: data?.total || 0,
      totalPages: data?.totalPages || 1,
      page: data?.page || page || 1,
    },
    loading: isLoading,
    error: errorMessage,
  };
}
