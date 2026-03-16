// src/hooks/useFetchDronesPage.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DroneGalleryItem,
  DroneRepresentative,
  DronePageSettings,
  DroneComment,
} from "@/types/drones";
import apiClient from "@/lib/apiClient";

/**
 * =========================================================
 * TYPES / ERRORS
 * =========================================================
 */
export type ModelKey = string;

export type DroneModel = {
  key: string;
  label: string;
  is_active?: boolean | number;
  sort_order?: number;

  // ids escolhidos no admin (para card/destaque)
  current_hero_media_id?: number | null;
  current_card_media_id?: number | null;
};

type AnyJson = Record<string, any> | any[] | string | number | boolean | null;

/**
 * Resposta REAL do backend:
 * - getRoot: { landing, model, model_data, gallery, comments }
 * - getModelAggregate: { landing, model, model_data, gallery, comments }
 */
export type PublicDronesRootResponse = {
  landing?: DronePageSettings | null;
  model?: any;
  model_data?: any;
  gallery?: { items?: DroneGalleryItem[] } | DroneGalleryItem[];
  comments?: { items?: DroneComment[] } | DroneComment[] | any;
};

export type PublicDronesModelAggregateResponse = PublicDronesRootResponse;

/**
 * =========================================================
 * UTILS
 * =========================================================
 */

function isValidModelKey(modelKey: string) {
  return /^[a-z0-9_]{2,20}$/.test(
    String(modelKey || "")
      .trim()
      .toLowerCase(),
  );
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


/**
 * ✅ Normaliza modelos para o formato do front (key/label + ids)
 * Observação: os ids current_* normalmente ficam em models_json[modelKey],
 * mas deixo suporte aqui caso você devolva isso diretamente no endpoint /models.
 */
function normalizeModels(raw: any): DroneModel[] {
  const arr = extractItemsArray<any>(raw);
  return arr
    .map((m) => {
      const key = String(m.key || m.model_key || "")
        .trim()
        .toLowerCase();
      const label = String(m.label || m.name || "").trim();

      return {
        key,
        label,
        is_active: m.is_active,
        sort_order: m.sort_order,
        current_hero_media_id:
          m.current_hero_media_id === undefined
            ? null
            : (m.current_hero_media_id ?? null),
        current_card_media_id:
          m.current_card_media_id === undefined
            ? null
            : (m.current_card_media_id ?? null),
      } as DroneModel;
    })
    .filter((m) => m.key && m.label);
}

function resolvePageFromRoot(root: any): DronePageSettings | null {
  if (!root || typeof root !== "object") return null;
  if ("landing" in root) return (root.landing ?? null) as any;
  if ("page" in root) return (root.page ?? null) as any;
  return null;
}

/**
 * =========================================================
 * HOOK
 * =========================================================
 */
export function useFetchDronesPage(modelKey?: ModelKey) {
  const normalizedModelKey = useMemo(() => {
    const mk = String(modelKey || "")
      .trim()
      .toLowerCase();
    return mk && isValidModelKey(mk) ? mk : undefined;
  }, [modelKey]);

  const abortRef = useRef<AbortController | null>(null);

  const [page, setPage] = useState<DronePageSettings | null>(null);
  const [models, setModels] = useState<DroneModel[]>([]);
  const [gallery, setGallery] = useState<DroneGalleryItem[]>([]);
  const [representatives, setRepresentatives] = useState<DroneRepresentative[]>(
    [],
  );
  const [comments, setComments] = useState<DroneComment[]>([]);
  const [model, setModel] = useState<any | null>(null); // model_data (models_json[modelKey])

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const hardResetState = useCallback(() => {
    setPage(null);
    setModels([]);
    setGallery([]);
    setRepresentatives([]);
    setComments([]);
    setModel(null);
  }, []);

  const reload = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    const signal = ac.signal;

    try {
      /**
       * Sempre buscamos:
       * - modelos (abas/carrossel)
       * - representantes (legado)
       *
       * E buscamos em paralelo com:
       * - root agregado (sem modelKey) OU aggregate do modelo (com modelKey)
       */
      const modelsPromise = apiClient.get<any>(
        "/api/public/drones/models",
        { signal },
      );

      const repsPromise = apiClient.get<any>(
        "/api/public/drones/representantes?page=1&limit=12",
        { signal },
      );

      if (normalizedModelKey) {
        const aggPromise = apiClient.get<PublicDronesModelAggregateResponse>(
          `/api/public/drones/models/${normalizedModelKey}`,
          { signal },
        );

        const [modelsRes, repsRes, agg] = await Promise.all([
          modelsPromise,
          repsPromise,
          aggPromise,
        ]);

        setModels(normalizeModels(modelsRes));
        setRepresentatives(extractItemsArray<DroneRepresentative>(repsRes));

        setPage(resolvePageFromRoot(agg));
        setModel((agg as any)?.model_data ?? null);
        setGallery(extractItemsArray<DroneGalleryItem>((agg as any)?.gallery));
        setComments(extractItemsArray<DroneComment>((agg as any)?.comments));

        return;
      }

      // sem modelKey: root agregado
      const rootPromise = apiClient.get<PublicDronesRootResponse>(
        "/api/public/drones",
        { signal },
      );

      const [modelsRes, repsRes, root] = await Promise.all([
        modelsPromise,
        repsPromise,
        rootPromise,
      ]);

      setModels(normalizeModels(modelsRes));
      setRepresentatives(extractItemsArray<DroneRepresentative>(repsRes));

      const pageResolved = resolvePageFromRoot(root);
      const modelResolved = (root as any)?.model_data ?? null;

      const galleryResolved = extractItemsArray<DroneGalleryItem>(
        (root as any)?.gallery,
      );
      const commentsResolved = extractItemsArray<DroneComment>(
        (root as any)?.comments,
      );

      setPage(pageResolved);
      setModel(modelResolved);
      setGallery(galleryResolved);
      setComments(commentsResolved);

      /**
       * Fallback legado:
       * - só chama se o root veio vazio
       * - mantém compatibilidade com backend antigo
       */
      const needLegacyGallery = galleryResolved.length === 0;
      const needLegacyComments = commentsResolved.length === 0;

      const legacyReqs: Promise<void>[] = [];

      if (needLegacyGallery) {
        legacyReqs.push(
          (async () => {
            const gal = await apiClient.get<any>(
              "/api/public/drones/galeria",
              { signal },
            );
            setGallery(extractItemsArray<DroneGalleryItem>(gal));
          })(),
        );
      }

      if (needLegacyComments) {
        legacyReqs.push(
          (async () => {
            const com = await apiClient.get<any>(
              "/api/public/drones/comentarios?page=1&limit=10",
              { signal },
            );
            setComments(extractItemsArray<DroneComment>(com));
          })(),
        );
      }

      if (legacyReqs.length) await Promise.all(legacyReqs);
    } catch (err: unknown) {
      if ((err as any)?.name === "AbortError") return;

      setError((err as any)?.message || "Erro ao carregar Kavita Drones.");
      hardResetState();
    } finally {
      setLoading(false);
    }
  }, [normalizedModelKey, hardResetState]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

  return {
    page,
    models,
    model, // model_data (models_json[modelKey])
    gallery,
    representatives,
    comments,
    loading,
    error,
    reload,
  };
}
