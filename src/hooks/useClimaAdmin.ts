"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ClimaFormState, ClimaItem, NewsOk } from "@/types/kavita-news";
import { normalizeSlug, toNumberOrNull, parseIbgeId, parseStationCode } from "@/utils/kavita-news/clima";

type Params = {
  apiBase: string;
  authOptions: RequestInit;
  onUnauthorized: () => void;
};

type ApiErrorShape = {
  ok?: boolean;
  code?: string;
  message?: string;
  mensagem?: string;
  details?: any;
};

export type InmetStation = {
  // Mantemos o tipo/export para compatibilidade com o front atual.
  // Agora estes itens representam sugestões de geocoding (Open-Meteo), não "estações INMET".
  // Campos relevantes para o formulário: name/uf/lat/lon.
  code?: string;
  name: string;
  uf: string;
  status?: string;
  lat?: string | number | null;
  lon?: string | number | null;
  country?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
};

function pickMessage(payload: any, fallback: string) {
  return payload?.message || payload?.mensagem || payload?.error || fallback;
}

function mergeHeaders(a?: HeadersInit, b?: HeadersInit): HeadersInit {
  return { ...(a || {}), ...(b || {}) };
}

function isAbortError(e: any) {
  const msg = String(e?.message || e || "").toLowerCase();
  return e?.name === "AbortError" || msg.includes("aborted") || msg.includes("abort");
}

function toUpperUF(v: string) {
  return (v || "").trim().toUpperCase();
}

export function useClimaAdmin({ apiBase, authOptions, onUnauthorized }: Params) {
  const [rows, setRows] = useState<ClimaItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [editing, setEditing] = useState<ClimaItem | null>(null);
  const [mode, setMode] = useState<"create" | "edit">("create");

  const [form, setForm] = useState<ClimaFormState>({
    city_name: "",
    slug: "",
    uf: "",
    ibge_id: "",
    station_code: "",
    // Open-Meteo: coordenadas
    station_lat: "" as any,
    station_lon: "" as any,
    station_distance: "" as any,
    mm_24h: "",
    mm_7d: "",
    source: "",
    last_update_at: "",
    ativo: true,
  });

  // Abort só para requests “in flight” no unmount do hook.
  const abortAllRef = useRef<AbortController | null>(null);

  const request = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      // controlador geral do hook (para abort no unmount)
      if (!abortAllRef.current) abortAllRef.current = new AbortController();

      // controlador por request (para poder cancelar somente ela se necessário)
      const localController = new AbortController();

      // se o hook for abortado, aborta a request local também
      const parent = abortAllRef.current;
      const onAbort = () => {
        try {
          localController.abort();
        } catch {}
      };
      parent.signal.addEventListener("abort", onAbort, { once: true });

      const url = `${apiBase}${path}`;

      // garante envio de cookies (sessão/adminToken) por padrão.
      const credentials =
        (init?.credentials as RequestCredentials | undefined) ??
        (authOptions?.credentials as RequestCredentials | undefined) ??
        ("include" as RequestCredentials);

      const res = await fetch(url, {
        ...authOptions,
        ...init,
        credentials,
        headers: mergeHeaders(authOptions.headers, init?.headers),
        signal: localController.signal,
      });

      if (res.status === 401) {
        onUnauthorized();
        throw new Error("UNAUTHORIZED");
      }

      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        const msg = pickMessage(payload, `HTTP ${res.status}`);
        throw new Error(msg);
      }

      // padrão: { ok: true, data: ... }
      if (payload && typeof payload === "object" && "ok" in payload) {
        if (payload.ok === false) {
          const msg = pickMessage(payload as ApiErrorShape, "Erro na operação.");
          throw new Error(msg);
        }
        return (payload as NewsOk<T>).data as T;
      }

      // tolerância: endpoint retornando direto
      return payload as T;
    },
    [apiBase, authOptions, onUnauthorized]
  );

  const resetForm = useCallback(() => {
    setForm({
      city_name: "",
      slug: "",
      uf: "",
      ibge_id: "",
      station_code: "",
      station_lat: "" as any,
      station_lon: "" as any,
      station_distance: "" as any,
      mm_24h: "",
      mm_7d: "",
      source: "",
      last_update_at: "",
      ativo: true,
    });
  }, []);

  const startCreate = useCallback(() => {
    setMode("create");
    setEditing(null);
    setErrorMsg(null);
    resetForm();
  }, [resetForm]);

  const startEdit = useCallback((item: ClimaItem) => {
    setMode("edit");
    setEditing(item);
    setErrorMsg(null);

    setForm({
      city_name: item.city_name || "",
      slug: item.slug || "",
      uf: item.uf || "",
      ibge_id: item.ibge_id == null ? "" : String(item.ibge_id),
      station_code: item.station_code ?? "",
      station_lat: (item as any).station_lat == null ? ("" as any) : (String((item as any).station_lat) as any),
      station_lon: (item as any).station_lon == null ? ("" as any) : (String((item as any).station_lon) as any),
      station_distance:
        (item as any).station_distance == null ? ("" as any) : (String((item as any).station_distance) as any),
      mm_24h: item.mm_24h == null ? "" : String(item.mm_24h),
      mm_7d: item.mm_7d == null ? "" : String(item.mm_7d),
      source: item.source ?? "",
      last_update_at: item.last_update_at ?? "",
      ativo: Number(item.ativo ?? 1) === 1,
    });
  }, []);

  const cancelEdit = useCallback(() => startCreate(), [startCreate]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const data = await request<ClimaItem[]>("/api/admin/news/clima", { method: "GET" });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (isAbortError(e)) return;
      if (String(e?.message) !== "UNAUTHORIZED") setErrorMsg(e?.message || "Erro ao listar clima.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    load();
    return () => {
      try {
        abortAllRef.current?.abort();
      } catch {}
      abortAllRef.current = null;
    };
  }, [load]);

  const submit = useCallback(async () => {
    try {
      setSaving(true);
      setErrorMsg(null);

      const city_name = form.city_name.trim();
      const uf = toUpperUF(form.uf);
      const slug = normalizeSlug(form.slug);

      if (!city_name) return setErrorMsg("Preencha o nome da cidade.");
      if (!uf || uf.length !== 2) return setErrorMsg("UF inválida (use 2 letras).");
      if (!slug) return setErrorMsg("Slug inválido.");

      const ibge_id = parseIbgeId(form.ibge_id);

      // station_code fica legado/optional (Open-Meteo não depende disso)
      const station_code =
        parseStationCode(form.station_code) ??
        (form.station_code.trim() ? form.station_code.trim().toUpperCase() : null);

      // Open-Meteo: coordenadas
      const station_lat = toNumberOrNull((form as any).station_lat);
      const station_lon = toNumberOrNull((form as any).station_lon);
      const station_distance = toNumberOrNull((form as any).station_distance);

      // validação: se o usuário preencher apenas um lado, bloqueia para evitar sync inconsistente
      const latRaw = String((form as any).station_lat ?? "").trim();
      const lonRaw = String((form as any).station_lon ?? "").trim();
      if ((latRaw && !lonRaw) || (!latRaw && lonRaw)) {
        return setErrorMsg("Preencha station_lat e station_lon (ambos) ou deixe ambos vazios para geocoding automático.");
      }

      const payload = {
        city_name,
        slug,
        uf,
        ibge_id,
        station_code,
        station_lat,
        station_lon,
        station_distance,
        mm_24h: toNumberOrNull(form.mm_24h),
        mm_7d: toNumberOrNull(form.mm_7d),
        source: form.source.trim() ? form.source.trim() : null,
        last_update_at: form.last_update_at.trim() ? form.last_update_at.trim() : null,
        ativo: form.ativo ? 1 : 0,
      };

      const isEdit = mode === "edit" && editing?.id;
      const path = isEdit ? `/api/admin/news/clima/${editing!.id}` : `/api/admin/news/clima`;

      await request<any>(path, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await load();
      startCreate();
    } catch (e: any) {
      if (isAbortError(e)) return;
      if (String(e?.message) !== "UNAUTHORIZED") setErrorMsg(e?.message || "Erro ao salvar clima.");
    } finally {
      setSaving(false);
    }
  }, [editing, form, load, mode, request, startCreate]);

  const remove = useCallback(
    async (id: number) => {
      const yes = confirm("Excluir este clima?");
      if (!yes) return;

      try {
        setDeletingId(id);
        setErrorMsg(null);

        await request<any>(`/api/admin/news/clima/${id}`, { method: "DELETE" });
        await load();
      } catch (e: any) {
        if (isAbortError(e)) return;
        if (String(e?.message) !== "UNAUTHORIZED") setErrorMsg(e?.message || "Erro ao excluir clima.");
      } finally {
        setDeletingId(null);
      }
    },
    [load, request]
  );

  const sync = useCallback(
    async (id: number) => {
      try {
        setSyncingId(id);
        setErrorMsg(null);

        await request<ClimaItem>(`/api/admin/news/clima/${id}/sync`, { method: "POST" });
        await load();
      } catch (e: any) {
        if (isAbortError(e)) return;
        if (String(e?.message) !== "UNAUTHORIZED") setErrorMsg(e?.message || "Erro ao sincronizar clima.");
      } finally {
        setSyncingId(null);
      }
    },
    [load, request]
  );

  /**
   * Sugere coordenadas (Open-Meteo Geocoding) via backend
   * GET /api/admin/news/clima/stations?uf=MG&q=Manhuaçu&limit=10
   */
  const suggestStations = useCallback(
    async (uf: string, q: string, limit = 10): Promise<InmetStation[]> => {
      try {
        const UF = toUpperUF(uf);
        const Q = String(q || "").trim();
        if (UF.length !== 2 || Q.length < 2) return [];

        const data = await request<InmetStation[]>(
          `/api/admin/news/clima/stations?uf=${encodeURIComponent(UF)}&q=${encodeURIComponent(Q)}&limit=${encodeURIComponent(
            String(limit)
          )}`,
          { method: "GET" }
        );

        return Array.isArray(data) ? data : [];
      } catch (e: any) {
        // não estoura erro para não “quebrar” UX do formulário; só ignora
        if (isAbortError(e)) return [];
        if (String(e?.message) === "UNAUTHORIZED") return [];
        return [];
      }
    },
    [request]
  );

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => a.city_name.localeCompare(b.city_name, "pt-BR"));
  }, [rows]);

  return {
    rows,
    sorted,

    loading,
    saving,
    deletingId,
    syncingId,
    errorMsg,

    mode,
    editing,
    form,
    setForm,

    load,
    submit,
    remove,
    sync,

    suggestStations,

    startEdit,
    startCreate,
    resetForm,
    cancelEdit,
  };
}
