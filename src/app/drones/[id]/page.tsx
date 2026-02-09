"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import SpecsSection from "@/components/drones/SpecsSection";
import FeaturesSection from "@/components/drones/FeaturesSection";
import BenefitsSection from "@/components/drones/BenefitsSection";
import GallerySection from "@/components/drones/GallerySection";
import RepresentativesSection from "@/components/drones/RepresentativesSection";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type DroneModel = {
  key: string;
  label: string;
  is_active?: number;
  sort_order?: number;
  card_media_url?: string;
  card_media_type?: "image" | "video";
  _raw?: any;
};

type RootResponse = {
  landing?: any;
  model_data?: any;
  gallery?: any[];
  comments?: any;
};

function extractArray(v: any): any[] {
  if (Array.isArray(v)) return v;
  if (v?.items && Array.isArray(v.items)) return v.items;
  if (v?.data && Array.isArray(v.data)) return v.data;
  if (v?.data?.items && Array.isArray(v.data.items)) return v.data.items;
  return [];
}

function pickMediaUrl(item: any): string {
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

function absUrl(path?: string | null) {
  if (!path) return "";
  const p = String(path);
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
}

function detectMediaTypeByUrl(url: string) {
  const u = String(url || "");
  if (u.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return "video";
  if (u.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i)) return "image";
  return "";
}

function resolveById(gallery: any[], id?: number | null) {
  const items = Array.isArray(gallery) ? gallery : [];
  if (!id) return null;

  const picked = items.find((x) => Number(x?.id) === Number(id));
  if (!picked) return null;

  const url = absUrl(pickMediaUrl(picked));
  const typeRaw =
    picked?.media_type || picked?.type || picked?.kind || picked?.file_type || detectMediaTypeByUrl(url);

  const type = String(typeRaw).toLowerCase().includes("video")
    ? "video"
    : String(typeRaw).toLowerCase().includes("image")
      ? "image"
      : detectMediaTypeByUrl(url) || "";

  const caption =
    picked?.caption ||
    picked?.legend ||
    picked?.title ||
    picked?.label ||
    picked?.descricao ||
    picked?.description ||
    "";

  return { url, type: type as "video" | "image" | "", caption };
}

function resolveGalleryHero(gallery: any[]) {
  const items = Array.isArray(gallery) ? gallery : [];

  const firstVideo = items.find((it) => {
    const url = absUrl(pickMediaUrl(it));
    const type = it.type || it.media_type || it.kind || it.file_type || detectMediaTypeByUrl(url);
    return String(type).toLowerCase().includes("video") || detectMediaTypeByUrl(url) === "video";
  });

  const firstImage = items.find((it) => {
    const url = absUrl(pickMediaUrl(it));
    const type = it.type || it.media_type || it.kind || it.file_type || detectMediaTypeByUrl(url);
    return String(type).toLowerCase().includes("image") || detectMediaTypeByUrl(url) === "image";
  });

  const picked = firstVideo || firstImage || items[0];

  const url = absUrl(pickMediaUrl(picked));
  const typeRaw = picked?.type || picked?.media_type || picked?.kind || picked?.file_type || detectMediaTypeByUrl(url);

  const type = String(typeRaw).toLowerCase().includes("video")
    ? "video"
    : String(typeRaw).toLowerCase().includes("image")
      ? "image"
      : detectMediaTypeByUrl(url) || "";

  const caption =
    picked?.caption ||
    picked?.legend ||
    picked?.title ||
    picked?.label ||
    picked?.descricao ||
    picked?.description ||
    "";

  return { url, type: type as "video" | "image" | "", caption };
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-extrabold text-slate-200">
      {children}
    </span>
  );
}

export default function DroneModelPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const modelKey = String(params?.id || "").toLowerCase();

  const [landing, setLanding] = useState<any>(null);
  const [modelData, setModelData] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [representatives, setRepresentatives] = useState<any[]>([]);
  const [models, setModels] = useState<DroneModel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModels = useCallback(async (): Promise<DroneModel[]> => {
    const res = await fetch(`${API_BASE}/api/public/drones/models`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    const raw = extractArray(json);

    return raw
      .map((m: any) => {
        const key = String(m.key || m.model_key || "").toLowerCase();
        const label = String(m.label || m.name || "").trim();

        const mediaUrl =
          m.card_media_url ||
          m.media_url ||
          m.video_url ||
          m.image_url ||
          m.image ||
          m.video ||
          m.cover_url ||
          m.thumb_url ||
          "";

        const mediaType =
          m.card_media_type ||
          m.media_type ||
          (String(mediaUrl).match(/\.(mp4|webm|ogg)(\?.*)?$/i) ? "video" : mediaUrl ? "image" : undefined);

        return {
          key,
          label,
          card_media_url: mediaUrl || undefined,
          card_media_type: mediaType,
          _raw: m,
        } as DroneModel;
      })
      .filter((m: DroneModel) => m.key);
  }, []);

  const fetchPage = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/public/drones?model=${modelKey}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as RootResponse;
  }, [modelKey]);

  const fetchRepresentatives = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/public/drones/representantes`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return extractArray(json);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [root, reps, modelsDb] = await Promise.all([fetchPage(), fetchRepresentatives(), fetchModels()]);

      setLanding(root?.landing || null);
      setModelData(root?.model_data || null);
      setGallery(root?.gallery || []);
      setComments(extractArray(root?.comments));
      setRepresentatives(reps);
      setModels(modelsDb);

      setLoading(false);
    })();
  }, [fetchModels, fetchPage, fetchRepresentatives]);

  const mergedPage = useMemo(() => ({ ...(landing || {}), ...(modelData || {}) }), [landing, modelData]);

  const modelFromList = useMemo(() => models.find((m) => m.key === modelKey), [models, modelKey]);

  const modelLabel =
    mergedPage?.model_label ||
    mergedPage?.label ||
    mergedPage?.name ||
    modelFromList?.label ||
    (modelKey ? modelKey.toUpperCase() : "Modelo");

  const heroFromGallery = useMemo(() => resolveGalleryHero(gallery), [gallery]);

  const selectedHero = useMemo(() => {
    const heroId = Number(mergedPage?.current_hero_media_id || modelData?.current_hero_media_id || 0) || null;
    return resolveById(gallery, heroId);
  }, [gallery, mergedPage, modelData]);

  const selectedCard = useMemo(() => {
    const cardId = Number(mergedPage?.current_card_media_id || modelData?.current_card_media_id || 0) || null;
    return resolveById(gallery, cardId);
  }, [gallery, mergedPage, modelData]);

  const hero = useMemo(() => {
    if (selectedHero?.url) return selectedHero;
    if (heroFromGallery?.url) return heroFromGallery;
    if (selectedCard?.url) return selectedCard;

    const fallbackUrl = absUrl(modelFromList?.card_media_url || "");
    const fallbackType = (modelFromList?.card_media_type as any) || detectMediaTypeByUrl(fallbackUrl) || "";

    return {
      url: fallbackUrl,
      type: (fallbackType === "video" ? "video" : fallbackType === "image" ? "image" : "") as "video" | "image" | "",
      caption: "",
    };
  }, [selectedHero, heroFromGallery, selectedCard, modelFromList]);

  const heroCaption = useMemo(() => {
    // ✅ legenda preferida: hero selecionado -> fallback da galeria
    return (selectedHero?.caption || heroFromGallery?.caption || "").trim();
  }, [selectedHero, heroFromGallery]);

  if (loading && !landing) {
    return (
      <div className="min-h-svh bg-[#070A0E] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-[#070A0E] text-slate-100">
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .animate-scan {
          animation: scan 3.6s ease-in-out infinite;
        }
        @keyframes scan {
          0% { transform: translateX(-30%) rotate(12deg); }
          50% { transform: translateX(160%) rotate(12deg); }
          100% { transform: translateX(-30%) rotate(12deg); }
        }
      `}</style>

      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/drones")}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-slate-200 hover:bg-white/10"
          >
            ← Voltar
          </button>

          <div className="min-w-0 text-center">
            <div className="text-[11px] text-slate-400 font-semibold">Modelo</div>
            <div className="text-sm sm:text-base font-extrabold truncate">{modelLabel}</div>
          </div>

          <a
            href="#representantes"
            className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-extrabold text-emerald-200 hover:bg-emerald-500/15"
          >
            Fale com representante
          </a>
        </div>
      </div>

      <section className="pt-8 sm:pt-10 pb-8">
        <div className="max-w-6xl mx-auto px-5">
          <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#0A0F14]/80 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl">
            <div className="pointer-events-none absolute -inset-10 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.18),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.14),transparent_55%)] blur-2xl opacity-90" />

            <div className="relative aspect-[16/9] bg-gradient-to-br from-white/10 via-white/5 to-transparent">
              {hero.url && hero.type === "video" ? (
                <video className="h-full w-full object-cover" src={hero.url} muted playsInline autoPlay loop />
              ) : hero.url && hero.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="h-full w-full object-cover" src={hero.url} alt={modelLabel} />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="text-sm text-slate-200 font-extrabold">Sem mídia destacada</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Selecione o Destaque (Hero) no admin para este modelo.
                    </div>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(16,185,129,0.20),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(59,130,246,0.16),transparent_55%)]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="pointer-events-none absolute inset-0 opacity-70">
                <div className="absolute -left-1/3 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 translate-x-[-30%] animate-scan" />
              </div>

              <div className="absolute left-5 top-5 right-5 flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>🚀 Inovação</Badge>
                  <Badge>🌱 AgroTech</Badge>
                  <Badge>🛰️ Precisão</Badge>
                </div>

                <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-200">
                  MODELO
                </span>
              </div>

              <div className="absolute left-5 right-5 bottom-5">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="min-w-0">
                    <div className="inline-flex max-w-full flex-col gap-2 rounded-3xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur">
                      <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white truncate">
                        {modelLabel}
                      </h1>
                      <p className="text-sm text-slate-200/90">
                        {heroCaption || "Especificações, funcionalidades, benefícios e galeria completa."}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:justify-end">
                    <a
                      href="#representantes"
                      className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-extrabold text-white bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 shadow-[0_18px_60px_-25px_rgba(16,185,129,0.95)] hover:brightness-[1.05] active:scale-[0.99]"
                    >
                      Fale com representante
                    </a>

                    <button
                      onClick={() => {
                        const el = document.getElementById("drones-model-gallery");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-extrabold text-slate-200 hover:bg-white/10"
                    >
                      Ver galeria
                    </button>
                  </div>
                </div>

                <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold">Kavita Drones • Tecnologia</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400/80" />
                    sistema verificado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SpecsSection page={mergedPage} />
      <div className="max-w-6xl mx-auto px-5">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <FeaturesSection page={mergedPage} />
      <div className="max-w-6xl mx-auto px-5">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <BenefitsSection page={mergedPage} />
      <div className="max-w-6xl mx-auto px-5">
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      <div id="drones-model-gallery">
        <GallerySection items={gallery} />
      </div>

      <RepresentativesSection page={mergedPage} representatives={representatives} />
    </div>
  );
}
