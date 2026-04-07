// src/components/admin/hero/HeroForm.tsx
"use client";

import type { HeroConfig } from "./types";
import HeroMediaUpload from "./HeroMediaUpload";

type Props = {
  config: HeroConfig;
  onConfigChange: (patch: Partial<HeroConfig>) => void;
  videoFile: File | null;
  onVideoFileChange: (file: File | null) => void;
  imageFile: File | null;
  onImageFileChange: (file: File | null) => void;
  saving: boolean;
  onSave: () => void;
};

export default function HeroForm({
  config,
  onConfigChange,
  videoFile,
  onVideoFileChange,
  imageFile,
  onImageFileChange,
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
            <label
              htmlFor="heroTitleInput"
              className="block text-sm text-white/80 mb-2"
            >
              Título (opcional)
            </label>
            <input
              id="heroTitleInput"
              name="heroTitleInput"
              value={config.title || ""}
              onChange={(e) => onConfigChange({ title: e.target.value })}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
              placeholder="Ex: Tecnologia que transforma o campo"
            />
          </div>

          <div>
            <label
              htmlFor="heroSubtitleInput"
              className="block text-sm text-white/80 mb-2"
            >
              Subtítulo (opcional)
            </label>
            <textarea
              id="heroSubtitleInput"
              name="heroSubtitleInput"
              value={config.subtitle || ""}
              onChange={(e) => onConfigChange({ subtitle: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
              placeholder="Ex: Os drones agrícolas mais avançados do mercado"
            />
          </div>

          <p className="text-xs text-white/50">
            Se deixar vazio, o site pode mostrar um texto padrão (ou nada) no
            Hero.
          </p>
        </div>

        {/* Upload Video */}
        <HeroMediaUpload
          id="heroVideoInput"
          label="Vídeo do Hero"
          hint="Recomendo mp4 (leve e rápido)."
          accept="video/*"
          file={videoFile}
          onFileChange={onVideoFileChange}
        />

        {/* Upload Imagem */}
        <HeroMediaUpload
          id="heroImageInput"
          label="Imagem (fallback)"
          hint="Usada quando não houver vídeo."
          accept="image/*"
          file={imageFile}
          onFileChange={onImageFileChange}
        />

        {/* CTA */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 sm:p-4 space-y-3">
          <div>
            <label
              htmlFor="buttonLabelInput"
              className="block text-sm text-white/80 mb-2"
            >
              Label do botão
            </label>
            <input
              id="buttonLabelInput"
              name="buttonLabelInput"
              value={config.button_label}
              onChange={(e) => onConfigChange({ button_label: e.target.value })}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
              placeholder="Ex: Saiba Mais"
            />
          </div>

          <div>
            <label
              htmlFor="buttonHrefInput"
              className="block text-sm text-white/80 mb-2"
            >
              Link do botão (href)
            </label>
            <input
              id="buttonHrefInput"
              name="buttonHrefInput"
              value={config.button_href}
              onChange={(e) => onConfigChange({ button_href: e.target.value })}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-3 py-3 text-sm outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20"
              placeholder="/drones ou https://..."
            />
            <p className="text-xs text-white/50 mt-2">
              Aceita rota interna (/drones) ou link externo (https://...).
            </p>
          </div>
        </div>

        {/* Salvar (mobile) */}
        <button
          disabled={saving}
          onClick={onSave}
          className="lg:hidden inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:opacity-90 disabled:opacity-50 w-full"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
