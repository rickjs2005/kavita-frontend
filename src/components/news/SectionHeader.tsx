// src/components/news/SectionHeader.tsx
import Link from "next/link";

export function SectionHeader({
  title,
  href,
  actionLabel = "Ver mais",
  subtitle,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-zinc-900">{title}</h2>
        {subtitle ? <p className="text-sm text-zinc-600 mt-1">{subtitle}</p> : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
