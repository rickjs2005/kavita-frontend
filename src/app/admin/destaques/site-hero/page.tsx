"use client";

import { useHeroAdmin } from "@/components/admin/hero/useHeroAdmin";
import HeroPreview from "@/components/admin/hero/HeroPreview";
import HeroForm from "@/components/admin/hero/HeroForm";

export default function SiteHeroAdminPage() {
  const {
    loading,
    saving,
    config,
    updateConfig,
    videoFile,
    setVideoFile,
    imageFile,
    setImageFile,
    videoPreview,
    imagePreview,
    errors,
    hasErrors,
    handleSave,
    handleBack,
  } = useHeroAdmin();

  if (loading) {
    return (
      <div className="min-h-[60vh] p-4 sm:p-6 text-white">
        <div className="mx-auto w-full max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded bg-white/10" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="h-[340px] rounded-2xl bg-white/5 border border-white/10" />
              <div className="h-[340px] rounded-2xl bg-white/5 border border-white/10" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] p-4 sm:p-6 text-white">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition"
              aria-label="Voltar"
              title="Voltar"
            >
              <span className="text-lg leading-none">&larr;</span>
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                Hero do Site
              </h1>
              <p className="text-sm text-white/60">
                Atualize vídeo/imagem do Hero e personalize o CTA.
              </p>
            </div>
          </div>

          <button
            disabled={saving || hasErrors}
            onClick={handleSave}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>

        {/* Layout: Preview + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          <div className="lg:col-span-3 order-1">
            <HeroPreview
              videoPreview={videoPreview}
              imagePreview={imagePreview}
              title={config.title}
              subtitle={config.subtitle}
              buttonLabel={config.button_label}
              buttonHref={config.button_href}
            />
          </div>

          <div className="lg:col-span-2 order-2">
            <HeroForm
              config={config}
              onConfigChange={updateConfig}
              videoFile={videoFile}
              onVideoFileChange={setVideoFile}
              imageFile={imageFile}
              onImageFileChange={setImageFile}
              errors={errors}
              hasErrors={hasErrors}
              saving={saving}
              onSave={handleSave}
            />
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
