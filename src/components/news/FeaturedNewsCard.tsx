// src/components/news/FeaturedNewsCard.tsx
//
// Magazine card editorial usado no carrossel "Destaques do dia" da home
// do Kavita News. Difere do PostCard padrao em:
//   - imagem dominante (aspect 16/10 grande)
//   - overlay gradient escuro na base ja garante legibilidade
//   - tag de categoria colorida (mapa em categoryColors.ts)
//   - titulo *sobre* a imagem, na metade inferior
//   - meta date + tempo de leitura
//   - hover lift + brightness na imagem
//
// Inspiracao visual: Bloomberg / Stripe / Arc / Morning Brew.

import Link from "next/link";
import type { PublicPost } from "@/lib/newsPublicApi";
import { absUrl } from "@/utils/absUrl";
import { getCategoryStyle, getCategoryLabel } from "@/utils/kavita-news/categoryColors";

function formatDatePtBR(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(d);
}

function getCoverUrl(item: any): string | null {
  const candidates = [
    item?.cover_image_url,
    item?.cover,
    item?.cover_url,
    item?.coverImageUrl,
    item?.image_url,
    item?.thumbnail_url,
  ];
  const raw = candidates.find(
    (v) => typeof v === "string" && v.trim().length > 0,
  ) as string | undefined;
  if (!raw) return null;
  try {
    return encodeURI(absUrl(raw.trim()));
  } catch {
    return absUrl(raw.trim());
  }
}

/** Estimativa simples de tempo de leitura em min, se houver content. */
function estimateReadMinutes(item: any): number {
  const text: string =
    typeof item?.content === "string"
      ? item.content
      : typeof item?.excerpt === "string"
        ? item.excerpt
        : "";
  const words = text
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  // 220 palavras/min e' uma media para texto editorial em PT.
  return Math.max(2, Math.ceil(words / 220));
}

export type FeaturedNewsCardProps = {
  item: PublicPost;
  /** Variante "hero" — bigger card pra usar no lado direito do hero. */
  variant?: "default" | "hero";
};

export function FeaturedNewsCard({ item, variant = "default" }: FeaturedNewsCardProps) {
  const coverUrl = getCoverUrl(item);
  const published = formatDatePtBR((item as any)?.published_at);
  const readMin = estimateReadMinutes(item);
  const catStyle = getCategoryStyle(item.category);
  const catLabel = getCategoryLabel(item.category);

  const isHero = variant === "hero";

  return (
    <Link
      href={`/news/posts/${item.slug}`}
      aria-label={`Abrir matéria: ${item.title}`}
      className={`
        group relative block overflow-hidden rounded-3xl bg-stone-900/60
        ring-1 ring-white/[0.08] shadow-2xl shadow-black/50 backdrop-blur-sm
        transition-all duration-300
        hover:-translate-y-1 hover:ring-emerald-400/40
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60
        ${isHero ? "h-full min-h-[420px] md:min-h-[520px]" : "h-full"}
      `}
    >
      {/* Imagem dominante — preenche todo o card, conteudo flutua sobre ela */}
      <div className="absolute inset-0">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            loading={isHero ? "eager" : "lazy"}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-950/40 via-stone-900 to-stone-950">
            <span className="text-6xl opacity-25" aria-hidden>
              🌾
            </span>
          </div>
        )}
      </div>

      {/* Overlay base — escurece a parte de baixo pra texto ficar legivel */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/10"
      />

      {/* Hairline emerald no topo — assinatura do modulo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent"
      />

      {/* Conteudo */}
      <div
        className={`relative flex h-full flex-col justify-end p-6 ${
          isHero ? "md:p-10" : "md:p-7"
        }`}
      >
        {/* Tag de categoria */}
        <div className="mb-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ring-1 backdrop-blur-md ${catStyle.chip}`}
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${catStyle.dot}`}
            />
            {catLabel}
          </span>
        </div>

        {/* Titulo */}
        <h3
          className={`font-bold leading-[1.1] tracking-tight text-stone-50 transition-colors group-hover:text-white ${
            isHero
              ? "text-2xl md:text-3xl lg:text-4xl line-clamp-3"
              : "text-lg md:text-xl line-clamp-3"
          }`}
        >
          {item.title}
        </h3>

        {/* Meta — data e tempo de leitura */}
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-stone-400">
          {published && (
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden>📅</span>
              {published}
            </span>
          )}
          {published && <span aria-hidden className="text-stone-600">·</span>}
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>⏱</span>
            {readMin} min de leitura
          </span>
        </div>

        {/* Chevron decorativo no canto inferior direito (somente hero) */}
        {isHero && (
          <span
            aria-hidden
            className="
              pointer-events-none absolute bottom-6 right-6 inline-flex h-10 w-10
              items-center justify-center rounded-full bg-stone-900/70 text-stone-200
              ring-1 ring-white/15 backdrop-blur-md transition-all
              group-hover:bg-emerald-500 group-hover:text-stone-950
              group-hover:ring-emerald-400 group-hover:shadow-lg group-hover:shadow-emerald-500/40
              md:bottom-10 md:right-10
            "
          >
            →
          </span>
        )}
      </div>
    </Link>
  );
}
