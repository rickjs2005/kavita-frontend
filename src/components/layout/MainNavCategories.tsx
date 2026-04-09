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
        className={`inline-flex items-center gap-1.5 text-[13px] font-bold px-4 py-1.5 rounded-full transition-all border ${
          pathname.startsWith("/drones")
            ? "border-accent-bright/70 bg-accent-bright/20 text-accent-bright shadow-[0_0_10px_rgba(255,122,0,0.2)]"
            : "border-accent-bright/40 text-accent-bright hover:border-accent-bright/70 hover:bg-accent-bright/15 hover:text-accent-bright hover:shadow-[0_0_8px_rgba(255,122,0,0.15)]"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        Kavita Drone
      </Link>
    </nav>
  );
}
