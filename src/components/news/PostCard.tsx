// src/components/news/PostCard.tsx
import Link from "next/link";
import type { PublicPost } from "@/lib/newsPublicApi";

export function PostCard({ item }: { item: PublicPost }) {
  return (
    <Link
      href={`/news/posts/${item.slug}`}
      className="block rounded-2xl border border-zinc-200 bg-white overflow-hidden hover:shadow-sm transition-shadow"
    >
      {item.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.cover_image_url}
          alt={item.title}
          className="h-40 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-40 w-full bg-zinc-100" />
      )}

      <div className="p-4">
        <p className="font-semibold text-zinc-900 line-clamp-2">{item.title}</p>
        <p className="text-sm text-zinc-600 mt-2 line-clamp-3">
          {item.excerpt || "Sem resumo."}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
          <span>{item.category ? `Categoria: ${item.category}` : "Sem categoria"}</span>
          <span>{item.published_at ? item.published_at : ""}</span>
        </div>
      </div>
    </Link>
  );
}
