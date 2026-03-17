// src/hooks/useFetchDronesPage.ts
"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type {
  DroneGalleryItem,
  DroneRepresentative,
  DronePageSettings,
  DroneComment,
} from "@/types/drones";
import apiClient from "@/lib/apiClient";

// =========================================================
// TYPES
// =========================================================

export type ModelKey = string;

export type DroneModel = {
  key: string;
  label: string;
  is_active?: boolean | number;
  sort_order?: number;
  current_hero_media_id?: number | null;
  current_card_media_id?: number | null;
};

type AnyJson = Record<string, any> | any[] | string | number | boolean | null;

export type PublicDronesRootResponse = {
  landing?: DronePageSettings | null;
  model?: any;
  model_data?: any;
  gallery?: { items?: DroneGalleryItem[] } | DroneGalleryItem[];
  comments?: { items?: DroneComment[] } | DroneComment[] | any;
};

export type PublicDronesModelAggregateResponse = PublicDronesRootResponse;

type DronesData = {
  page: DronePageSettings | null;
  models: DroneModel[];
  model: any | null;
  gallery: DroneGalleryItem[];
  representatives: DroneRepresentative[];
  comments: DroneComment[];
};

// =========================================================
// UTILS
// =========================================================

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
          m.current_hero_media_id === undefined ? null : (m.current_hero_media_id ?? null),
        current_card_media_id:
          m.current_card_media_id === undefined ? null : (m.current_card_media_id ?? null),
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

// =========================================================
// FETCHER (standalone — sem estado de componente)
// =========================================================

async function fetchDronesData([, modelKey]: [string, string | undefined]): Promise<DronesData> {
  const modelsPromise = apiClient.get<any>("/api/public/drones/models");
  const repsPromise = apiClient.get<any>("/api/public/drones/representantes?page=1&limit=12");

  if (modelKey) {
    const aggPromise = apiClient.get<PublicDronesModelAggregateResponse>(
      `/api/public/drones/models/${modelKey}`,
    );

    const [modelsRes, repsRes, agg] = await Promise.all([modelsPromise, repsPromise, aggPromise]);

    return {
      page: resolvePageFromRoot(agg),
      models: normalizeModels(modelsRes),
      model: (agg as any)?.model_data ?? null,
      gallery: extractItemsArray<DroneGalleryItem>((agg as any)?.gallery),
      representatives: extractItemsArray<DroneRepresentative>(repsRes),
      comments: extractItemsArray<DroneComment>((agg as any)?.comments),
    };
  }

  const rootPromise = apiClient.get<PublicDronesRootResponse>("/api/public/drones");
  const [modelsRes, repsRes, root] = await Promise.all([modelsPromise, repsPromise, rootPromise]);

  let gallery = extractItemsArray<DroneGalleryItem>((root as any)?.gallery);
  let comments = extractItemsArray<DroneComment>((root as any)?.comments);

  // Fallback legado: só chama se o root veio vazio
  const legacyReqs: Promise<void>[] = [];

  if (gallery.length === 0) {
    legacyReqs.push(
      apiClient
        .get<any>("/api/public/drones/galeria")
        .then((gal) => {
          gallery = extractItemsArray<DroneGalleryItem>(gal);
        })
        .catch(() => {}),
    );
  }

  if (comments.length === 0) {
    legacyReqs.push(
      apiClient
        .get<any>("/api/public/drones/comentarios?page=1&limit=10")
        .then((com) => {
          comments = extractItemsArray<DroneComment>(com);
        })
        .catch(() => {}),
    );
  }

  if (legacyReqs.length) await Promise.all(legacyReqs);

  return {
    page: resolvePageFromRoot(root),
    models: normalizeModels(modelsRes),
    model: (root as any)?.model_data ?? null,
    gallery,
    representatives: extractItemsArray<DroneRepresentative>(repsRes),
    comments,
  };
}

// =========================================================
// HOOK
// =========================================================

export function useFetchDronesPage(modelKey?: ModelKey) {
  const normalizedModelKey = useMemo(() => {
    const mk = String(modelKey || "")
      .trim()
      .toLowerCase();
    return mk && isValidModelKey(mk) ? mk : undefined;
  }, [modelKey]);

  const { data, error, isLoading, mutate } = useSWR(
    ["drones", normalizedModelKey] as [string, string | undefined],
    fetchDronesData,
    { revalidateOnFocus: false },
  );

  return {
    page: data?.page ?? null,
    models: data?.models ?? [],
    model: data?.model ?? null,
    gallery: data?.gallery ?? [],
    representatives: data?.representatives ?? [],
    comments: data?.comments ?? [],
    loading: isLoading,
    error: (error as any)?.message ?? null,
    reload: () => mutate(),
  };
}
