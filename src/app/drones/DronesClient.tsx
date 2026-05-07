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
import SpecBar, { type SpecBarItem } from "@/components/drones/SpecBar";
import TechSection, { type TechItem } from "@/components/drones/TechSection";
import PublicCTABar from "@/components/drones/PublicCTABar";
import RepresentativesSection from "@/components/drones/RepresentativesSection";
import CommentsSection from "@/components/drones/CommentsSection";
import InterestFormSection from "@/components/drones/InterestFormSection";
import WhyDrones from "@/components/drones/WhyDrones";
import WhoIsFor from "@/components/drones/WhoIsFor";
import HowItWorks from "@/components/drones/HowItWorks";
import DronesFAQ from "@/components/drones/DronesFAQ";
import CasesSection from "@/components/drones/CasesSection";
import TrustSection from "@/components/drones/TrustSection";
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
import { getAccent } from "@/components/drones/detail/accent";

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

/** ✅ Detecta tipo pela URL */


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
      "specs",
      "why",
      "tech",
      "models",
      "who",
      "how",
      "trust",
      "cases",
      "interest",
      "ctabar",
      "representatives",
      "faq",
      "comments",
    ];

    // "specs" agora é a HUD bar do modelo selecionado, então mantém.
    // Os filtros de seções legadas (features/benefits/gallery) eram
    // de uma fase anterior — continuam removidos pois agora pertencem
    // a /drones/[id], não à landing genérica.
    const filtered = raw.filter(
      (k: any) =>
        !["features", "benefits", "gallery"].includes(String(k)),
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

    ensureAfter(filtered, "hero", "specs");
    ensureAfter(filtered, "specs", "why");
    ensureAfter(filtered, "why", "tech");
    ensureAfter(filtered, "tech", "models");
    ensureAfter(filtered, "models", "who");
    ensureAfter(filtered, "who", "how");
    ensureAfter(filtered, "how", "trust");
    ensureAfter(filtered, "trust", "cases");
    ensureBefore(filtered, "representatives", "interest");
    ensureBefore(filtered, "representatives", "ctabar");
    ensureAfter(filtered, "representatives", "faq");

    return filtered;
  }, [mergedPage]);

  // ─── Spec bar HUD: 5 specs do modelo selecionado ────────────────────
  // Tenta extrair 5 specs reais do admin (specs_items_json no formato
  // "Rótulo: valor"). Se vier menos de 3, cai no copy.benefits do
  // MODEL_COPY (que tem 3 itens) — completa até 5 com benefits do
  // hero também.
  const specBarItems = useMemo<SpecBarItem[]>(() => {
    const md = modelDataByKey[selectedModel] ?? null;
    const realSpecs = extractKeySpecs(md?.specs_items_json, 5);
    if (realSpecs.length >= 3) {
      return realSpecs.map((s) => {
        const { label, value } = splitSpec(s);
        return { label, value };
      });
    }
    // Fallback: copy.benefits (3 itens) — admin pode adicionar mais via
    // specs_items_json para enriquecer.
    const copy = getModelCopy(selectedModel);
    return copy.benefits.map((b) => ({ label: b.label, value: b.value }));
  }, [modelDataByKey, selectedModel]);

  const selectedAccent = useMemo(
    () => getAccent(selectedModel),
    [selectedModel],
  );

  // ─── Tecnologia embarcada: features do modelo selecionado ───────────
  // Cada feature (admin/drones → modelo → Funcionalidades) pode ter
  // image_url opcional (suportado no schema do FeaturesEditor). Sem
  // features cadastradas, TechSection cai em fallback estático.
  const techItems = useMemo<TechItem[]>(() => {
    const md = modelDataByKey[selectedModel] ?? null;
    const raw = Array.isArray(md?.features_items_json)
      ? md.features_items_json
      : [];
    return raw
      .map((it) => {
        if (!it) return null;
        const obj = it as { title?: unknown; text?: unknown; image_url?: unknown; image?: unknown };
        const title = typeof obj.title === "string" ? obj.title.trim() : "";
        const text = typeof obj.text === "string" ? obj.text.trim() : "";
        const image_url =
          (typeof obj.image_url === "string" && obj.image_url.trim()) ||
          (typeof obj.image === "string" && obj.image.trim()) ||
          "";
        if (!title && !text && !image_url) return null;
        return {
          title: title || undefined,
          text: text || undefined,
          image_url: image_url || undefined,
        } as TechItem;
      })
      .filter((x): x is TechItem => x !== null);
  }, [modelDataByKey, selectedModel]);

  const selectedModelLabel = useMemo(() => {
    return models.find((m) => m.key === selectedModel)?.label;
  }, [models, selectedModel]);

  const sections: Record<string, JSX.Element> = {
    hero: (
      <HeroSection
        page={mergedPage}
        representatives={representatives}
        models={models}
        selectedModel={selectedModel}
        onSelectModel={(key) => {
          if (key !== selectedModel) {
            setSelectedModel(key);
            router.replace(`/drones?model=${key}`);
          }
        }}
      />
    ),

    specs: <SpecBar items={specBarItems} accent={selectedAccent} />,

    why: <WhyDrones />,

    tech: (
      <TechSection
        items={techItems}
        accent={selectedAccent}
        modelLabel={selectedModelLabel}
      />
    ),

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

    cases: <CasesSection modelKey={selectedModel} />,

    interest: (
      <InterestFormSection
        models={models.filter((m) => String(m.is_active ?? 1) === "1")}
        representative={representatives?.[0]}
        messageTemplate={mergedPage?.cta_message_template}
      />
    ),

    ctabar: (
      <PublicCTABar
        representative={representatives?.[0] ?? null}
        messageTemplate={mergedPage?.cta_message_template}
        modelLabel={selectedModelLabel}
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
    <div className="min-h-screen bg-[#050816] text-slate-100">
      {sectionsOrder.map((key: Key | null | undefined) => {
        const sectionKey = String(key);
        return <div key={sectionKey}>{sections[sectionKey]}</div>;
      })}
    </div>
  );
}
