"use client";

import { JSX, Key, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import HeroSection from "@/components/drones/HeroSection";
import RepresentativesSection from "@/components/drones/RepresentativesSection";
import CommentsSection from "@/components/drones/CommentsSection";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type MediaTypeLower = "image" | "video";
type MediaTypeUpper = "IMAGE" | "VIDEO";

type DroneModel = {
  key: string;
  label: string;
  is_active?: number;
  sort_order?: number;

  // ✅ vindo do backend (já resolvido pela seleção do admin)
  card_media_url?: string; // pode vir absoluto ou relativo
  card_media_path?: string; // se vier como /uploads/...
  card_media_type?: MediaTypeLower | MediaTypeUpper;

  // ✅ opcional: ids da seleção (se você quiser usar no client depois)
  current_card_media_id?: number | null;
  current_hero_media_id?: number | null;

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

function fallbackModels(): DroneModel[] {
  return [
    { key: "t25p", label: "DJI Agras T25P", is_active: 1, sort_order: 10 },
    { key: "t70p", label: "DJI Agras T70P", is_active: 1, sort_order: 20 },
    { key: "t100", label: "DJI Agras T100", is_active: 1, sort_order: 30 },
  ];
}

function sortModels(models: DroneModel[]) {
  return [...models].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.label.localeCompare(b.label)
  );
}

function pickInitialModel(models: DroneModel[], urlModel?: string) {
  const active = models.filter((m) => String(m.is_active ?? 1) === "1");
  const base = active.length ? active : models;

  if (urlModel && base.some((m) => m.key === urlModel)) return urlModel;
  return base[0]?.key || "";
}

function ModelTab({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={[
        "px-4 py-2 rounded-full text-xs font-extrabold border transition",
        active
          ? "bg-emerald-500 text-white border-emerald-400/40 shadow-[0_12px_35px_-18px_rgba(16,185,129,0.9)]"
          : "bg-white/5 text-slate-200 border-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      {label}
    </div>
  );
}

/** ✅ Converte caminho relativo em URL absoluta (ex: /uploads/...) */
function absUrl(path?: string | null) {
  if (!path) return "";
  const p = String(path);
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  return `${API_BASE}${p.startsWith("/") ? "" : "/"}${p}`;
}

/** ✅ Detecta tipo pela URL */
function detectMediaTypeByUrl(url: string): MediaTypeLower | "" {
  const u = String(url || "");
  if (u.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return "video";
  if (u.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i)) return "image";
  return "";
}

function normalizeMediaTypeToLower(v: any, url?: string): MediaTypeLower | "" {
  const s = String(v || "").toLowerCase().trim();
  if (s.includes("video")) return "video";
  if (s.includes("image")) return "image";
  const byUrl = detectMediaTypeByUrl(String(url || ""));
  return byUrl || "";
}

/**
 * ✅ Resolve a mídia do card do modelo
 * Prioridade:
 * 1) card_media_url
 * 2) card_media_path
 * 3) campos alternativos do _raw (compat)
 */
function resolveCardMedia(model: DroneModel) {
  const raw = model._raw || {};

  const candidates = [
    model.card_media_url,
    model.card_media_path,

    raw.card_media_url,
    raw.card_media_path,
    raw.media_url,
    raw.file_url,
    raw.src,
    raw.media_path,
    raw.mediaPath,
    raw.path,
    raw.video_url,
    raw.image_url,
    raw.image,
    raw.video,
    raw.cover_url,
    raw.thumb_url,
    raw.thumbnail_url,
  ].filter(Boolean) as string[];

  const url = absUrl(candidates[0] || "");

  const type = normalizeMediaTypeToLower(
    model.card_media_type ?? raw.card_media_type ?? raw.media_type ?? raw.type ?? raw.kind ?? raw.file_type,
    url
  );

  return { url, type: type as MediaTypeLower | "" };
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-extrabold text-slate-200">
      {children}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="text-[10px] font-bold text-slate-400">{label}</div>
      <div className="text-[12px] font-extrabold text-slate-100">{value}</div>
    </div>
  );
}

function ModelCard({ model, onOpen }: { model: DroneModel; onOpen: (key: string) => void }) {
  const { url, type } = resolveCardMedia(model);

  return (
    <div className="relative w-[84vw] sm:w-[430px] md:w-[470px] shrink-0 snap-start">
      <div className="absolute -inset-3 rounded-[32px] bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.18),transparent_60%)] blur-2xl opacity-80" />

      <div className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0F14]/80 shadow-[0_30px_90px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
          <div className="absolute -inset-[2px] rounded-[34px] bg-[conic-gradient(from_220deg,rgba(16,185,129,0.0),rgba(16,185,129,0.65),rgba(59,130,246,0.45),rgba(16,185,129,0.0))] blur-sm animate-[spin_7s_linear_infinite]" />
          <div className="absolute inset-[1px] rounded-[32px] bg-[#0A0F14]" />
        </div>

        <div className="relative">
          <div className="relative aspect-[16/10] bg-gradient-to-br from-white/10 via-white/5 to-transparent">
            {url && type === "video" ? (
              <video className="h-full w-full object-cover" src={url} muted playsInline autoPlay loop />
            ) : url && type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="h-full w-full object-cover" src={url} alt={model.label} />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-center px-6">
                  <div className="text-sm text-slate-200 font-extrabold">Mídia do modelo</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Selecione uma imagem/vídeo no admin (Card) para aparecer aqui.
                  </div>
                </div>
              </div>
            )}

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(16,185,129,0.18),transparent_45%),radial-gradient(circle_at_80%_60%,rgba(59,130,246,0.14),transparent_55%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

            <div className="absolute left-4 top-4 right-4 flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>🚀 Inovação</Badge>
                <Badge>🌱 AgroTech</Badge>
              </div>

              <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-extrabold text-emerald-200">
                MODELO
              </span>
            </div>

            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -left-1/3 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 translate-x-[-30%] group-hover:translate-x-[220%] transition duration-[1200ms] ease-out" />
            </div>

            <div className="absolute left-4 bottom-4 right-4">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4 py-2 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.85)]" />
                <span className="text-[11px] font-bold text-slate-200">
                  Sistema inteligente de pulverização
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">{model.label}</h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-300">
                Especificações • Funcionalidades • Benefícios • Galeria
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat label="Precisão" value="Alta" />
            <MiniStat label="Performance" value="Pro" />
            <MiniStat label="Eficiência" value="Max" />
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => onOpen(model.key)}
              className="relative inline-flex flex-1 items-center justify-center rounded-2xl px-4 py-3 text-sm font-extrabold text-white
                         bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400
                         shadow-[0_18px_60px_-25px_rgba(16,185,129,0.95)]
                         hover:brightness-[1.05] active:scale-[0.99]"
            >
              <span className="absolute inset-0 rounded-2xl opacity-60 blur-xl bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_55%)]" />
              <span className="relative">Ver mais</span>
            </button>

            <div className="hidden sm:flex flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[12px] text-slate-300">
              Clique para detalhes completos e galeria do {model.label}.
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

        <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-white/0 group-hover:ring-white/12 transition" />
      </div>
    </div>
  );
}

function ModelsCarouselSection({
  models,
  onOpenModel,
  onTalkToRep,
}: {
  models: DroneModel[];
  onOpenModel: (key: string) => void;
  onTalkToRep: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  function scrollByCards(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;

    const amount = Math.round(el.clientWidth * 0.85) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className="py-10 sm:py-14">
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">Modelos disponíveis</h2>
            <p className="mt-2 text-sm text-slate-300 max-w-2xl">
              Escolha um modelo para ver <b>especificações</b>, <b>funcionalidades</b>,{" "}
              <b>benefícios</b> e a <b>galeria</b> completa.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scrollByCards(-1)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-slate-200 hover:bg-white/10"
              aria-label="Anterior"
            >
              ←
            </button>
            <button
              onClick={() => scrollByCards(1)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-slate-200 hover:bg-white/10"
              aria-label="Próximo"
            >
              →
            </button>
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="pointer-events-none absolute inset-0 opacity-80">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#070A0E] to-transparent opacity-80" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#070A0E] to-transparent opacity-80" />

          <div
            ref={scrollerRef}
            className="relative flex gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth no-scrollbar"
          >
            {models.map((m) => (
              <ModelCard key={m.key} model={m} onOpen={onOpenModel} />
            ))}
          </div>

          <div className="relative mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-xs text-slate-400">No celular, arraste para o lado. No desktop, use as setas.</div>

            <button
              onClick={onTalkToRep}
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-extrabold text-emerald-200 hover:bg-emerald-500/15"
            >
              Fale com um representante
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function DronesPublicPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [models, setModels] = useState<DroneModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const [landing, setLanding] = useState<any>(null);
  const [modelData, setModelData] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [representatives, setRepresentatives] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchModels = useCallback(async (): Promise<DroneModel[]> => {
    const res = await fetch(`${API_BASE}/api/public/drones/models`, { cache: "no-store" });
    if (!res.ok) return fallbackModels();

    const json = await res.json();
    const raw = extractArray(json);

    const normalized = raw
      .map((m: any) => {
        const key = String(m.key || m.model_key || "").trim().toLowerCase();
        const label = String(m.label || m.name || "").trim();

        // ✅ backend ideal: já manda a mídia do card resolvida pela seleção (models_json)
        const cardMediaUrl = m.card_media_url || "";
        const cardMediaPath = m.card_media_path || m.card_media || ""; // tolerante
        const cardMediaType = m.card_media_type || m.card_media_kind || m.media_type || undefined;

        // fallback compat antigo (se ainda existir)
        const legacyUrl =
          m.media_url ||
          m.file_url ||
          m.src ||
          m.media_path ||
          m.mediaPath ||
          m.path ||
          m.video_url ||
          m.image_url ||
          m.image ||
          m.video ||
          m.cover_url ||
          m.thumb_url ||
          "";

        const chosenUrl = cardMediaUrl || cardMediaPath || legacyUrl;

        return {
          key,
          label,
          is_active: Number(m.is_active ?? 1),
          sort_order: Number(m.sort_order ?? 0),

          // ✅ preferir os campos novos de card
          card_media_url: chosenUrl ? absUrl(chosenUrl) : undefined,
          card_media_path: cardMediaPath ? String(cardMediaPath) : undefined,
          card_media_type: cardMediaType,

          // ✅ ids (opcionais)
          current_card_media_id:
            m.current_card_media_id != null ? Number(m.current_card_media_id) : null,
          current_hero_media_id:
            m.current_hero_media_id != null ? Number(m.current_hero_media_id) : null,

          _raw: m,
        } as DroneModel;
      })
      .filter((m: DroneModel) => m.key && m.label);

    return sortModels(normalized.length ? normalized : fallbackModels());
  }, []);

  const fetchPage = useCallback(async (modelKey?: string) => {
    const url = modelKey ? `${API_BASE}/api/public/drones?model=${modelKey}` : `${API_BASE}/api/public/drones`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as RootResponse;
  }, []);

  const fetchRepresentatives = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/public/drones/representantes`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return extractArray(json);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [modelsDb, reps] = await Promise.all([fetchModels(), fetchRepresentatives()]);
      setModels(modelsDb);
      setRepresentatives(reps);

      const urlModel = search.get("model") || "";
      const initial = pickInitialModel(modelsDb, urlModel);

      setSelectedModel(initial);

      const root = await fetchPage(initial);
      setLanding(root?.landing || null);
      setModelData(root?.model_data || null);
      setComments(extractArray(root?.comments));

      setLoading(false);
    })();
  }, [fetchModels, fetchPage, fetchRepresentatives, search]);

  async function changeModel(key: string) {
    if (!key || key === selectedModel) return;

    setSelectedModel(key);
    router.replace(`/drones?model=${key}`);

    setLoading(true);
    const root = await fetchPage(key);

    setLanding(root?.landing || null);
    setModelData(root?.model_data || null);
    setComments(extractArray(root?.comments));
    setLoading(false);
  }

  const mergedPage = useMemo(() => ({ ...(landing || {}), ...(modelData || {}) }), [landing, modelData]);

  const sectionsOrder = useMemo(() => {
    const raw =
      mergedPage?.sections_order_json || [
        "hero",
        "specs",
        "features",
        "benefits",
        "gallery",
        "representatives",
        "comments",
      ];

    const filtered = raw.filter((k: any) => !["specs", "features", "benefits", "gallery"].includes(String(k)));

    if (!filtered.includes("models")) {
      const heroIndex = filtered.indexOf("hero");
      if (heroIndex >= 0) filtered.splice(heroIndex + 1, 0, "models");
      else filtered.unshift("models");
    }

    return filtered;
  }, [mergedPage]);

  const sections: Record<string, JSX.Element> = {
    hero: <HeroSection page={mergedPage} representatives={representatives} />,

    models: (
      <ModelsCarouselSection
        models={models.filter((m) => String(m.is_active ?? 1) === "1")}
        onOpenModel={(key) => router.push(`/drones/${key}`)}
        onTalkToRep={() => {
          const el = document.getElementById("drones-representatives");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    ),

    representatives: (
      <div id="drones-representatives">
        <RepresentativesSection page={mergedPage} representatives={representatives} />
      </div>
    ),

    comments: (
      <CommentsSection comments={comments} modelKey={selectedModel} onCreated={() => changeModel(selectedModel)} />
    ),
  };

  if (loading && !landing) {
    return (
      <div className="min-h-svh bg-[#070A0E] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-[#070A0E] text-slate-100">
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-3 flex gap-3 items-center">
          <span className="text-xs font-semibold text-slate-300 shrink-0">Modelo:</span>

          <select
            className="sm:hidden w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm"
            value={selectedModel}
            onChange={(e) => changeModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>

          <div className="hidden sm:flex gap-2 overflow-x-auto no-scrollbar">
            {models.map((m) => (
              <button key={m.key} onClick={() => changeModel(m.key)}>
                <ModelTab active={m.key === selectedModel} label={m.label} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {sectionsOrder.map((key: Key | null | undefined, idx: number) => {
        const sectionKey = String(key);
        return (
          <div key={sectionKey}>
            {sections[sectionKey]}
            {idx < sectionsOrder.length - 1 && (
              <div className="max-w-6xl mx-auto px-5">
                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
