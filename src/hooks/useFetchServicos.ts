// src/hooks/useFetchServicos.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Service } from "@/types/service";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Params = {
  q?: string;
  especialidade?: string;
  page?: number;
  limit?: number;
  sort?: "id" | "nome" | "cargo" | "especialidade";
  order?: "asc" | "desc";
};

type ApiResponse = {
  data: Service[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sort: string;
  order: "asc" | "desc";
};

type State = {
  data: Service[];
  meta: Omit<ApiResponse, "data"> | null;
  loading: boolean;
  error: string | null;
};

export function useFetchServicos(params?: Params): State {
  const [state, setState] = useState<State>({
    data: [],
    meta: null,
    loading: true,
    error: null,
  });

  const qs = useMemo(() => {
    const u = new URLSearchParams();
    // paginacao/ordenacao do backend
    u.set("page", String(params?.page ?? 1));
    u.set("limit", String(params?.limit ?? 12));
    if (params?.sort) u.set("sort", params.sort);
    if (params?.order) u.set("order", params.order);

    // (Se o backend ainda não filtra, isso fica só para filtro no cliente)
    if (params?.q) u.set("busca", params.q);
    if (params?.especialidade) u.set("especialidade", params.especialidade);

    return u.toString();
  }, [params?.page, params?.limit, params?.sort, params?.order, params?.q, params?.especialidade]);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));

    const url = `${API}/api/public/servicos?${qs}`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) {
          const txt = await r.text();
          throw new Error(txt || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((json: ApiResponse | Service[]) => {
        if (!active) return;

        // A API retorna objeto paginado { data, page, ... }.
        // Mas caso em dev volte array, ainda suportamos.
        const payload: ApiResponse =
          Array.isArray(json)
            ? {
                data: json,
                page: 1,
                limit: json.length,
                total: json.length,
                totalPages: 1,
                sort: "id",
                order: "desc",
              }
            : json;

        const normalized = (payload.data || []).map((s) => ({
          ...s,
          images: Array.isArray(s.images)
            ? s.images
            : typeof (s as any).images === "string" && (s as any).images
            ? [(s as any).images]
            : [],
        }));

        setState({
          data: normalized,
          meta: {
            page: payload.page,
            limit: payload.limit,
            total: payload.total,
            totalPages: payload.totalPages,
            sort: payload.sort,
            order: payload.order,
          },
          loading: false,
          error: null,
        });
      })
      .catch((e: unknown) => {
        if (!active) return;
        setState({
          data: [],
          meta: null,
          loading: false,
          error: e instanceof Error ? e.message : "Erro ao buscar serviços",
        });
      });

    return () => {
      active = false;
    };
  }, [qs]);

  return state;
}
