// src/components/admin/hero/HeroForm.tsx
"use client";

import type { HeroData } from "@/types/hero";
import type { FieldErrors } from "./useHeroAdmin";
import { LIMITS } from "./useHeroAdmin";
import HeroMediaUpload from "./HeroMediaUpload";

type Props = {
  config: HeroData;
  onConfigChange: (patch: Partial<HeroData>) => void;
  videoFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  imageFile: File | null;
  onImageFileChange: (file: File | null) => void;
  errors: FieldErrors;
  hasErrors: boolean;
  saving: boolean;
  onSave: () => void;
};

function CharCounter({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <span
      className={`text-xs tabular-nums ${over ? "text-red-400 font-medium" : "text-white/40"}`}
    >
      {len}/{max}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

export default function HeroForm({
  config,
  onConfigChange,
  videoFile,
  onVideoFileChange,
  imageFile,
  onImageFileChange,
  errors,
  hasErrors,
  saving,
  onSave,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
      <p className="font-semibold mb-3">Configurações</p>

      <div className="space-y-4">
        {/* Titulo / Subtitulo */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="heroTitleInput"
                className="block text-sm text-white/80"
              >
                Título (opcional)
              </label>
              <CharCounter value={config.title || ""} max={LIMITS.title} />
            </div>
            <input
              id="heroTitleInput"
              name="heroTitleInput"
              value={config.title || ""}
              maxLength={LIMITS.title + 10}
              onChange={(e) => onConfigChange({ title: e.target.value })}
              className={`w-full rounded-xl bg-black/30 border px-3 py-3 text-sm outline-none focus:ring-2 ${
                errors.title
                  ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                  : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
              }`}
              placeholder="Ex: Tecnologia que transforma o campo"
            />
            <FieldError message={errors.title} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="heroSubtitleInput"
                className="block text-sm text-white/80"
              >
                Subtítulo (opcional)
              </label>
              <CharCounter value={config.subtitle || ""} max={LIMITS.subtitle} />
            </div>
            <textarea
              id="heroSubtitleInput"
              name="heroSubtitleInput"
              value={config.subtitle || ""}
              maxLength={LIMITS.subtitle + 10}
              onChange={(e) => onConfigChange({ subtitle: e.target.value })}
              rows={3}
              className={`w-full resize-none rounded-xl bg-black/30 border px-3 py-3 text-sm outline-none focus:ring-2 ${
                errors.subtitle
                  ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                  : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
              }`}
              placeholder="Ex: Os drones agrícolas mais avançados do mercado"
            />
            <FieldError message={errors.subtitle} />
          </div>

          <p className="text-xs text-white/50">
            Se deixar vazio, o site mostra um texto padrão no Hero.
          </p>
        </div>

        {/* Upload Video */}
        <HeroMediaUpload
          id="heroVideoInput"
          label="Vídeo do Hero"
          hint="Recomendo mp4 (leve e rápido)."
          accept="video/*"
          maxBytes={LIMITS.videoMaxBytes}
          file={videoFile}
          error={errors.video}
          onFileChange={onVideoFileChange}
        />

        {/* Upload Imagem */}
        <HeroMediaUpload
          id="heroImageInput"
          label="Imagem (fallback)"
          hint="Usada quando não houver vídeo."
          accept="image/*"
          maxBytes={LIMITS.imageMaxBytes}
          file={imageFile}
          error={errors.image}
          onFileChange={onImageFileChange}
        />

        {/* CTA */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="buttonLabelInput"
                className="block text-sm text-white/80"
              >
                Label do botão
              </label>
              <CharCounter
                value={config.button_label}
                max={LIMITS.button_label}
              />
            </div>
            <input
              id="buttonLabelInput"
              name="buttonLabelInput"
              value={config.button_label}
              maxLength={LIMITS.button_label + 10}
              onChange={(e) =>
                onConfigChange({ button_label: e.target.value })
              }
              className={`w-full rounded-xl bg-black/30 border px-3 py-3 text-sm outline-none focus:ring-2 ${
                errors.button_label
                  ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                  : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
              }`}
              placeholder="Ex: Saiba Mais"
            />
            <FieldError message={errors.button_label} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="buttonHrefInput"
                className="block text-sm text-white/80"
              >
                Link do botão (href)
              </label>
              <CharCounter
                value={config.button_href}
                max={LIMITS.button_href}
              />
            </div>
            <input
              id="buttonHrefInput"
              name="buttonHrefInput"
              value={config.button_href}
              maxLength={LIMITS.button_href + 10}
              onChange={(e) =>
                onConfigChange({ button_href: e.target.value })
              }
              className={`w-full rounded-xl bg-black/30 border px-3 py-3 text-sm outline-none focus:ring-2 ${
                errors.button_href
                  ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                  : "border-white/10 focus:border-primary/70 focus:ring-primary/20"
              }`}
              placeholder="/drones ou https://..."
            />
            {errors.button_href ? (
              <FieldError message={errors.button_href} />
            ) : (
              <p className="text-xs text-white/50 mt-1">
                Rota interna (/drones) ou link externo (https://...).
              </p>
            )}
          </div>
        </div>

        {/* Salvar (mobile) */}
        <button
          disabled={saving || hasErrors}
          onClick={onSave}
          className="lg:hidden inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:opacity-90 disabled:opacity-50 w-full"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
