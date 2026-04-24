// src/app/drones/[id]/page.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import SpecsSection from "@/components/drones/SpecsSection";
import FeaturesSection from "@/components/drones/FeaturesSection";
import BenefitsSection from "@/components/drones/BenefitsSection";
import GallerySection from "@/components/drones/GallerySection";
import RepresentativesSection from "@/components/drones/RepresentativesSection";
import ModelHero from "@/components/drones/detail/ModelHero";
import KeyMetrics, { type Metric } from "@/components/drones/detail/KeyMetrics";
import ModelOverview from "@/components/drones/detail/ModelOverview";
import RelatedModels from "@/components/drones/detail/RelatedModels";
import { getAccent } from "@/components/drones/detail/accent";
import {
  getModelCopy,
  extractKeySpecs,
  splitSpec,
} from "@/lib/drones/modelCopy";
import { absUrl } from "@/utils/absUrl";
import apiClient from "@/lib/apiClient";
import { isApiError } from "@/lib/errors";

// ✅ ajuste o path se seus types estiverem em outro lugar
import type {
  DroneGalleryItem,
  DronePageSettings,
  DroneRepresentative,
} from "@/types/drones";

type MediaType = "image" | "video" | "";
type Dict = Record<string, unknown>;

type DroneModel = {
  key: string;
  label: string;
  is_active?: number;
  sort_order?: number;
  card_media_url?: string;
  card_media_type?: "image" | "video";
  _raw?: unknown;
};

type ApiGalleryItem = Dict & {
  id?: number | string;

  url?: string;
  media_url?: string;
  file_url?: string;
  src?: string;
  media_path?: string;
  mediaPath?: string;
  path?: string;
  image_url?: string;
  video_url?: string;
  image?: string;
  video?: string;
  cover_url?: string;
  thumb_url?: string;
  thumbnail_url?: string;

  media_type?: string;
  type?: string;
  kind?: string;
  file_type?: string;

  caption?: string;
  legend?: string;
  title?: string;
  label?: string;
  descricao?: string;
  description?: string;

  sort_order?: number;
  is_active?: number;
  created_at?: string;
};

type RootResponse = {
  landing?: Dict;
  model_data?: Dict;
  gallery?: unknown;
  comments?: unknown;
};

type MediaPick = { url: string; type: MediaType; caption: string } | null;

function extractArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    const data = obj.data as Record<string, unknown> | undefined;
    if (data && Array.isArray(data.items)) return data.items as T[];
  }
  return [];
}

function pickMediaUrl(item: ApiGalleryItem | null | undefined): string {
  if (!item) return "";
  return (
    item.url ||
    item.media_url ||
    item.file_url ||
    item.src ||
    item.media_path ||
    item.mediaPath ||
    item.path ||
    item.image_url ||
    item.video_url ||
    item.image ||
    item.video ||
    item.cover_url ||
    item.thumb_url ||
    item.thumbnail_url ||
    ""
  );
}

function detectMediaTypeByUrl(url: string): MediaType {
  const u = String(url || "");
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u)) return "video";
  if (/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(u)) return "image";
  return "";
}

function normalizeMediaType(raw: unknown, url: string): MediaType {
  const s = String(raw || "").toLowerCase();
  if (s.includes("video")) return "video";
  if (s.includes("image")) return "image";
  return detectMediaTypeByUrl(url);
}

function pickCaption(picked: ApiGalleryItem | null | undefined): string {
  if (!picked) return "";
  return String(
    picked.caption ||
      picked.legend ||
      picked.title ||
      picked.label ||
      picked.descricao ||
      picked.description ||
      "",
  );
}

function resolveById(gallery: ApiGalleryItem[], id?: number | null): MediaPick {
  if (!id) return null;

  const picked = gallery.find((x) => Number(x?.id) === Number(id));
  if (!picked) return null;

  const url = absUrl(pickMediaUrl(picked));
  const typeRaw =
    picked.media_type ?? picked.type ?? picked.kind ?? picked.file_type;
  const type = normalizeMediaType(typeRaw, url);
  const caption = pickCaption(picked);

  return { url, type, caption };
}

function resolveGalleryHero(
  gallery: ApiGalleryItem[],
): Exclude<MediaPick, null> {
  const firstVideo = gallery.find((it) => {
    const url = absUrl(pickMediaUrl(it));
    const typeRaw = it.type ?? it.media_type ?? it.kind ?? it.file_type;
    return normalizeMediaType(typeRaw, url) === "video";
  });

  const firstImage = gallery.find((it) => {
    const url = absUrl(pickMediaUrl(it));
    const typeRaw = it.type ?? it.media_type ?? it.kind ?? it.file_type;
    return normalizeMediaType(typeRaw, url) === "image";
  });

  const picked = firstVideo || firstImage || gallery[0] || null;

  const url = absUrl(pickMediaUrl(picked));
  const typeRaw =
    picked?.type ?? picked?.media_type ?? picked?.kind ?? picked?.file_type;
  const type = normalizeMediaType(typeRaw, url);
  const caption = pickCaption(picked);

  return { url, type, caption };
}

/**
 * ✅ Normaliza o objeto page para DronePageSettings (sem quebrar runtime)
 * Preenche campos comuns que os componentes geralmente usam (hero_*)
 * e mantém todo o resto que veio do backend.
 */
function toDronePageSettings(input: Dict | null): DronePageSettings {
  const base: Dict = input || {};

  const normalized: Dict = {
    hero_title: String(base.hero_title ?? ""),
    hero_subtitle: String(base.hero_subtitle ?? ""),
    hero_video_path: String(base.hero_video_path ?? base.hero_video_url ?? ""),
    hero_image_fallback_path: String(
      base.hero_image_fallback_path ?? base.hero_image_url ?? "",
    ),
    ...base,
  };

  // cast final para o tipo esperado pelas Sections
  return normalized as unknown as DronePageSettings;
}

/**
 * ✅ Normaliza itens da galeria para DroneGalleryItem (campos obrigatórios)
 * Mantém as chaves originais também (pra não quebrar nenhuma lógica interna).
 */
function toDroneGalleryItems(items: ApiGalleryItem[]): DroneGalleryItem[] {
  return items.map((it, idx) => {
    const normalized: Dict = {
      sort_order: Number(it.sort_order ?? idx),
      is_active: Number(it.is_active ?? 1),
      created_at: String(it.created_at ?? ""),
      ...it,
    };

    return normalized as unknown as DroneGalleryItem;
  });
}

/**
 * ✅ Normaliza representantes para DroneRepresentative
 * (preenche obrigatórios, mantém resto)
 */
function toDroneRepresentatives(items: Dict[]): DroneRepresentative[] {
  return items.map((r) => {
    const normalized: Dict = {
      id: Number((r as Dict).id ?? 0),
      name: String((r as Dict).name ?? (r as Dict).nome ?? ""),
      whatsapp: String((r as Dict).whatsapp ?? (r as Dict).phone ?? ""),
      cnpj: String((r as Dict).cnpj ?? ""),
      ...r,
    };

    return normalized as unknown as DroneRepresentative;
  });
}

export default function DroneModelPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const modelKey = String(params?.id || "").toLowerCase();

  const [landing, setLanding] = useState<Dict | null>(null);
  const [modelData, setModelData] = useState<Dict | null>(null);

  // guardamos “raw” para lógica hero/resolveById
  const [galleryRaw, setGalleryRaw] = useState<ApiGalleryItem[]>([]);

  // guardamos reps raw e models
  const [representativesRaw, setRepresentativesRaw] = useState<Dict[]>([]);
  const [models, setModels] = useState<DroneModel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModels = useCallback(async (): Promise<DroneModel[]> => {
    try {
      const data = await apiClient.get<unknown>("/api/public/drones/models");
      const raw = extractArray<Dict>(data);

      return raw
        .map((m) => {
          const key = String(m.key ?? m.model_key ?? "").toLowerCase();
          const label = String(m.label ?? m.name ?? "").trim();

          const mediaUrl = String(
            m.card_media_url ??
              m.media_url ??
              m.video_url ??
              m.image_url ??
              m.image ??
              m.video ??
              m.cover_url ??
              m.thumb_url ??
              "",
          );

          const mediaTypeRaw = m.card_media_type ?? m.media_type;
          const inferredType =
            normalizeMediaType(mediaTypeRaw, mediaUrl) ||
            (mediaUrl ? "image" : "");

          const cardMediaType =
            inferredType === "video"
              ? "video"
              : inferredType === "image"
                ? "image"
                : undefined;

          return {
            key,
            label,
            card_media_url: mediaUrl || undefined,
            card_media_type: cardMediaType,
            _raw: m,
          } satisfies DroneModel;
        })
        .filter((m) => m.key);
    } catch (err) {
      if (isApiError(err)) return [];
      return [];
    }
  }, []);

  // apiClient faz unwrap automatico do envelope { ok, data }.
  // Antes usavamos fetch direto e acessavamos root.landing/model_data,
  // mas o backend responde { ok: true, data: { landing, model_data, ... } },
  // entao as secoes ficavam vazias. Essa funcao agora retorna o payload
  // ja desempacotado — as sections recebem os campos reais.
  const fetchPage = useCallback(async (): Promise<RootResponse | null> => {
    try {
      return await apiClient.get<RootResponse>(
        `/api/public/drones?model=${encodeURIComponent(modelKey)}`,
      );
    } catch (err) {
      if (isApiError(err)) return null;
      return null;
    }
  }, [modelKey]);

  const fetchRepresentatives = useCallback(async (): Promise<Dict[]> => {
    try {
      const data = await apiClient.get<unknown>(
        "/api/public/drones/representantes",
      );
      return extractArray<Dict>(data);
    } catch (err) {
      if (isApiError(err)) return [];
      return [];
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [root, reps, modelsDb] = await Promise.all([
        fetchPage(),
        fetchRepresentatives(),
        fetchModels(),
      ]);

      setLanding(root?.landing || null);
      setModelData(root?.model_data || null);

      const galleryArr = extractArray<ApiGalleryItem>(root?.gallery);
      setGalleryRaw(galleryArr);

      setRepresentativesRaw(reps);
      setModels(modelsDb);

      setLoading(false);
    })();
  }, [fetchModels, fetchPage, fetchRepresentatives]);

  // ✅ merged “raw”
  const mergedPageRaw = useMemo<Dict>(
    () => ({ ...(landing || {}), ...(modelData || {}) }),
    [landing, modelData],
  );

  // ✅ tipado para sections
  const pageSettings = useMemo<DronePageSettings>(
    () => toDronePageSettings(mergedPageRaw),
    [mergedPageRaw],
  );

  const galleryItems = useMemo<DroneGalleryItem[]>(
    () => toDroneGalleryItems(galleryRaw),
    [galleryRaw],
  );
  const representatives = useMemo<DroneRepresentative[]>(
    () => toDroneRepresentatives(representativesRaw),
    [representativesRaw],
  );

  const modelFromList = useMemo(
    () => models.find((m) => m.key === modelKey),
    [models, modelKey],
  );

  const modelLabel =
    String(
      mergedPageRaw.model_label ??
        mergedPageRaw.label ??
        mergedPageRaw.name ??
        modelFromList?.label ??
        "",
    ).trim() || (modelKey ? modelKey.toUpperCase() : "Modelo");

  const heroFromGallery = useMemo(
    () => resolveGalleryHero(galleryRaw),
    [galleryRaw],
  );

  const selectedHero = useMemo(() => {
    const heroId =
      Number(
        (mergedPageRaw.current_hero_media_id ??
          modelData?.current_hero_media_id ??
          0) as unknown,
      ) || null;
    return resolveById(galleryRaw, heroId);
  }, [galleryRaw, mergedPageRaw, modelData]);

  const selectedCard = useMemo(() => {
    const cardId =
      Number(
        (mergedPageRaw.current_card_media_id ??
          modelData?.current_card_media_id ??
          0) as unknown,
      ) || null;
    return resolveById(galleryRaw, cardId);
  }, [galleryRaw, mergedPageRaw, modelData]);

  const hero = useMemo(() => {
    const picked = selectedHero?.url
      ? selectedHero
      : heroFromGallery?.url
        ? heroFromGallery
        : selectedCard?.url
          ? selectedCard
          : null;

    if (picked?.url) return picked;

    const fallbackUrl = absUrl(modelFromList?.card_media_url || "");
    const fallbackType: MediaType =
      modelFromList?.card_media_type === "video"
        ? "video"
        : modelFromList?.card_media_type === "image"
          ? "image"
          : detectMediaTypeByUrl(fallbackUrl);

    return { url: fallbackUrl, type: fallbackType, caption: "" } as const;
  }, [selectedHero, heroFromGallery, selectedCard, modelFromList]);

  // Copy editorial por modelo (tagline, descrição, benefits fallback).
  // Fonte: src/lib/drones/modelCopy.ts — mesma usada nos cards da landing.
  const copy = useMemo(() => getModelCopy(modelKey), [modelKey]);
  const accent = useMemo(() => getAccent(modelKey), [modelKey]);

  // Specs reais do admin — se tiver 3 válidos, vira chip do hero +
  // strip de métricas. Senão cai no benefits estático do MODEL_COPY.
  const metrics = useMemo<Metric[]>(() => {
    const realSpecs = extractKeySpecs(
      (modelData as Dict | null)?.specs_items_json as
        | Array<{ title?: string; items?: string[] }>
        | null
        | undefined,
      4,
    );
    if (realSpecs.length >= 3) {
      return realSpecs.map((s) => splitSpec(s));
    }
    return copy.benefits.map((b) => ({ label: b.label, value: b.value }));
  }, [modelData, copy]);

  // Chips do hero: até 3 primeiras métricas, para não poluir o topo.
  const heroChips = useMemo(() => metrics.slice(0, 3), [metrics]);

  if (loading && !landing) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const scrollToSpecs = () => {
    const el = document.getElementById("drones-model-specs");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToReps = () => {
    const el = document.getElementById("representantes");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100">
      <style>{`
        html { scroll-behavior: smooth; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {/* Top bar minimalista — voltar + nome + CTA accent */}
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/drones")}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-extrabold text-slate-200 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Voltar
          </button>

          <div className="hidden sm:block min-w-0 text-center">
            <div className={["text-[10px] font-bold uppercase tracking-[0.22em]", accent.text].join(" ")}>
              DJI Agras
            </div>
            <div className="text-sm font-extrabold truncate">{modelLabel}</div>
          </div>

          <button
            onClick={scrollToReps}
            className={[
              "inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-extrabold backdrop-blur",
              accent.badgeBorder,
              accent.badgeBg,
              accent.badgeText,
              "hover:brightness-[1.1]",
            ].join(" ")}
          >
            Fale com representante
          </button>
        </div>
      </div>

      {/* Hero premium com accent por modelo */}
      <ModelHero
        modelLabel={modelLabel}
        eyebrow={`DJI Agras · ${copy.badge}`}
        tagline={copy.tagline}
        description={copy.description}
        heroUrl={hero.url}
        heroType={hero.type}
        accent={accent}
        chips={heroChips}
        onTalkToRep={scrollToReps}
        onScrollToSpecs={scrollToSpecs}
      />

      {/* Faixa de métricas-chave sobreposta entre hero e specs */}
      <KeyMetrics metrics={metrics} accent={accent} />

      {/* Overview narrativa: para quem é + 3 pilares */}
      <ModelOverview
        modelKey={modelKey}
        longDescription={copy.longDescription}
        accent={accent}
      />

      <div id="drones-model-specs" className="scroll-mt-24">
        <SpecsSection page={pageSettings} />
      </div>
      <div className="max-w-6xl mx-auto px-5">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <FeaturesSection page={pageSettings} />
      <div className="max-w-6xl mx-auto px-5">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <BenefitsSection page={pageSettings} />
      <div className="max-w-6xl mx-auto px-5">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div id="drones-model-gallery">
        {/* ✅ agora items é DroneGalleryItem[] */}
        <GallerySection items={galleryItems} />
      </div>

      {/* Rodapé "veja também" — outros modelos da linha */}
      <RelatedModels
        currentKey={modelKey}
        models={models.map((m) => ({
          key: m.key,
          label: m.label,
          mediaUrl: m.card_media_url ? absUrl(m.card_media_url) : undefined,
          mediaType: m.card_media_type,
        }))}
      />

      {/* ✅ reps tipados */}
      <RepresentativesSection
        page={pageSettings}
        representatives={representatives}
      />
    </div>
  );
}
