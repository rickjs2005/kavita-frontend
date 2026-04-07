"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { absUrl } from "@/utils/absUrl";
import type { HeroSlide } from "@/types/heroSlide";
import HeroMediaUpload from "./HeroMediaUpload";
import HeroSlidePreview from "./HeroSlidePreview";
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
  slide_type: string;
  button_label: string;
  button_href: string;
  button_secondary_label: string;
  button_secondary_href: string;
  sort_order: number;
  is_active: number;
  starts_at: string;
  ends_at: string;
};

const EMPTY: FormState = {
  title: "",
  subtitle: "",
  badge_text: "",
  slide_type: "institutional",
  button_label: "Saiba Mais",
  button_href: "/drones",
  button_secondary_label: "",
  button_secondary_href: "",
  sort_order: 0,
  is_active: 1,
  starts_at: "",
  ends_at: "",
};

function CharCounter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={`text-xs tabular-nums ${over ? "text-red-400 font-medium" : "text-white/40"}`}>
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
  if (form.title.length > LIMITS.title) errors.title = `Máximo ${LIMITS.title} caracteres.`;
  if (form.subtitle.length > LIMITS.subtitle) errors.subtitle = `Máximo ${LIMITS.subtitle} caracteres.`;
  if (form.button_label.length > LIMITS.button_label) errors.button_label = `Máximo ${LIMITS.button_label} caracteres.`;
  if (form.badge_text.length > LIMITS.badge_text) errors.badge_text = `Máximo ${LIMITS.badge_text} caracteres.`;

  if (videoFile) {
    if (!videoFile.type.startsWith("video/")) errors.video = "Arquivo precisa ser um vídeo.";
    else if (videoFile.size > LIMITS.videoMaxBytes) errors.video = `Vídeo muito grande (máx. ${LIMITS.videoMaxBytes / 1024 / 1024} MB).`;
  }
  if (imageFile) {
    if (!imageFile.type.startsWith("image/")) errors.image = "Arquivo precisa ser uma imagem.";
    else if (imageFile.size > LIMITS.imageMaxBytes) errors.image = `Imagem muito grande (máx. ${LIMITS.imageMaxBytes / 1024 / 1024} MB).`;
  }
  return errors;
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

  // Object URL management (revoke previous on change + unmount)
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

  // Live validation
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
        const data = await apiClient.get<HeroSlide>(`/api/admin/hero-slides/${slideId}`);
        setForm({
          title: data.title || "",
          subtitle: data.subtitle || "",
          badge_text: data.badge_text || "",
          slide_type: data.slide_type || "institutional",
          button_label: data.button_label || "Saiba Mais",
          button_href: data.button_href || "/drones",
          button_secondary_label: data.button_secondary_label || "",
          button_secondary_href: data.button_secondary_href || "",
          sort_order: data.sort_order ?? 0,
          is_active: data.is_active ?? 1,
          starts_at: data.starts_at ? data.starts_at.slice(0, 16) : "",
          ends_at: data.ends_at ? data.ends_at.slice(0, 16) : "",
        });
        setExistingVideo(data.hero_video_url || data.hero_video_path || "");
        setExistingImage(data.hero_image_url || data.hero_image_path || "");
      } catch (e: any) {
        if (e?.status === 404) {
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
      for (const [key, val] of Object.entries(form)) {
        fd.append(key, String(val ?? ""));
      }
      if (slideId) {
        await apiClient.put(`/api/admin/hero-slides/${slideId}`, fd, { skipContentType: true });
        toast.success("Slide atualizado!");
      } else {
        await apiClient.post("/api/admin/hero-slides", fd, { skipContentType: true });
        toast.success("Slide criado!");
      }
      router.push("/admin/destaques/site-hero");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar slide.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] p-4 sm:p-6 text-white">
        <div className="mx-auto max-w-5xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-white/10" />
          <div className="h-[400px] rounded-2xl bg-white/5 border border-white/10" />
        </div>
      </div>
    );
  }

  // Resolve preview image
  const previewImage = imageObjUrl.current || (existingImage ? absUrl(existingImage) : "");
  const previewVideo = videoObjUrl.current || (existingVideo ? absUrl(existingVideo) : "");

  const previewSlide = {
    title: form.title,
    subtitle: form.subtitle,
    badge_text: form.badge_text,
    slide_type: form.slide_type,
    button_label: form.button_label,
    button_secondary_label: form.button_secondary_label,
    videoSrc: previewVideo,
    imageSrc: previewImage,
  };

  return (
    <div className="min-h-[70vh] p-4 sm:p-6 text-white">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {slideId ? "Editar Slide" : "Novo Slide"}
            </h1>
            <p className="text-sm text-white/60">
              {slideId ? "Altere os dados do slide." : "Crie um novo slide para o carrossel."}
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/destaques/site-hero"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition"
            >
              Cancelar
            </a>
            <button
              disabled={saving || hasErrors}
              onClick={handleSave}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Preview */}
          <div className="lg:col-span-3 order-1">
            <HeroSlidePreview slide={previewSlide} />
          </div>

          {/* Form */}
          <div className="lg:col-span-2 order-2 space-y-4">
            {/* Title + Subtitle */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="slideTitle" className="text-sm text-white/80">Título *</label>
                  <CharCounter value={form.title} max={LIMITS.title} />
                </div>
                <input
                  id="slideTitle"
                  value={form.title}
                  maxLength={LIMITS.title + 10}
                  onChange={(e) => update({ title: e.target.value })}
                  className={`w-full rounded-xl bg-black/30 border px-3 py-3 text-sm outline-none focus:ring-2 ${errors.title ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:border-primary/70 focus:ring-primary/20"}`}
                  placeholder="Ex: Promoção de inverno"
                />
                {errors.title ? <p className="mt-1 text-xs text-red-400">{errors.title}</p> : null}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="slideSubtitle" className="text-sm text-white/80">Subtítulo</label>
                  <CharCounter value={form.subtitle} max={LIMITS.subtitle} />
                </div>
                <textarea
                  id="slideSubtitle"
                  value={form.subtitle}
                  maxLength={LIMITS.subtitle + 10}
                  onChange={(e) => update({ subtitle: e.target.value })}
                  rows={2}
                  className={`w-full resize-none rounded-xl bg-black/30 border px-3 py-3 text-sm outline-none focus:ring-2 ${errors.subtitle ? "border-red-500/50 focus:ring-red-500/20" : "border-white/10 focus:border-primary/70 focus:ring-primary/20"}`}
                  placeholder="Descrição curta"
                />
                {errors.subtitle ? <p className="mt-1 text-xs text-red-400">{errors.subtitle}</p> : null}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="slideBadge" className="block text-sm text-white/80 mb-2">Badge</label>
                  <input id="slideBadge" value={form.badge_text} maxLength={100} onChange={(e) => update({ badge_text: e.target.value })} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20" placeholder="Ex: Novidade" />
                </div>
                <div>
                  <label htmlFor="slideType" className="block text-sm text-white/80 mb-2">Tipo</label>
                  <select id="slideType" value={form.slide_type} onChange={(e) => update({ slide_type: e.target.value })} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20">
                    {SLIDE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Media */}
            <HeroMediaUpload id="slideVideo" label="Vídeo" hint="MP4 recomendado." accept="video/*" maxBytes={LIMITS.videoMaxBytes} file={videoFile} error={errors.video} onFileChange={setVideoFile} />
            <HeroMediaUpload id="slideImage" label="Imagem" hint="Fallback se não houver vídeo." accept="image/*" maxBytes={LIMITS.imageMaxBytes} file={imageFile} error={errors.image} onFileChange={setImageFile} />

            {/* Existing media indicator */}
            {(existingVideo || existingImage) && !videoFile && !imageFile ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-white/50">
                Mídia atual: {existingVideo ? "vídeo" : ""}{existingVideo && existingImage ? " + " : ""}{existingImage ? "imagem" : ""} (envie novo arquivo para substituir)
              </div>
            ) : null}

            {/* Buttons */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
              <p className="font-semibold text-sm mb-2">Botões</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="btnLabel" className="block text-sm text-white/80 mb-2">Label principal</label>
                    <input id="btnLabel" value={form.button_label} maxLength={80} onChange={(e) => update({ button_label: e.target.value })} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20" placeholder="Saiba Mais" />
                  </div>
                  <div>
                    <label htmlFor="btnHref" className="block text-sm text-white/80 mb-2">Link principal</label>
                    <input id="btnHref" value={form.button_href} maxLength={255} onChange={(e) => update({ button_href: e.target.value })} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20" placeholder="/drones" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="btnSecLabel" className="block text-sm text-white/80 mb-2">Label secundário</label>
                    <input id="btnSecLabel" value={form.button_secondary_label} maxLength={80} onChange={(e) => update({ button_secondary_label: e.target.value })} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20" placeholder="Falar com especialista" />
                  </div>
                  <div>
                    <label htmlFor="btnSecHref" className="block text-sm text-white/80 mb-2">Link secundário</label>
                    <input id="btnSecHref" value={form.button_secondary_href} maxLength={255} onChange={(e) => update({ button_secondary_href: e.target.value })} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20" placeholder="/contatos" />
                  </div>
                </div>
              </div>
            </div>

            {/* Config */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
              <p className="font-semibold text-sm mb-2">Configurações</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="sortOrder" className="block text-sm text-white/80 mb-2">Ordem</label>
                  <input id="sortOrder" type="number" min={0} value={form.sort_order} onChange={(e) => update({ sort_order: Number(e.target.value) || 0 })} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm text-white/80 mb-2">Status</label>
                  <button type="button" onClick={() => update({ is_active: form.is_active ? 0 : 1 })} className={`w-full rounded-xl px-3 py-3 text-sm font-medium transition ${form.is_active ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-white/5 text-white/50 border border-white/10"}`}>
                    {form.is_active ? "Ativo" : "Inativo"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="startsAt" className="block text-sm text-white/80 mb-2">Início</label>
                  <input id="startsAt" type="datetime-local" value={form.starts_at} onChange={(e) => update({ starts_at: e.target.value })} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="endsAt" className="block text-sm text-white/80 mb-2">Fim</label>
                  <input id="endsAt" type="datetime-local" value={form.ends_at} onChange={(e) => update({ ends_at: e.target.value })} className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <p className="text-xs text-white/40">Início/Fim opcionais. Se preenchidos, o slide só aparece dentro do período.</p>
            </div>

            <button disabled={saving || hasErrors} onClick={handleSave} className="lg:hidden w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:opacity-90 disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
