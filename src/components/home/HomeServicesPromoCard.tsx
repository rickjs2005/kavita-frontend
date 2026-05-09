// src/components/home/HomeServicesPromoCard.tsx
//
// Card promocional "Rede de Serviços" exibido na home pública, acima
// da listagem real de profissionais (ServicosSection).
//
// Puramente apresentacional — sem fetch nem state. Recebe imageSrc/alt
// opcional; quando ausente, usa um background-gradient + ilustração SVG
// placeholder, evitando dependência de assets que talvez não existam.
//
// Acessibilidade:
//   - <article aria-labelledby="..."> para a relação título<>card
//   - avatares e selo são decorativos (aria-hidden)
//   - CTAs são <Link> reais com href existente (/servicos e /trabalhe-conosco)

"use client";

import Link from "next/link";
import Image from "next/image";

type AvatarItem = { src: string; alt: string };

type Props = {
  imageSrc?: string;
  imageAlt?: string;
  /**
   * Até 3 avatares fotográficos para o stack do canto inferior direito.
   * Quando ausente (ou vazio), o componente cai nos AvatarStub SVG —
   * mantém o card funcional mesmo sem assets.
   */
  avatars?: AvatarItem[];
  className?: string;
};

const HEADING_ID = "home-services-promo-title";

export default function HomeServicesPromoCard({
  imageSrc,
  imageAlt = "Profissional do agro Kavita",
  avatars,
  className = "",
}: Props) {
  const photoAvatars = avatars?.slice(0, 3) ?? [];
  const hasPhotoAvatars = photoAvatars.length > 0;
  return (
    <article
      aria-labelledby={HEADING_ID}
      className={[
        "overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm sm:rounded-[32px]",
        className,
      ].join(" ")}
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr]">
        {/* ── Lado texto + CTAs ─────────────────────────────────── */}
        <div className="relative bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 px-6 py-7 sm:px-8 sm:py-9 md:px-10 md:py-11">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Rede de Serviços
          </p>
          <h2
            id={HEADING_ID}
            className="mt-2 text-xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-2xl md:text-[1.65rem]"
          >
            Profissionais para te
            <br className="hidden sm:inline" /> ajudar no campo
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600 sm:text-[15px]">
            Veterinários, agrônomos, mecânicos e outros prestadores.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6 sm:gap-3">
            <Link
              href="/servicos"
              className="inline-flex h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              Ver profissionais
            </Link>
            <Link
              href="/trabalhe-conosco"
              className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-600 bg-white px-5 text-[13px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              Quero prestar serviços
            </Link>
          </div>
        </div>

        {/* ── Lado ilustração + avatares + selo ─────────────────── */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-100/40 sm:h-56 md:h-auto md:min-h-[260px]">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <PlaceholderIllustration />
          )}

          {/* Selo verificado — canto superior direito */}
          <span
            aria-hidden
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-4 ring-white sm:right-5 sm:top-5"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5L9.5 17 19 7" />
            </svg>
          </span>

          {/* Stack de avatares — canto inferior direito */}
          <div className="absolute bottom-4 right-4 flex -space-x-2.5 sm:bottom-5 sm:right-5">
            {hasPhotoAvatars ? (
              photoAvatars.map((av, i) => (
                <AvatarPhoto key={`${av.src}-${i}`} src={av.src} alt={av.alt} />
              ))
            ) : (
              <>
                <AvatarStub gradient="from-emerald-400 to-emerald-600" />
                <AvatarStub gradient="from-amber-300 to-amber-500" />
                <AvatarStub gradient="from-sky-400 to-sky-600" />
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Sub-componentes internos
   ────────────────────────────────────────────────────────────────── */

function PlaceholderIllustration() {
  // SVG decorativo simples: silhueta abstrata de pessoa com chapéu
  // sobre o gradiente verde. Sem dependência de asset externo.
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 200"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="bgFigGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.32" />
        </linearGradient>
      </defs>

      {/* Sol/halo */}
      <circle cx="160" cy="40" r="30" fill="#10b981" opacity="0.12" />

      {/* Silhueta de pessoa com chapéu */}
      <g fill="url(#bgFigGrad)">
        {/* Chapéu */}
        <ellipse cx="100" cy="78" rx="42" ry="6" />
        <path d="M76 78 Q76 60 100 60 Q124 60 124 78 Z" />
        {/* Cabeça */}
        <circle cx="100" cy="92" r="18" />
        {/* Tronco/ombros */}
        <path d="M64 200 Q64 130 100 122 Q136 130 136 200 Z" />
      </g>

      {/* Folhas decorativas no canto */}
      <g fill="#10b981" opacity="0.35">
        <path d="M16 168 Q22 156 32 158 Q26 168 16 168 Z" />
        <path d="M28 180 Q36 170 46 174 Q38 184 28 180 Z" />
      </g>
    </svg>
  );
}

function AvatarStub({ gradient }: { gradient: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${gradient} ring-2 ring-white shadow-sm`}
    >
      {/* Silhueta de pessoa, branca translúcida */}
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7 text-white/85"
        fill="currentColor"
      >
        <circle cx="12" cy="9" r="3.5" />
        <path d="M5 21c1-4 4-6 7-6s6 2 7 6H5z" />
      </svg>
    </span>
  );
}

function AvatarPhoto({ src, alt }: AvatarItem) {
  return (
    <span className="relative inline-flex h-10 w-10 overflow-hidden rounded-full bg-emerald-50 ring-2 ring-white shadow-sm">
      <Image src={src} alt={alt} fill className="object-cover" sizes="40px" />
    </span>
  );
}
