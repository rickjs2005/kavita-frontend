// src/components/news/PostCard.tsx
//
// Post card em dark glass premium. Parte do redesign do /news como
// central de inteligência do agro. Mesmo DNA das outras telas dark
// committed do projeto (Drones, Mercado do Café), mas com accent
// emerald-400 como signature do News.

import Link from "next/link";
import type { PublicPost } from "@/lib/newsPublicApi";
import { absUrl } from "@/utils/absUrl";

function formatDatePtBR(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
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

export function PostCard({ item }: { item: PublicPost }) {
  const coverUrl = getCoverUrl(item);
  const published = formatDatePtBR((item as any)?.published_at);

  return (
    <Link
      href={`/news/posts/${item.slug}`}
      className="
        group relative block overflow-hidden rounded-2xl bg-white/[0.04]
        ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm
        transition-all duration-300
        hover:-translate-y-0.5 hover:bg-white/[0.06] hover:ring-emerald-400/30
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50
      "
      aria-label={`Abrir matéria: ${item.title}`}
    >
      {/* Top highlight emerald */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 z-10 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent"
      />

      <div className="relative">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`Capa da matéria: ${item.title}`}
            className="h-44 w-full object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100 md:h-44"
            loading="lazy"
          />
        ) : (
          <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-stone-900 via-stone-950 to-emerald-950/30 md:h-44">
            <div className="text-center">
              <div className="text-3xl opacity-40" aria-hidden>
                📰
              </div>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
                Sem capa
              </p>
            </div>
          </div>
        )}

        {/* Overlay para legibilidade do selo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-stone-950/60 via-transparent to-transparent"
        />

        {/* Selo editorial */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300 ring-1 ring-emerald-400/30 backdrop-blur-md">
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
              aria-hidden
            />
            Kavita News
          </span>
        </div>
      </div>

      <div className="relative p-5">
        <p className="text-[15px] font-semibold leading-snug tracking-tight text-stone-50 line-clamp-2 transition-colors group-hover:text-white">
          {item.title}
        </p>

        <p className="mt-2 text-[13px] leading-relaxed text-stone-400 line-clamp-3">
          {item.excerpt || "Resumo indisponível no momento."}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-[10px] font-semibold uppercase tracking-[0.14em]">
          <span className="truncate text-stone-500">
            {item.category || "Geral"}
          </span>
          <span className="shrink-0 text-stone-500">{published}</span>
        </div>
      </div>
    </Link>
  );
}
