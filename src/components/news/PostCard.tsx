// src/components/news/PostCard.tsx
import Link from "next/link";
import type { PublicPost } from "@/lib/newsPublicApi";

function formatDatePtBR(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

/**
 * resolveCoverUrl(item)
 * - tenta cover_image_url
 * - fallback para nomes comuns: cover, cover_url, coverImageUrl, image_url, thumbnail_url
 * - se relativa (/...), prefixa com NEXT_PUBLIC_API_URL
 * - encodeURI para evitar quebra por espaços e caracteres
 */
function resolveCoverUrl(item: any): string | null {
  const candidates = [
    item?.cover_image_url,
    item?.cover,
    item?.cover_url,
    item?.coverImageUrl,
    item?.image_url,
    item?.thumbnail_url,
  ];

  const raw = candidates.find((v) => typeof v === "string" && v.trim().length > 0) as string | undefined;
  if (!raw) return null;

  const trimmed = raw.trim();
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  // URL relativa -> absoluta
  const absolute = trimmed.startsWith("/")
    ? `${base}${trimmed}`
    : trimmed;

  try {
    return encodeURI(absolute);
  } catch {
    return absolute; // fallback seguro
  }
}

function getEmoji(item: any): string {
  const hay = `${item?.category ?? ""} ${item?.tags ?? ""} ${item?.title ?? ""}`.toLowerCase();
  // 1 emoji funcional por card (no título)
  if (hay.includes("agro") || hay.includes("fazenda") || hay.includes("soja") || hay.includes("milho") || hay.includes("café") || hay.includes("cafe")) {
    return "🌾";
  }
  return "📰";
}

export function PostCard({ item }: { item: PublicPost }) {
  const coverUrl = resolveCoverUrl(item);
  const emoji = getEmoji(item);
  const published = formatDatePtBR((item as any)?.published_at);

  return (
    <Link
      href={`/news/posts/${item.slug}`}
      className="
        group block overflow-hidden rounded-2xl border border-zinc-200 bg-white
        shadow-sm transition-all
        hover:-translate-y-[1px] hover:shadow-md hover:border-zinc-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
      "
      aria-label={`Abrir matéria: ${item.title}`}
    >
      <div className="relative">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={`Capa da matéria: ${item.title}`}
            className="h-44 w-full object-cover md:h-40"
            loading="lazy"
          />
        ) : (
          <div className="h-44 w-full bg-gradient-to-b from-zinc-100 to-white md:h-40">
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <div className="text-2xl" aria-hidden>📰</div>
                <p className="mt-1 text-xs font-medium text-zinc-600">Sem imagem de capa</p>
              </div>
            </div>
          </div>
        )}

        {/* Selo editorial discreto */}
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            {emoji} Kavita News
          </span>
        </div>
      </div>

      <div className="p-4 md:p-5">
        <p className="text-base font-semibold leading-snug text-zinc-900 line-clamp-2">
          {item.title}
        </p>

        <p className="mt-2 text-sm leading-relaxed text-zinc-600 line-clamp-3">
          {item.excerpt || "Resumo indisponível no momento."}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span className="truncate">
            {item.category ? `Categoria: ${item.category}` : "Categoria: Geral"}
          </span>
          <span className="shrink-0">{published ? published : ""}</span>
        </div>
      </div>
    </Link>
  );
}
