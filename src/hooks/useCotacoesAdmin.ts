"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { CotacaoFormState, CotacaoItem, CotacaoSlug } from "@/types/kavita-news";
import { ALLOWED_SLUGS } from "@/utils/kavita-news/cotacoes";

type Props = {
  apiBase: string;
  authOptions: RequestInit;
  onUnauthorized: () => void;
};

function isUnauthorized(res: Response) {
  return res.status === 401 || res.status === 403;
}

function toStr(v: any) {
  return v == null ? "" : String(v);
}

function toNumString(v: any) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s;
}

export function useCotacoesAdmin({ apiBase, authOptions, onUnauthorized }: Props) {
  const [rows, setRows] = useState<CotacaoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<CotacaoItem | null>(null);

  const [allowedSlugs, setAllowedSlugs] = useState<string[]>([...ALLOWED_SLUGS]);

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

  const fetchJson = useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(`${apiBase}${path}`, {
        ...authOptions,
        ...(init || {}),
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
      });

      if (isUnauthorized(res)) {
        onUnauthorized();
        throw new Error("Não autorizado.");
      }

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        const msg = data?.message || data?.mensagem || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      return data;
    },
    [apiBase, authOptions, onUnauthorized]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const j = await fetchJson("/api/admin/news/cotacoes");
      const list = (j?.data || j) as CotacaoItem[];
      setRows(Array.isArray(list) ? list : []);

      const metaSlugs = j?.meta?.allowed_slugs;
      if (Array.isArray(metaSlugs) && metaSlugs.length > 0) setAllowedSlugs(metaSlugs);
    } catch (e: any) {
      setErrorMsg(e?.message || "Erro ao carregar cotações.");
    } finally {
      setLoading(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = useMemo(() => {
    const list = Array.isArray(rows) ? [...rows] : [];
    // ativos primeiro, depois por type/name
    return list.sort((a, b) => {
      const aa = Number(a?.ativo ?? 1);
      const bb = Number(b?.ativo ?? 1);
      if (aa !== bb) return bb - aa;
      return String(a?.type || "").localeCompare(String(b?.type || "")) || String(a?.name || "").localeCompare(String(b?.name || ""));
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
        await fetchJson(`/api/admin/news/cotacoes/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Cotação atualizada.");
      } else {
        await fetchJson(`/api/admin/news/cotacoes`, {
          method: "POST",
          body: JSON.stringify(payload),
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
  }, [form, mode, editing?.id, fetchJson, load, startCreate]);

  const remove = useCallback(
    async (id: number) => {
      setDeletingId(id);
      setErrorMsg(null);
      try {
        await fetchJson(`/api/admin/news/cotacoes/${id}`, { method: "DELETE" });
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
    [fetchJson, load]
  );

  const sync = useCallback(
    async (id: number) => {
      setSyncingId(id);
      setErrorMsg(null);
      try {
        await fetchJson(`/api/admin/news/cotacoes/${id}/sync`, { method: "POST" });
        toast.success("Sync concluído.");
        await load();
      } catch (e: any) {
        const msg = e?.message || "Erro no sync.";
        setErrorMsg(msg);
        toast.error(msg);
      } finally {
        setSyncingId(null);
      }
    },
    [fetchJson, load]
  );

  const syncAll = useCallback(async () => {
    setErrorMsg(null);
    try {
      await fetchJson(`/api/admin/news/cotacoes/sync-all`, { method: "POST" });
      toast.success("Atualização em lote concluída.");
      await load();
    } catch (e: any) {
      const msg = e?.message || "Erro ao atualizar tudo.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  }, [fetchJson, load]);

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
