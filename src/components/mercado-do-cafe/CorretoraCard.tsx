// src/components/mercado-do-cafe/CorretoraCard.tsx
import Link from "next/link";
import Image from "next/image";
import type { PublicCorretora } from "@/types/corretora";
import { absUrl } from "@/utils/absUrl";
import { CorretoraContactChannels } from "./CorretoraContactChannels";

type Props = {
  corretora: PublicCorretora;
};

export function CorretoraCard({ corretora }: Props) {
  const isFeatured = corretora.is_featured === true || corretora.is_featured === 1;

  return (
    <Link
      href={`/mercado-do-cafe/corretoras/${corretora.slug}`}
      className="
        group block rounded-2xl border border-zinc-200 bg-white p-5 md:p-6
        shadow-sm transition-all
        hover:-translate-y-[1px] hover:shadow-md hover:border-zinc-300
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
      "
      aria-label={`Ver detalhes: ${corretora.name}`}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 overflow-hidden">
          {corretora.logo_path ? (
            <Image
              src={absUrl(corretora.logo_path)}
              alt={`Logo ${corretora.name}`}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl" aria-hidden>☕</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name + Featured badge */}
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-zinc-900">
              {corretora.name}
            </h3>
            {isFeatured && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                ⭐ Destaque
              </span>
            )}
          </div>

          {/* Location */}
          <p className="mt-0.5 text-xs text-zinc-500">
            📍 {corretora.city}, {corretora.state}
            {corretora.region ? ` — ${corretora.region}` : ""}
          </p>

          {/* Description snippet */}
          {corretora.description && (
            <p className="mt-2 text-sm text-zinc-600 line-clamp-2">
              {corretora.description}
            </p>
          )}

          {/* Contact channels (compact) */}
          <div className="mt-3">
            <CorretoraContactChannels corretora={corretora} variant="compact" />
          </div>
        </div>
      </div>

      {/* See more */}
      <div className="mt-3 flex items-center justify-end">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          Ver detalhes
          <span
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
