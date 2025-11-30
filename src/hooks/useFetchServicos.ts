// src/hooks/useFetchServicos.ts
"use client";

import useSWR from "swr";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Params = {
  q?: string;
  especialidade?: string | number | null;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
};

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => r.json());

export function useFetchServicos({
  q = "",
  especialidade = "",
  page = 1,
  limit = 12,
  sort = "id",
  order = "desc",
}: Params) {
  const url = new URL(`${API_BASE}/api/public/servicos`);

  if (q.trim().length > 0) url.searchParams.set("busca", q.trim());

  // 🔥 CORREÇÃO: enviar **ID numérico**, não nome
  if (
    especialidade !== "" &&
    especialidade !== null &&
    !Number.isNaN(Number(especialidade))
  ) {
    url.searchParams.set("especialidade", String(Number(especialidade)));
  }

  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("sort", sort);
  url.searchParams.set("order", order);

  const { data, error, isLoading } = useSWR(url.toString(), fetcher);

  return {
    data: data?.data || [],
    meta: {
      total: data?.total || 0,
      totalPages: data?.totalPages || 1,
      page: data?.page || 1,
    },
    loading: isLoading,
    error,
  };
}
