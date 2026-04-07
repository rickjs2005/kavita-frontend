// src/components/admin/hero/HeroPreview.tsx
"use client";

type Props = {
  videoPreview: string;
  imagePreview: string;
  title?: string;
  subtitle?: string;
  buttonLabel: string;
  buttonHref: string;
};

export default function HeroPreview({
  videoPreview,
  imagePreview,
  title,
  subtitle,
  buttonLabel,
  buttonHref,
}: Props) {
  const hasAnyMedia = Boolean(videoPreview || imagePreview);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="font-semibold">Preview</p>
        <div className="hidden sm:flex items-center gap-2 text-xs text-white/60">
          <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1">
            {videoPreview ? "Vídeo" : imagePreview ? "Imagem" : "Vazio"}
          </span>
          <span className="rounded-full border border-white/10 bg-black/30 px-2 py-1">
            Responsivo
          </span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
        <div className="aspect-[16/9] w-full">
          {videoPreview ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={videoPreview}
              autoPlay
              loop
              muted
              playsInline
            />
          ) : imagePreview ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${imagePreview}')` }}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-white/70">
              <div className="text-center px-6">
                <p className="font-semibold">Sem mídia definida</p>
                <p className="text-sm text-white/50 mt-1">
                  Envie um vídeo ou imagem para ver o Hero aqui.
                </p>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />

          <div className="relative z-10 flex h-full items-end p-4 sm:p-6">
            <div className="max-w-xl">
              <h2 className="text-lg sm:text-2xl font-bold leading-tight">
                {title?.trim() ? title : "Seu título aqui"}
              </h2>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-white/80">
                {subtitle?.trim() ? subtitle : "Seu subtítulo aqui"}
              </p>

              <div className="mt-4 sm:mt-5 flex flex-col xs:flex-row gap-2 xs:items-center">
                <a
                  href={buttonHref || "#"}
                  className="inline-flex w-full xs:w-auto items-center justify-center rounded-xl border border-primary bg-black/20 px-5 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-primary/25 transition"
                >
                  {buttonLabel || "Saiba Mais"}
                </a>
                <div className="text-xs text-white/55">
                  {hasAnyMedia ? "Preview do CTA ativo" : "Defina uma mídia"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-white/50">
        *Se enviar vídeo, ele tem prioridade sobre a imagem (fallback).
      </p>
    </div>
  );
}
