"use client";

import { useEffect, useMemo, useState } from "react";
import type { Service } from "@/types/service";

// 👉 agora usa o novo service centralizado
import { getServices, type ListMeta } from "@/services/services";

export type Params = {
  q?: string;
  especialidade?: string;
  page?: number;
  limit?: number;
  sort?: "id" | "nome" | "cargo" | "especialidade";
  order?: "asc" | "desc";
};

type State = {
  data: Service[];
  meta: ListMeta | null;
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

  // memoização dos parâmetros para evitar rerender loop
  const memoParams = useMemo(
    () => ({
      q: params?.q,
      specialty: params?.especialidade, // traduz para o field do backend
      page: params?.page ?? 1,
      limit: params?.limit ?? 12,
      sort: params?.sort ?? "id",
      order: params?.order ?? "desc",
    }),
    [
      params?.q,
      params?.especialidade,
      params?.page,
      params?.limit,
      params?.sort,
      params?.order,
    ]
  );

  useEffect(() => {
    let active = true;

    setState((s) => ({ ...s, loading: true, error: null }));

    async function fetchData() {
      try {
        const { data, meta } = await getServices(memoParams);

        if (!active) return;

        setState({
          data,
          meta,
          loading: false,
          error: null,
        });
      } catch (e: any) {
        if (!active) return;

        setState({
          data: [],
          meta: null,
          loading: false,
          error: e?.message || "Erro ao buscar serviços",
        });
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [memoParams]);

  return state;
}
