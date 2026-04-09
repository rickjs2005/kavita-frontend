"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();

  if (!categories || categories.length === 0) return null;

  return (
    <nav
      className="flex items-center gap-x-1 overflow-x-auto scrollbar-hide whitespace-nowrap"
      aria-label="Categorias da loja"
    >
      {/* Categorias da loja */}
      {categories.map((cat) => {
        const href = `/categorias/${cat.slug}`;
        const isActive = pathname === href;

        return (
          <Link
            key={cat.id}
            href={href}
            className={`text-[13px] font-medium px-3 py-1.5 rounded-full transition-colors ${
              isActive
                ? "bg-white/15 text-white"
                : "text-white/80 hover:text-white hover:bg-white/10"
            }`}
          >
            {cat.name}
          </Link>
        );
      })}

      {/* Separador visual */}
      <span className="w-px h-4 bg-white/20 mx-1.5 shrink-0" aria-hidden />

      {/* Links fixos */}
      <Link
        href="/servicos"
        className={`text-[13px] font-medium px-3 py-1.5 rounded-full transition-colors ${
          pathname.startsWith("/servicos")
            ? "bg-white/15 text-white"
            : "text-white/80 hover:text-white hover:bg-white/10"
        }`}
      >
        Serviços
      </Link>

      <Link
        href="/drones"
        className={`text-[13px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
          pathname.startsWith("/drones")
            ? "bg-white/15 text-white"
            : "text-info/90 hover:text-white hover:bg-white/10"
        }`}
      >
        Kavita Drone
      </Link>
    </nav>
  );
}
