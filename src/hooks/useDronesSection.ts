"use client";

// Hook que carrega uma seção editável da landing /drones do backend.
// Aceita um fallback estático que é mantido enquanto a API não responde
// e como rede de segurança se a chamada falhar.
//
// Uso:
//   const { title, subtitle, items } = useDronesSection("why", FALLBACK);
//
// O componente pode renderizar diretamente — `items` nunca é undefined,
// começa com o fallback.

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

export type DroneSectionItem = {
  icon?: string | null;
  title?: string | null;
  text?: string | null;
  badge?: string | null;
};

export type DroneSectionData = {
  title: string | null;
  subtitle: string | null;
  items: DroneSectionItem[];
};

export type DroneSectionFallback = {
  title?: string | null;
  subtitle?: string | null;
  items: DroneSectionItem[];
};

type ApiPayload = {
  section_key?: string;
  title?: string | null;
  subtitle?: string | null;
  items?: DroneSectionItem[];
} | null;

export function useDronesSection(
  key: string,
  fallback: DroneSectionFallback,
): DroneSectionData {
  const [data, setData] = useState<DroneSectionData>({
    title: fallback.title ?? null,
    subtitle: fallback.subtitle ?? null,
    items: fallback.items,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<ApiPayload>(
          `/api/public/drones/sections/${encodeURIComponent(key)}`,
        );
        if (cancelled) return;
        if (!res || !Array.isArray(res.items) || !res.items.length) {
          // API respondeu mas seção vazia/inativa — mantém fallback.
          return;
        }
        setData({
          title: res.title ?? fallback.title ?? null,
          subtitle: res.subtitle ?? fallback.subtitle ?? null,
          items: res.items,
        });
      } catch {
        // Falha silenciosa — mantém fallback estático.
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}
