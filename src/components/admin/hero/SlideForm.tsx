"use client";

// src/components/admin/hero/SlideForm.tsx
//
// Form de criação/edição de slide do hero da home pública. Usado por:
//   - /admin/destaques/site-hero/novo (sem slideId)
//   - /admin/destaques/site-hero/[id]   (com slideId)
//
// Sprint 5 (CMS): seções colapsáveis + campos novos badge_icon /
// features (até 4) / quick_links (até 5). Submit envia features e
// quick_links serializados como JSON dentro do FormData multipart;
// o backend Zod re-parseia (preprocess preparseJsonArray) e re-valida.
//
// Layout: preview à esquerda (lg:col-span-3) + formulário em
// seções <details>/<summary> à direita (lg:col-span-2). Cada seção
// memoriza estado de aberto/fechado em useState — abertas por default
// em criação e fechadas (exceto identidade) em edição.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { absUrl } from "@/utils/absUrl";
import type {
  HeroSlide,
  HeroFeature,
  HeroQuickLink,
} from "@/types/heroSlide";
import { isHeroIconKey, type HeroIconKey } from "@/lib/heroIcons";

import HeroMediaUpload from "./HeroMediaUpload";
import HeroSlidePreview from "./HeroSlidePreview";
import IconPicker from "./IconPicker";
import FeaturesEditor from "./FeaturesEditor";
import QuickLinksEditor from "./QuickLinksEditor";
import { LIMITS } from "./constants";

const SLIDE_TYPES = [
  { value: "promotional", label: "Promocional" },
  { value: "institutional", label: "Institucional" },
  { value: "informational", label: "Informativo" },
];

type FormState = {
  title: string;
  subtitle: string;
  badge_text: string;
  badge_icon: HeroIconKey | "";
  slide_type: string;
  button_label: string;
  button_href: string;
  button_secondary_label: string;
  button_secondary_href: string;
  features: HeroFeature[];
  quick_links: HeroQuickLink[];
  sort_order: number;
  is_active: number;
  starts_at: string;
  ends_at: string;
};

const EMPTY: FormState = {
  title: "",
  subtitle: "",
  badge_text: "",
  badge_icon: "",
  slide_type: "institutional",
  button_label: "Saiba Mais",
  button_href: "/drones",
  button_secondary_label: "",
  button_secondary_href: "",
  features: [],
  quick_links: [],
  sort_order: 0,
  is_active: 1,
  starts_at: "",
  ends_at: "",
};

function CharCounter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span
      className={`text-xs tabular-nums ${over ? "font-medium text-red-400" : "text-white/40"}`}
    >
      {value.length}/{max}
    </span>
  );
}

// ── Validation ──────────────────────────────────────────────────────────────

type FieldErrors = Record<string, string>;

function validateForm(
  form: FormState,
  videoFile: File | null,
  imageFile: File | null,
): FieldErrors {
  const errors: FieldErrors = {};
  if (form.title.length > LIMITS.title)
    errors.title = `Máximo ${LIMITS.title} caracteres.`;
  if (form.subtitle.length > LIMITS.subtitle)
    errors.subtitle = `Máximo ${LIMITS.subtitle} caracteres.`;
  if (form.button_label.length > LIMITS.button_label)
    errors.button_label = `Máximo ${LIMITS.button_label} caracteres.`;
  if (form.badge_text.length > LIMITS.badge_text)
    errors.badge_text = `Máximo ${LIMITS.badge_text} caracteres.`;

  if (videoFile) {
    if (!videoFile.type.startsWith("video/"))
      errors.video = "Arquivo precisa ser um vídeo.";
    else if (videoFile.size > LIMITS.videoMaxBytes)
      errors.video = `Vídeo muito grande (máx. ${
        LIMITS.videoMaxBytes / 1024 / 1024
      } MB).`;
  }
  if (imageFile) {
    if (!imageFile.type.startsWith("image/"))
      errors.image = "Arquivo precisa ser uma imagem.";
    else if (imageFile.size > LIMITS.imageMaxBytes)
      errors.image = `Imagem muito grande (máx. ${
        LIMITS.imageMaxBytes / 1024 / 1024
      } MB).`;
  }

  // CMS: features
  if (form.features.length > LIMITS.maxFeatures) {
    errors.features = `Máximo ${LIMITS.maxFeatures} mini-features.`;
  } else {
    form.features.forEach((f, idx) => {
      if (!f.title.trim())
        errors[`feature_${idx}_title`] =
          `Feature ${idx + 1}: título obrigatório.`;
      if (f.title.length > LIMITS.feature_title)
        errors[`feature_${idx}_title`] =
          `Feature ${idx + 1}: título máx. ${LIMITS.feature_title}.`;
      if ((f.subtitle?.length ?? 0) > LIMITS.feature_subtitle)
        errors[`feature_${idx}_subtitle`] =
          `Feature ${idx + 1}: subtítulo máx. ${LIMITS.feature_subtitle}.`;
    });
  }

  // CMS: quick_links
  if (form.quick_links.length > LIMITS.maxQuickLinks) {
    errors.quick_links = `Máximo ${LIMITS.maxQuickLinks} quick links.`;
  } else {
    form.quick_links.forEach((q, idx) => {
      if (!q.kicker.trim())
        errors[`ql_${idx}_kicker`] = `Quick link ${idx + 1}: categoria obrigatória.`;
      if (!q.title.trim())
        errors[`ql_${idx}_title`] = `Quick link ${idx + 1}: título obrigatório.`;
      if (q.kicker.length > LIMITS.quicklink_kicker)
        errors[`ql_${idx}_kicker`] =
          `Quick link ${idx + 1}: categoria máx. ${LIMITS.quicklink_kicker}.`;
      if (q.title.length > LIMITS.quicklink_title)
        errors[`ql_${idx}_title`] =
          `Quick link ${idx + 1}: título máx. ${LIMITS.quicklink_title}.`;
      if ((q.description?.length ?? 0) > LIMITS.quicklink_description)
        errors[`ql_${idx}_desc`] =
          `Quick link ${idx + 1}: descrição máx. ${LIMITS.quicklink_description}.`;
    });
  }
  return errors;
}

// ── Section (collapsible) ──────────────────────────────────────────────────

function Section({
  title,
  description,
  defaultOpen = true,
  badgeCount,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  badgeCount?: string;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] open:bg-white/[0.05]"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          {description ? (
            <p className="text-xs text-white/50">{description}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {badgeCount ? (
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[11px] tabular-nums text-white/60">
              {badgeCount}
            </span>
          ) : null}
          <span className="text-white/50 transition-transform group-open:rotate-180">
            ▾
          </span>
        </div>
      </summary>
      <div className="border-t border-white/10 p-4 pt-3 space-y-3">
        {children}
      </div>
    </details>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

type Props = {
  slideId?: number;
};

export default function SlideForm({ slideId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!slideId);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingVideo, setExistingVideo] = useState("");
  const [existingImage, setExistingImage] = useState("");

  const videoObjUrl = useRef<string | null>(null);
  const imageObjUrl = useRef<string | null>(null);

  useEffect(() => {
    if (videoObjUrl.current) URL.revokeObjectURL(videoObjUrl.current);
    videoObjUrl.current = videoFile ? URL.createObjectURL(videoFile) : null;
    return () => {
      if (videoObjUrl.current) URL.revokeObjectURL(videoObjUrl.current);
      videoObjUrl.current = null;
    };
  }, [videoFile]);

  useEffect(() => {
    if (imageObjUrl.current) URL.revokeObjectURL(imageObjUrl.current);
    imageObjUrl.current = imageFile ? URL.createObjectURL(imageFile) : null;
    return () => {
      if (imageObjUrl.current) URL.revokeObjectURL(imageObjUrl.current);
      imageObjUrl.current = null;
    };
  }, [imageFile]);

  const errors = useMemo(
    () => validateForm(form, videoFile, imageFile),
    [form, videoFile, imageFile],
  );
  const hasErrors = Object.keys(errors).length > 0;

  // Load existing slide
  useEffect(() => {
    if (!slideId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await apiClient.get<HeroSlide>(
          `/api/admin/hero-slides/${slideId}`,
        );
        setForm({
          title: data.title || "",
          subtitle: data.subtitle || "",
          badge_text: data.badge_text || "",
          badge_icon: isHeroIconKey(data.badge_icon) ? data.badge_icon : "",
          slide_type: data.slide_type || "institutional",
          button_label: data.button_label || "Saiba Mais",
          button_href: data.button_href || "/drones",
          button_secondary_label: data.button_secondary_label || "",
          button_secondary_href: data.button_secondary_href || "",
          features: Array.isArray(data.features) ? data.features : [],
          quick_links: Array.isArray(data.quick_links) ? data.quick_links : [],
          sort_order: data.sort_order ?? 0,
          is_active: data.is_active ?? 1,
          starts_at: data.starts_at ? data.starts_at.slice(0, 16) : "",
          ends_at: data.ends_at ? data.ends_at.slice(0, 16) : "",
        });
        setExistingVideo(data.hero_video_url || data.hero_video_path || "");
        setExistingImage(data.hero_image_url || data.hero_image_path || "");
      } catch (e) {
        const status = (e as { status?: number })?.status;
        if (status === 404) {
          toast.error("Slide não encontrado.");
          router.push("/admin/destaques/site-hero");
          return;
        }
        toast.error("Erro ao carregar slide.");
      } finally {
        setLoading(false);
      }
    })();
  }, [slideId, router]);

  function update(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Título é obrigatório.");
      return;
    }
    if (hasErrors) {
      toast.error("Corrija os erros antes de salvar.");
      return;
    }
    try {
      setSaving(true);
      const fd = new FormData();
      if (videoFile) fd.append("heroVideo", videoFile);
      if (imageFile) fd.append("heroImage", imageFile);

      // Campos escalares
      const scalarKeys: (keyof FormState)[] = [
        "title",
        "subtitle",
        "badge_text",
        "badge_icon",
        "slide_type",
        "button_label",
        "button_href",
        "button_secondary_label",
        "button_secondary_href",
        "sort_order",
        "is_active",
        "starts_at",
        "ends_at",
      ];
      for (const key of scalarKeys) {
        fd.append(key, String(form[key] ?? ""));
      }

      // Arrays — serializados como JSON; o backend Zod (preprocess
      // preparseJsonArray) re-parseia
      fd.append("features", JSON.stringify(form.features));
      fd.append("quick_links", JSON.stringify(form.quick_links));

      if (slideId) {
        await apiClient.put(`/api/admin/hero-slides/${slideId}`, fd, {
          skipContentType: true,
        });
        toast.success("Slide atualizado!");
      } else {
        await apiClient.post("/api/admin/hero-slides", fd, {
          skipContentType: true,
        });
        toast.success("Slide criado!");
      }
      router.push("/admin/destaques/site-hero");
    } catch (e) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Erro ao salvar slide.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] p-4 sm:p-6 text-white">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-white/10" />
          <div className="h-[400px] rounded-2xl border border-white/10 bg-white/5" />
        </div>
      </div>
    );
  }

  // Preview resolution
  const previewImage =
    imageObjUrl.current || (existingImage ? absUrl(existingImage) : "");
  const previewVideo =
    videoObjUrl.current || (existingVideo ? absUrl(existingVideo) : "");

  const previewSlide = {
    title: form.title,
    subtitle: form.subtitle,
    badge_text: form.badge_text,
    badge_icon: form.badge_icon || null,
    slide_type: form.slide_type,
    button_label: form.button_label,
    button_secondary_label: form.button_secondary_label,
    videoSrc: previewVideo,
    imageSrc: previewImage,
    features: form.features,
    quick_links: form.quick_links,
  };

  return (
    <div className="min-h-[70vh] p-4 sm:p-6 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {slideId ? "Editar Slide" : "Novo Slide"}
            </h1>
            <p className="text-sm text-white/60">
              {slideId
                ? "Altere os dados do slide."
                : "Crie um novo slide para o carrossel da home."}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/destaques/site-hero"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10"
            >
              Cancelar
            </Link>
            <button
              disabled={saving || hasErrors}
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-5">
          {/* Preview — sticky no desktop pra ficar visível ao rolar form */}
          <div className="order-1 lg:col-span-3">
            <div className="lg:sticky lg:top-4">
              <HeroSlidePreview slide={previewSlide} />
              <p className="mt-2 px-1 text-[11px] text-white/40">
                Preview compacto. Mini-features aparecem como linha resumida; o
                rodapé indica quantos quick links serão exibidos no público.
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="order-2 space-y-3 lg:col-span-2">
            {/* Identidade */}
            <Section
              title="Identidade"
              description="Título, subtítulo e selo do slide."
              defaultOpen
            >
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="slideTitle" className="text-sm text-white/80">
                    Título *
                  </label>
                  <CharCounter value={form.title} max={LIMITS.title} />
                </div>
                <input
                  id="slideTitle"
                  value={form.title}
                  maxLength={LIMITS.title + 10}
                  onChange={(e) => update({ title: e.target.value })}
                  className={`w-full rounded-xl border bg-black/30 px-3 py-3 text-sm outline-none focus:ring-2 ${
                    errors.title
                      ? "border-red-500/50 focus:ring-red-500/20"
                      : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
                  }`}
                  placeholder="Ex.: Venda seu café com mais segurança"
                />
                {errors.title ? (
                  <p className="mt-1 text-xs text-red-400">{errors.title}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-white/40">
                  A última palavra do título aparece em verde no público.
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label htmlFor="slideSubtitle" className="text-sm text-white/80">
                    Subtítulo
                  </label>
                  <CharCounter value={form.subtitle} max={LIMITS.subtitle} />
                </div>
                <textarea
                  id="slideSubtitle"
                  value={form.subtitle}
                  maxLength={LIMITS.subtitle + 10}
                  onChange={(e) => update({ subtitle: e.target.value })}
                  rows={2}
                  className={`w-full resize-none rounded-xl border bg-black/30 px-3 py-3 text-sm outline-none focus:ring-2 ${
                    errors.subtitle
                      ? "border-red-500/50 focus:ring-red-500/20"
                      : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
                  }`}
                  placeholder="Encontre corretoras confiáveis..."
                />
                {errors.subtitle ? (
                  <p className="mt-1 text-xs text-red-400">{errors.subtitle}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                <div>
                  <label
                    htmlFor="slideBadge"
                    className="mb-2 block text-sm text-white/80"
                  >
                    Texto do selo
                  </label>
                  <input
                    id="slideBadge"
                    value={form.badge_text}
                    maxLength={LIMITS.badge_text}
                    onChange={(e) => update({ badge_text: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                    placeholder="Ex.: Mercado do Café"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/80">Ícone</label>
                  <IconPicker
                    value={form.badge_icon || null}
                    onChange={(key) =>
                      update({ badge_icon: key ?? "" })
                    }
                    allowEmpty
                    ariaLabel="Ícone do selo"
                  />
                </div>
                <div>
                  <label
                    htmlFor="slideType"
                    className="mb-2 block text-sm text-white/80"
                  >
                    Tipo
                  </label>
                  <select
                    id="slideType"
                    value={form.slide_type}
                    onChange={(e) => update({ slide_type: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                  >
                    {SLIDE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Section>

            {/* Mídia */}
            <Section
              title="Mídia"
              description="Vídeo (preferido) ou imagem de fundo."
              defaultOpen
            >
              <HeroMediaUpload
                id="slideVideo"
                label="Vídeo"
                hint="MP4 recomendado."
                accept="video/*"
                maxBytes={LIMITS.videoMaxBytes}
                file={videoFile}
                error={errors.video}
                onFileChange={setVideoFile}
              />
              <HeroMediaUpload
                id="slideImage"
                label="Imagem"
                hint="Fallback se não houver vídeo."
                accept="image/*"
                maxBytes={LIMITS.imageMaxBytes}
                file={imageFile}
                error={errors.image}
                onFileChange={setImageFile}
              />

              {(existingVideo || existingImage) && !videoFile && !imageFile ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50">
                  Mídia atual: {existingVideo ? "vídeo" : ""}
                  {existingVideo && existingImage ? " + " : ""}
                  {existingImage ? "imagem" : ""} (envie novo arquivo para
                  substituir)
                </div>
              ) : null}
            </Section>

            {/* CTAs */}
            <Section
              title="Botões (CTA)"
              description="Botão principal + secundário opcional."
              defaultOpen={!slideId}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="btnLabel" className="mb-2 block text-sm text-white/80">
                    Label principal
                  </label>
                  <input
                    id="btnLabel"
                    value={form.button_label}
                    maxLength={LIMITS.button_label}
                    onChange={(e) => update({ button_label: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                    placeholder="Saiba Mais"
                  />
                </div>
                <div>
                  <label htmlFor="btnHref" className="mb-2 block text-sm text-white/80">
                    Link principal
                  </label>
                  <input
                    id="btnHref"
                    value={form.button_href}
                    maxLength={LIMITS.button_href}
                    onChange={(e) => update({ button_href: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                    placeholder="/drones"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="btnSecLabel"
                    className="mb-2 block text-sm text-white/80"
                  >
                    Label secundário
                  </label>
                  <input
                    id="btnSecLabel"
                    value={form.button_secondary_label}
                    maxLength={LIMITS.button_label}
                    onChange={(e) =>
                      update({ button_secondary_label: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                    placeholder="Falar com especialista"
                  />
                </div>
                <div>
                  <label
                    htmlFor="btnSecHref"
                    className="mb-2 block text-sm text-white/80"
                  >
                    Link secundário
                  </label>
                  <input
                    id="btnSecHref"
                    value={form.button_secondary_href}
                    maxLength={LIMITS.button_href}
                    onChange={(e) =>
                      update({ button_secondary_href: e.target.value })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                    placeholder="/contato"
                  />
                </div>
              </div>
            </Section>

            {/* Mini-features */}
            <Section
              title="Mini-features"
              description="Cards pequenos abaixo do CTA. Aparecem apenas no público."
              defaultOpen={false}
              badgeCount={`${form.features.length}/${LIMITS.maxFeatures}`}
            >
              <FeaturesEditor
                value={form.features}
                onChange={(next) => update({ features: next })}
              />
            </Section>

            {/* Quick links */}
            <Section
              title="Quick links (rodapé)"
              description="Cards no rodapé do hero. Opcional."
              defaultOpen={false}
              badgeCount={`${form.quick_links.length}/${LIMITS.maxQuickLinks}`}
            >
              <QuickLinksEditor
                value={form.quick_links}
                onChange={(next) => update({ quick_links: next })}
              />
            </Section>

            {/* Configurações */}
            <Section
              title="Configurações"
              description="Ordem, status e janela de exibição."
              defaultOpen={false}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="sortOrder"
                    className="mb-2 block text-sm text-white/80"
                  >
                    Ordem
                  </label>
                  <input
                    id="sortOrder"
                    type="number"
                    min={0}
                    value={form.sort_order}
                    onChange={(e) =>
                      update({ sort_order: Number(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/80">Status</label>
                  <button
                    type="button"
                    onClick={() => update({ is_active: form.is_active ? 0 : 1 })}
                    className={`w-full rounded-xl px-3 py-3 text-sm font-medium transition ${
                      form.is_active
                        ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : "border border-white/10 bg-white/5 text-white/50"
                    }`}
                  >
                    {form.is_active ? "Ativo" : "Inativo"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="startsAt"
                    className="mb-2 block text-sm text-white/80"
                  >
                    Início
                  </label>
                  <input
                    id="startsAt"
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => update({ starts_at: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="endsAt"
                    className="mb-2 block text-sm text-white/80"
                  >
                    Fim
                  </label>
                  <input
                    id="endsAt"
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => update({ ends_at: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <p className="text-xs text-white/40">
                Início/Fim opcionais. Se preenchidos, o slide só aparece dentro do
                período.
              </p>
            </Section>

            <button
              disabled={saving || hasErrors}
              onClick={handleSave}
              className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:opacity-90 disabled:opacity-50 lg:hidden"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
