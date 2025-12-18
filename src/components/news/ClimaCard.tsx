// src/components/news/ClimaCard.tsx
import Link from "next/link";
import type { PublicClima } from "@/lib/newsPublicApi";

export function ClimaCard({ item }: { item: PublicClima }) {
  return (
    <Link
      href={`/news/clima/${item.slug}`}
      className="block rounded-2xl border border-zinc-200 bg-white p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-zinc-900">
            {item.city_name} - {item.uf}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Slug: {item.slug}</p>
        </div>

        <div className="text-right">
          <p className="text-sm text-zinc-700">
            24h: <span className="font-semibold">{item.mm_24h ?? "-"}</span> mm
          </p>
          <p className="text-sm text-zinc-700">
            7d: <span className="font-semibold">{item.mm_7d ?? "-"}</span> mm
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
        <span>{item.source ? `Fonte: ${item.source}` : "Fonte: -"}</span>
        <span>{item.last_update_at ? `Atualizado: ${item.last_update_at}` : ""}</span>
      </div>
    </Link>
  );
}
