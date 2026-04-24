"use client";

import {
  JSX,
  Key,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import HeroSection from "@/components/drones/HeroSection";
import RepresentativesSection from "@/components/drones/RepresentativesSection";
import CommentsSection from "@/components/drones/CommentsSection";
import InterestFormSection from "@/components/drones/InterestFormSection";
import WhyDrones from "@/components/drones/WhyDrones";
import WhoIsFor from "@/components/drones/WhoIsFor";
import HowItWorks from "@/components/drones/HowItWorks";
import DronesFAQ from "@/components/drones/DronesFAQ";
import ModelsShowcase, {
  type ModelShowcaseEntry,
} from "@/components/drones/ModelsShowcase";
import { absUrl } from "@/utils/absUrl";
import apiClient from "@/lib/apiClient";
import {
  getModelCopy,
  extractKeySpecs,
  splitSpec,
} from "@/lib/drones/modelCopy";

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

// Tipo local — o helper shared recebe só o specs_items_json direto.
type ModelData = {
  specs_title?: string | null;
  specs_items_json?: Array<{ title?: string; items?: string[] }> | null;
} | null;

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
    (a, b) =>
      (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
      a.label.localeCompare(b.label),
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

/** ✅ Detecta tipo pela URL */
function detectMediaTypeByUrl(url: string): MediaTypeLower | "" {
  const u = String(url || "");
  if (u.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return "video";
  if (u.match(/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i)) return "image";
  return "";
}

function normalizeMediaTypeToLower(v: any, url?: string): MediaTypeLower | "" {
  const s = String(v || "")
    .toLowerCase()
    .trim();
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
    model.card_media_type ??
    raw.card_media_type ??
    raw.media_type ??
    raw.type ??
    raw.kind ??
    raw.file_type,
    url,
  );

  return { url, type: type as MediaTypeLower | "" };
}


// ─── Seção de confiança ─────────────────────────────────────────────
// Bloco simples de "por que falar com a Kavita antes de comprar".
// Sem prova regulatória real aqui (isso exige selos ANAC/MAPA/RT no
// rodapé quando a operação formalizar). Esta seção foca no valor do
// atendimento humano/regional — honesto sobre o que já existe hoje.
function TrustSection() {
  const pillars = [
    {
      title: "Atendimento regional",
      desc: "Representantes autorizados Kavita em cidades produtoras — contato humano, não call center.",
    },
    {
      title: "Suporte na escolha do modelo",
      desc: "Orientação sobre qual DJI Agras cabe no tamanho da sua área, relevo e cultura.",
    },
    {
      title: "Contato direto por WhatsApp",
      desc: "Fale diretamente com o representante da sua região, sem intermediários.",
    },
    {
      title: "Orientação antes da compra",
      desc: "Tire dúvidas sobre operação, manutenção e treinamento antes de decidir.",
    },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-6xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
            Por que escolher a Kavita
          </p>
          <h2 className="mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            Atendimento humano para uma decisão técnica
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Drone agrícola é investimento sério. A Kavita oferece conversa
            direta com representante autorizado para você escolher com
            segurança o modelo certo para sua operação.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 className="mt-3 text-sm font-extrabold text-white">
                {p.title}
              </h3>
              <p className="mt-1 text-xs sm:text-[13px] leading-relaxed text-slate-300">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Converte o array de modelos + mapa de model_data em entries prontas
// para o <ModelsShowcase>. Cada entry já vem com badge/tagline/description
// do MODEL_COPY e 3 specs reais (se o admin preencheu) ou o fallback
// dos benefits estáticos.
function buildShowcaseEntries(
  models: DroneModel[],
  modelDataByKey: Record<string, ModelData>,
): ModelShowcaseEntry[] {
  return models
    .filter((m) => String(m.is_active ?? 1) === "1")
    .map((m) => {
      const copy = getModelCopy(m.key);
      const md = modelDataByKey[m.key] ?? null;
      const realSpecs = extractKeySpecs(md?.specs_items_json, 3);

      // Só usa specs reais do admin se tivermos os 3 slots completos —
      // caso contrário a grade fica torta (1 card com 1 stat, outros
      // com 3). Melhor cair no fallback estático consistente.
      const specs =
        realSpecs.length >= 3
          ? realSpecs.map((s) => splitSpec(s))
          : copy.benefits;

      // Extrai hero_media_path do _raw (backend retorna em /models).
      // Usado como fallback pelo ModelShowcaseCard quando o admin
      // selecionou apenas a midia de HERO e nao a de CARD.
      const raw = (m._raw as Record<string, unknown> | undefined) || {};
      const heroMediaPath =
        typeof raw.hero_media_path === "string"
          ? (raw.hero_media_path as string)
          : undefined;
      const heroMediaType =
        typeof raw.hero_media_type === "string"
          ? (raw.hero_media_type as string)
          : undefined;

      return {
        model: {
          key: m.key,
          label: m.label,
          is_active: m.is_active,
          sort_order: m.sort_order,
          card_media_url: m.card_media_url,
          card_media_path: m.card_media_path,
          card_media_type: m.card_media_type
            ? String(m.card_media_type)
            : undefined,
          hero_media_path: heroMediaPath,
          hero_media_type: heroMediaType,
          _raw: m._raw,
        },
        badge: copy.badge,
        tagline: copy.tagline,
        description: copy.description,
        specs,
      };
    });
}

export default function DronesPublicPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [models, setModels] = useState<DroneModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");

  const [landing, setLanding] = useState<any>(null);
  const [modelData, setModelData] = useState<any>(null);
  // Mapa de model_data por key — usado pelo carrossel de cards da landing
  // para mostrar specs reais (capacidade, vazão, etc.) em cada cartão,
  // em vez do benefits estático do MODEL_COPY.
  const [modelDataByKey, setModelDataByKey] = useState<Record<string, ModelData>>({});
  const [comments, setComments] = useState<any[]>([]);
  const [representatives, setRepresentatives] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const fetchModels = useCallback(async (): Promise<DroneModel[]> => {
    let json: unknown;
    try {
      json = await apiClient.get("/api/public/drones/models");
    } catch {
      return fallbackModels();
    }
    const raw = extractArray(json);

    const normalized = raw
      .map((m: any) => {
        const key = String(m.key || m.model_key || "")
          .trim()
          .toLowerCase();
        const label = String(m.label || m.name || "").trim();

        // ✅ backend ideal: já manda a mídia do card resolvida pela seleção (models_json)
        const cardMediaUrl = m.card_media_url || "";
        const cardMediaPath = m.card_media_path || m.card_media || ""; // tolerante
        const cardMediaType =
          m.card_media_type || m.card_media_kind || m.media_type || undefined;

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
            m.current_card_media_id != null
              ? Number(m.current_card_media_id)
              : null,
          current_hero_media_id:
            m.current_hero_media_id != null
              ? Number(m.current_hero_media_id)
              : null,

          _raw: m,
        } as DroneModel;
      })
      .filter((m: DroneModel) => m.key && m.label);

    return sortModels(normalized.length ? normalized : fallbackModels());
  }, []);

  const fetchPage = useCallback(async (modelKey?: string) => {
    const path = modelKey
      ? `/api/public/drones?model=${modelKey}`
      : `/api/public/drones`;
    try {
      return (await apiClient.get(path)) as RootResponse;
    } catch {
      return null;
    }
  }, []);

  const fetchRepresentatives = useCallback(async () => {
    try {
      const json = await apiClient.get("/api/public/drones/representantes");
      return extractArray(json);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [modelsDb, reps] = await Promise.all([
        fetchModels(),
        fetchRepresentatives(),
      ]);
      setModels(modelsDb);
      setRepresentatives(reps);

      const urlModel = search.get("model") || "";
      const initial = pickInitialModel(modelsDb, urlModel);

      setSelectedModel(initial);

      // Busca landing + model_data do modelo selecionado (fluxo original).
      // Em paralelo, busca model_data de TODOS os modelos ativos para
      // alimentar os cards do carrossel com specs reais. Cada request
      // falha silenciosamente — fallback para copy.benefits no card.
      const activeKeys = modelsDb
        .filter((m) => String(m.is_active ?? 1) === "1")
        .map((m) => m.key);

      const [root, perModelRoots] = await Promise.all([
        fetchPage(initial),
        Promise.all(activeKeys.map((k) => fetchPage(k))),
      ]);

      setLanding(root?.landing || null);
      setModelData(root?.model_data || null);
      setComments(extractArray(root?.comments));

      const map: Record<string, ModelData> = {};
      activeKeys.forEach((k, idx) => {
        map[k] = (perModelRoots[idx]?.model_data as ModelData) ?? null;
      });
      setModelDataByKey(map);

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

  const mergedPage = useMemo(
    () => ({ ...(landing || {}), ...(modelData || {}) }),
    [landing, modelData],
  );

  const sectionsOrder = useMemo(() => {
    // Ordem canônica da landing — fases 1/2/3 do redesign:
    // hero → why (educativa) → models (cards c/ specs reais) →
    // who (segmentação) → how (processo 5 passos) → trust →
    // interest (form WhatsApp) → representatives (lista) →
    // faq (objeções) → comments (prova social).
    //
    // Se o admin mandar sections_order_json, respeitamos. Caso
    // contrário, usamos a ordem fixa abaixo. Seções legadas de
    // detalhe (specs/features/benefits/gallery) só existem em
    // /drones/[id], então filtramos da ordem se vierem do admin.
    const raw = mergedPage?.sections_order_json || [
      "hero",
      "why",
      "models",
      "who",
      "how",
      "trust",
      "interest",
      "representatives",
      "faq",
      "comments",
    ];

    const filtered = raw.filter(
      (k: any) =>
        !["specs", "features", "benefits", "gallery"].includes(String(k)),
    );

    // Injeta as seções novas na ordem certa, caso venham do admin
    // faltando alguma (compatibilidade com sections_order_json legado).
    function ensureAfter(list: string[], after: string, key: string) {
      if (list.includes(key)) return;
      const idx = list.indexOf(after);
      if (idx >= 0) list.splice(idx + 1, 0, key);
      else list.push(key);
    }
    function ensureBefore(list: string[], before: string, key: string) {
      if (list.includes(key)) return;
      const idx = list.indexOf(before);
      if (idx >= 0) list.splice(idx, 0, key);
      else list.push(key);
    }

    ensureAfter(filtered, "hero", "why");
    ensureAfter(filtered, "why", "models");
    ensureAfter(filtered, "models", "who");
    ensureAfter(filtered, "who", "how");
    ensureAfter(filtered, "how", "trust");
    ensureBefore(filtered, "representatives", "interest");
    ensureAfter(filtered, "representatives", "faq");

    return filtered;
  }, [mergedPage]);

  const sections: Record<string, JSX.Element> = {
    hero: <HeroSection page={mergedPage} representatives={representatives} />,

    why: <WhyDrones />,

    who: <WhoIsFor />,

    how: <HowItWorks />,

    faq: <DronesFAQ />,

    models: (
      <ModelsShowcase
        entries={buildShowcaseEntries(models, modelDataByKey)}
        onOpenModel={(key) => router.push(`/drones/${key}`)}
        onTalkToRepGeneric={() => {
          const el = document.getElementById("drones-representatives");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onTalkToRepForModel={(key) => {
          if (key !== selectedModel) {
            setSelectedModel(key);
            router.replace(`/drones?model=${key}`);
          }
          const el = document.getElementById("drones-representatives");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
    ),

    trust: <TrustSection />,

    interest: (
      <InterestFormSection
        models={models.filter((m) => String(m.is_active ?? 1) === "1")}
        representative={representatives?.[0]}
        messageTemplate={mergedPage?.cta_message_template}
      />
    ),

    representatives: (
      <div id="drones-representatives">
        <RepresentativesSection
          page={mergedPage}
          representatives={representatives}
        />
      </div>
    ),

    comments: (
      <CommentsSection
        comments={comments}
        modelKey={selectedModel}
        onCreated={() => changeModel(selectedModel)}
      />
    ),
  };

  if (loading && !landing) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100">
      <div className="sticky top-0 z-40 bg-black/60 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-3 flex gap-3 items-center">
          <span className="text-xs font-semibold text-slate-300 shrink-0">
            Modelo:
          </span>

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
