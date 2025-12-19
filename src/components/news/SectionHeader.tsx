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
    <div
      className="
        flex flex-col gap-3
        sm:flex-row sm:items-end sm:justify-between
      "
    >
      <div className="flex flex-col gap-1">
        {/* kicker visual discreto */}
        <div className="flex items-center gap-2">
          <span className="h-1 w-6 rounded-full bg-emerald-600" aria-hidden />
          <h2 className="text-lg md:text-xl font-semibold text-zinc-900">
            {title}
          </h2>
        </div>

        {subtitle ? (
          <p className="text-sm text-zinc-600 leading-relaxed">
            {subtitle}
          </p>
        ) : null}
      </div>

      {href ? (
        <Link
          href={href}
          className="
            inline-flex items-center gap-1
            text-sm font-medium text-emerald-700
            hover:text-emerald-800
            focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
            rounded-md
            whitespace-nowrap
          "
        >
          {actionLabel}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      ) : null}
    </div>
  );
}
