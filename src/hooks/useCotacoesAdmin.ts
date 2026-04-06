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
import { ApiError } from "@/lib/errors";

type Props = {
  /** @deprecated No longer used — apiClient handles base URL. Kept for backward compat. */
  apiBase?: string;
  /** @deprecated No longer used — apiClient handles auth. Kept for backward compat. */
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

/**
 * POST with raw response access — needed for sync endpoints where the
 * provider result lives in `meta` (outside the unwrapped `data` block).
 * Handles auth errors consistently with the rest of the hook.
 */
async function postRaw(
  path: string,
  onUnauthorized?: () => void,
): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await apiClient.post<Response>(path, undefined, { raw: true });

  let body: any = null;
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("json") || ct.includes("+json")) {
    try { body = await res.json(); } catch { /* non-JSON */ }
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) onUnauthorized?.();
    const msg = body?.message || `HTTP ${res.status}`;
    throw new ApiError({ status: res.status, message: msg, code: body?.code });
  }

  return { ok: true, status: res.status, body };
}

export function useCotacoesAdmin({ onUnauthorized }: Props) {
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

  // ─── Data loading ──────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await apiClient.get<CotacaoItem[]>("/api/admin/news/cotacoes");
      setRows(Array.isArray(list) ? list : []);

      try {
        const meta = await apiClient.get<{ allowed_slugs?: string[] }>(
          "/api/admin/news/cotacoes/meta",
        );
        if (Array.isArray(meta?.allowed_slugs) && meta.allowed_slugs.length > 0) {
          setAllowedSlugs(meta.allowed_slugs);
        }
      } catch {
        // meta is non-critical
      }
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        onUnauthorized?.();
      }
      setErrorMsg(e?.message || "Erro ao carregar cotações.");
    } finally {
      setLoading(false);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Derived state ─────────────────────────────────────────────────────

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

  // ─── Form state management ────────────────────────────────────────────

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

  // ─── CRUD mutations ───────────────────────────────────────────────────

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
        await apiClient.put(`/api/admin/news/cotacoes/${editing.id}`, payload);
        toast.success("Cotação atualizada.");
      } else {
        await apiClient.post("/api/admin/news/cotacoes", payload);
        toast.success("Cotação criada.");
      }

      await load();
      startCreate();
    } catch (e: any) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        onUnauthorized?.();
      }
      const msg = e?.message || "Erro ao salvar.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }, [form, mode, editing?.id, load, startCreate, onUnauthorized]);

  const remove = useCallback(
    async (id: number) => {
      setDeletingId(id);
      setErrorMsg(null);
      try {
        await apiClient.del(`/api/admin/news/cotacoes/${id}`);
        toast.success("Cotação removida.");
        await load();
      } catch (e: any) {
        if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
          onUnauthorized?.();
        }
        const msg = e?.message || "Erro ao remover.";
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setDeletingId(null);
      }
    },
    [load, onUnauthorized],
  );

  // ─── Sync operations ──────────────────────────────────────────────────

  /**
   * Sync individual — uses raw response to read meta.provider.ok and
   * distinguish "HTTP success" from "provider actually returned data".
   */
  const sync = useCallback(
    async (id: number) => {
      setSyncingId(id);
      setErrorMsg(null);
      try {
        const { body } = await postRaw(
          `/api/admin/news/cotacoes/${id}/sync`,
          onUnauthorized,
        );

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
   * Sync all — reads the summary to show accurate counts.
   */
  const syncAll = useCallback(async () => {
    setErrorMsg(null);
    try {
      const { body } = await postRaw(
        "/api/admin/news/cotacoes/sync-all",
        onUnauthorized,
      );

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
