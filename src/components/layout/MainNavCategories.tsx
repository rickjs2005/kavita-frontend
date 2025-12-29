"use client";

import Link from "next/link";

export type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  is_active?: boolean | 0 | 1;
};

type Props = {
  categories: PublicCategory[];
};

export default function MainNavCategories({ categories }: Props) {
  if (!categories || categories.length === 0) return null;

  return (
    <nav className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 md:gap-x-8 md:gap-y-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/categorias/${cat.slug}`}
          className="text-sm font-medium text-emerald-50/95 hover:text-[#EC5B20] transition-colors"
        >
          {cat.name}
        </Link>
      ))}

      <Link
        href="/servicos"
        className="text-sm font-medium text-emerald-50/95 hover:text-[#EC5B20] transition-colors"
      >
        Serviços
      </Link>

      {/* Link manual do Drone */}
      <Link
        href="/drones"
        className="text-sm font-semibold text-[#38bdf8]/110 hover:text-[#EC5B20] transition-colors"
      >
        Kavita Drone
      </Link>
    </nav>
  );
}
