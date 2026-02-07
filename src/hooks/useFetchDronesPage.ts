// src/hooks/useFetchDronesPage.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DroneGalleryItem,
  DroneRepresentative,
  DronePageSettings,
  DroneComment,
} from "@/types/drones";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type ApiErrorPayload = {
  status?: number;
  code?: string;
  message?: string;
  details?: any;
};

class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status = 500, code?: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export type ModelKey = string;

export type DroneModel = {
  key: string;
  label: string;
  is_active?: boolean | number;
  sort_order?: number;

  // ✅ NOVO: ids escolhidos no admin (para card/destaque)
  current_hero_media_id?: number | null;
  current_card_media_id?: number | null;
};

/**
 * ✅ Resposta REAL do seu backend (controllers/dronesPublicController.js):
 * - getRoot: { landing, model, model_data, gallery, comments }
 * - getModelAggregate: { landing, model, model_data, gallery, comments }
 */
export type PublicDronesRootResponse = {
  landing?: DronePageSettings | null;
  model?: any; // row do drone_models (key/label)
  model_data?: any; // dados por modelo (models_json[modelKey])
  gallery?: { items?: DroneGalleryItem[] } | DroneGalleryItem[];
  comments?: { items?: DroneComment[] } | DroneComment[] | any;
};

export type PublicDronesModelAggregateResponse = PublicDronesRootResponse;

type AnyJson = Record<string, any> | any[] | string | number | boolean | null;

function isValidModelKey(modelKey: string) {
  return /^[a-z0-9_]{2,20}$/.test(String(modelKey || "").trim().toLowerCase());
}

function extractItemsArray<T>(payload: AnyJson): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === "object") {
    const obj = payload as any;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

async function readJsonSafely(res: Response): Promise<{ text: string; json: AnyJson }> {
  const text = await res.text();
  try {
    return { text, json: JSON.parse(text) as AnyJson };
  } catch {
    return { text, json: null };
  }
}

function pickErrorMessage(json: AnyJson, fallback: string) {
  if (json && typeof json === "object") {
    const msg = (json as any).message;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return fallback;
}

async function fetchJsonOrThrow<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const { json } = await readJsonSafely(res);

  if (!res.ok) {
    const payload = (json && typeof json === "object" ? (json as any) : {}) as ApiErrorPayload;
    throw new ApiError(
      pickErrorMessage(json, "Falha na requisição."),
      res.status,
      payload.code,
      payload.details
    );
  }
  return json as T;
}

// ✅ normaliza modelos para o formato do front (key/label + ids)
function normalizeModels(raw: any): DroneModel[] {
  const arr = extractItemsArray<any>(raw);
  return arr
    .map((m) => {
      const key = String(m.key || m.model_key || "").trim().toLowerCase();
      const label = String(m.label || m.name || "").trim();

      return {
        key,
        label,
        is_active: m.is_active,
        sort_order: m.sort_order,
        current_hero_media_id:
          m.current_hero_media_id === undefined ? null : (m.current_hero_media_id ?? null),
        current_card_media_id:
          m.current_card_media_id === undefined ? null : (m.current_card_media_id ?? null),
      } as DroneModel;
    })
    .filter((m) => m.key && m.label);
}

// ✅ resolve "page" para manter compat com o resto do app
function resolvePageFromRoot(root: any): DronePageSettings | null {
  if (!root || typeof root !== "object") return null;
  if ("landing" in root) return (root.landing ?? null) as any;
  if ("page" in root) return (root.page ?? null) as any; // compat (se algum dia mudar)
  return null;
}

export function useFetchDronesPage(modelKey?: ModelKey) {
  const normalizedModelKey = useMemo(() => {
    const mk = String(modelKey || "").trim().toLowerCase();
    return mk && isValidModelKey(mk) ? mk : undefined;
  }, [modelKey]);

  const abortRef = useRef<AbortController | null>(null);

  const [page, setPage] = useState<DronePageSettings | null>(null);
  const [models, setModels] = useState<DroneModel[]>([]);
  const [gallery, setGallery] = useState<DroneGalleryItem[]>([]);
  const [representatives, setRepresentatives] = useState<DroneRepresentative[]>([]);
  const [comments, setComments] = useState<DroneComment[]>([]);

  /**
   * ✅ aqui você quer os dados do modelo (models_json[modelKey]) para conseguir:
   * - current_hero_media_id / current_card_media_id
   * - specs/features/benefits etc.
   */
  const [model, setModel] = useState<any | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    const fetchInit: RequestInit = {
      cache: "no-store",
      signal: ac.signal,
    };

    try {
      // ✅ sempre buscamos lista de modelos (pro carrossel/abas e IDs do card/destaque)
      const modelsResPromise = fetchJsonOrThrow<any>(
        `${API_BASE}/api/public/drones/models`,
        fetchInit
      );

      if (normalizedModelKey) {
        const agg = await fetchJsonOrThrow<PublicDronesModelAggregateResponse>(
          `${API_BASE}/api/public/drones/models/${normalizedModelKey}`,
          fetchInit
        );

        // ✅ page vem em "landing"
        setPage(resolvePageFromRoot(agg));

        // ✅ model_data é o que interessa para o front (inclui current_*_media_id)
        setModel((agg as any)?.model_data ?? null);

        // ✅ gallery vem como array ou {items}
        setGallery(extractItemsArray<DroneGalleryItem>((agg as any)?.gallery));

        // ✅ comments geralmente paginado {items}
        setComments(extractItemsArray<DroneComment>((agg as any)?.comments));

        // reps continuam via endpoint separado (legado)
        const reps = await fetchJsonOrThrow<any>(
          `${API_BASE}/api/public/drones/representantes?page=1&limit=12`,
          fetchInit
        );
        setRepresentatives(extractItemsArray<DroneRepresentative>(reps));

        // models (com IDs de card/destaque)
        const modelsRes = await modelsResPromise;
        setModels(normalizeModels(modelsRes));

        return;
      }

      // sem modelKey: root agregado
      const root = await fetchJsonOrThrow<PublicDronesRootResponse>(
        `${API_BASE}/api/public/drones`,
        fetchInit
      );

      const pageResolved = resolvePageFromRoot(root);
      const modelResolved = (root as any)?.model_data ?? null;

      // ✅ EXTRAÇÃO LOCAL (pra decidir fallback corretamente)
      const galleryResolved = extractItemsArray<DroneGalleryItem>((root as any)?.gallery);
      const commentsResolved = extractItemsArray<DroneComment>((root as any)?.comments);

      setPage(pageResolved);
      setModel(modelResolved);
      setGallery(galleryResolved);
      setComments(commentsResolved);

      // reps: endpoint separado
      const reps = await fetchJsonOrThrow<any>(
        `${API_BASE}/api/public/drones/representantes?page=1&limit=12`,
        fetchInit
      );
      setRepresentatives(extractItemsArray<DroneRepresentative>(reps));

      // models (com IDs de card/destaque)
      const modelsRes = await modelsResPromise;
      setModels(normalizeModels(modelsRes));

      // ✅ fallback legado da galeria/comentários se vier vazio (AGORA CORRETO)
      const needLegacyGallery = galleryResolved.length === 0;
      const needLegacyComments = commentsResolved.length === 0;

      const legacyReqs: Promise<void>[] = [];

      if (needLegacyGallery) {
        legacyReqs.push(
          (async () => {
            const gal = await fetchJsonOrThrow<any>(
              `${API_BASE}/api/public/drones/galeria`,
              fetchInit
            );
            setGallery(extractItemsArray<DroneGalleryItem>(gal));
          })()
        );
      }

      if (needLegacyComments) {
        legacyReqs.push(
          (async () => {
            const com = await fetchJsonOrThrow<any>(
              `${API_BASE}/api/public/drones/comentarios?page=1&limit=10`,
              fetchInit
            );
            setComments(extractItemsArray<DroneComment>(com));
          })()
        );
      }

      if (legacyReqs.length) await Promise.all(legacyReqs);
    } catch (e: any) {
      if (e?.name === "AbortError") return;

      setError(e?.message || "Erro ao carregar Kavita Drones.");
      setPage(null);
      setModels([]);
      setGallery([]);
      setRepresentatives([]);
      setComments([]);
      setModel(null);
    } finally {
      setLoading(false);
    }
  }, [normalizedModelKey]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return {
    page,
    models,
    model, // ✅ agora é model_data (onde vem current_*_media_id)
    gallery,
    representatives,
    comments,
    loading,
    error,
    reload,
  };
}
