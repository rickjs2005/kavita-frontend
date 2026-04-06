"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type {
  CotacaoFormState,
  CotacaoItem,
  CotacaoSlug,
} from "@/types/kavita-news";
import { ALLOWED_SLUGS } from "@/utils/kavita-news/cotacoes";
import apiClient from "@/lib/apiClient";

type Props = {
  apiBase?: string;
  authOptions?: RequestInit;
  onUnauthorized?: () => void;
};

function toStr(v: any) {
  return v == null ? "" : String(v);
}

function toNumString(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

export function useCotacoesAdmin({
  onUnauthorized,
}: Props) {
  const [rows, setRows] = useState<CotacaoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<CotacaoItem | null>(null);

  const [allowedSlugs, setAllowedSlugs] = useState<string[]>([
    ...ALLOWED_SLUGS,
  ]);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const [form, setForm] = useState<CotacaoFormState>({
    name: "",
    slug: "" as CotacaoSlug | "",
    type: "",
    price: "",
    unit: "",
    variation_day: "",
    market: "",
    source: "",
    last_update_at: "",
    ativo: true,
  });

  /** Wrapper that handles 401/403 redirect and extracts data from envelope. */
  const request = useCallback(
    async <T = any>(path: string, init?: { method?: string; body?: any }): Promise<T> => {
      try {
        const method = init?.method ?? "GET";
        switch (method) {
          case "POST":
            return await apiClient.post<T>(path, init?.body);
          case "PUT":
            return await apiClient.put<T>(path, init?.body);
          case "DELETE":
            return await apiClient.del<T>(path);
          default:
            return await apiClient.get<T>(path);
        }
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          onUnauthorized?.();
        }
        throw err;
      }
    },
    [onUnauthorized],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await request<CotacaoItem[]>("/api/admin/news/cotacoes");
      setRows(Array.isArray(list) ? list : []);

      // Also try to load meta for allowed slugs
      try {
        const meta = await request<{ allowed_slugs?: string[] }>("/api/admin/news/cotacoes/meta");
        if (Array.isArray(meta?.allowed_slugs) && meta.allowed_slugs.length > 0) {
          setAllowedSlugs(meta.allowed_slugs);
        }
      } catch {
        // meta is non-critical, keep default slugs
      }
    } catch (e: any) {
      setErrorMsg(e?.message || "Erro ao carregar cotações.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    const list = Array.isArray(rows) ? [...rows] : [];
    return list.sort((a, b) => {
      const aa = Number(a?.ativo ?? 1);
      const bb = Number(b?.ativo ?? 1);
      if (aa !== bb) return bb - aa;
      return (
        String(a?.type || "").localeCompare(String(b?.type || "")) ||
        String(a?.name || "").localeCompare(String(b?.name || ""))
      );
    });
  }, [rows]);

  const startCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setForm({
      name: "",
      slug: "" as any,
      type: "",
      price: "",
      unit: "",
      variation_day: "",
      market: "",
      source: "",
      last_update_at: "",
      ativo: true,
    });
  }, []);

  const startEdit = useCallback((item: CotacaoItem) => {
    setMode("edit");
    setEditing(item);
    setForm({
      name: toStr(item?.name),
      slug: (toStr(item?.slug) as any) || ("" as any),
      type: toStr(item?.type),
      price: toNumString(item?.price),
      unit: toStr(item?.unit),
      variation_day: toNumString(item?.variation_day),
      market: toStr(item?.market),
      source: toStr(item?.source),
      last_update_at: toStr(item?.last_update_at),
      ativo: Number(item?.ativo ?? 1) === 1,
    });
  }, []);

  const cancelEdit = useCallback(() => {
    startCreate();
  }, [startCreate]);

  const submit = useCallback(async () => {
    setSaving(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        name: form.name?.trim(),
        slug: form.slug || null,
        type: form.type?.trim(),
        price: form.price === "" ? null : form.price,
        unit: form.unit?.trim() || null,
        variation_day: form.variation_day === "" ? null : form.variation_day,
        market: form.market?.trim() || null,
        source: form.source?.trim() || null,
        last_update_at: form.last_update_at?.trim() || null,
        ativo: form.ativo ? 1 : 0,
      };

      if (!payload.name) throw new Error("Preencha o nome.");
      if (!payload.slug) throw new Error("Selecione o slug.");
      if (!payload.type) throw new Error("Preencha o tipo.");

      if (mode === "edit" && editing?.id) {
        await request(`/api/admin/news/cotacoes/${editing.id}`, {
          method: "PUT",
          body: payload,
        });
        toast.success("Cotação atualizada.");
      } else {
        await request("/api/admin/news/cotacoes", {
          method: "POST",
          body: payload,
        });
        toast.success("Cotação criada.");
      }

      await load();
      startCreate();
    } catch (e: any) {
      const msg = e?.message || "Erro ao salvar.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [form, mode, editing?.id, request, load, startCreate]);

  const remove = useCallback(
    async (id: number) => {
      setDeletingId(id);
      setErrorMsg(null);
      try {
        await request(`/api/admin/news/cotacoes/${id}`, { method: "DELETE" });
        toast.success("Cotação removida.");
        await load();
      } catch (e: any) {
        const msg = e?.message || "Erro ao remover.";
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setDeletingId(null);
      }
    },
    [request, load],
  );

  /**
   * Sync individual — checks meta.provider.ok to distinguish
   * "request succeeded" from "provider actually returned fresh data".
   *
   * The backend returns HTTP 200 in both cases. The provider result
   * is in the `meta` block (outside `data`), so apiClient does NOT
   * auto-unwrap it. We need the raw response to read meta.
   */
  const sync = useCallback(
    async (id: number) => {
      setSyncingId(id);
      setErrorMsg(null);
      try {
        // Use raw response to access both data and meta
        const res = await apiClient.post<Response>(
          `/api/admin/news/cotacoes/${id}/sync`,
          undefined,
          { raw: true },
        );

        let body: any = null;
        try {
          body = await res.json();
        } catch {
          // non-JSON response
        }

        if (!res.ok) {
          const msg = body?.message || `HTTP ${res.status}`;
          if (res.status === 401 || res.status === 403) onUnauthorized?.();
          throw new Error(msg);
        }

        // Check the provider result inside meta
        const providerOk = body?.meta?.provider?.ok === true;
        const providerMsg = body?.meta?.provider?.message;

        if (providerOk) {
          toast.success("Sync concluído — preço atualizado.");
        } else {
          const reason = providerMsg || "Provider não retornou dados.";
          toast.error(`Sync falhou: ${reason}`);
        }

        await load();
      } catch (e: any) {
        const msg = e?.message || "Erro no sync.";
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setSyncingId(null);
      }
    },
    [load, onUnauthorized],
  );

  /**
   * Sync all — checks the summary returned by the backend
   * to show accurate success/failure counts.
   */
  const syncAll = useCallback(async () => {
    setErrorMsg(null);
    try {
      const res = await apiClient.post<Response>(
        "/api/admin/news/cotacoes/sync-all",
        undefined,
        { raw: true },
      );

      let body: any = null;
      try {
        body = await res.json();
      } catch {
        // non-JSON
      }

      if (!res.ok) {
        const msg = body?.message || `HTTP ${res.status}`;
        if (res.status === 401 || res.status === 403) onUnauthorized?.();
        throw new Error(msg);
      }

      // The summary is in body.data (envelope: { ok, data: { total, ok, error, items } })
      const summary = body?.data;
      const okCount = summary?.ok ?? 0;
      const errCount = summary?.error ?? 0;
      const total = summary?.total ?? 0;

      if (total === 0) {
        toast("Nenhuma cotação ativa para sincronizar.", { icon: "ℹ️" });
      } else if (errCount === 0) {
        toast.success(`Todas as ${okCount} cotações atualizadas.`);
      } else if (okCount === 0) {
        toast.error(`Nenhuma cotação atualizada. ${errCount} erro(s).`);
      } else {
        toast(`${okCount} atualizada(s), ${errCount} com erro.`, { icon: "⚠️" });
      }

      await load();
    } catch (e: any) {
      const msg = e?.message || "Erro ao atualizar tudo.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  }, [load, onUnauthorized]);

  return {
    rows,
    sorted,
    loading,
    saving,
    errorMsg,

    mode,
    editing,
    form,
    setForm,

    allowedSlugs,

    load,
    startCreate,
    startEdit,
    cancelEdit,
    submit,
    remove,
    deletingId,

    sync,
    syncAll,
    syncingId,
  };
}
