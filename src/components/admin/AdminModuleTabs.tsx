"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ModuleTab = {
  label: string;
  href: string;
  /** Usa igualdade exata em vez de startsWith. Use em rotas raiz (ex: /admin/relatorios). */
  exact?: boolean;
};

type Props = {
  tabs: ModuleTab[];
};

/**
 * Barra de abas horizontal para sub-módulos do admin.
 * Coloque em um layout.tsx para compartilhar entre todas as sub-rotas do módulo.
 */
export function AdminModuleTabs({ tabs }: Props) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação do módulo"
      className="flex gap-0 overflow-x-auto border-b border-slate-800 bg-slate-950 scrollbar-none"
    >
      {tabs.map((tab) => {
        const isActive = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(tab.href + "/");

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`
              relative shrink-0 px-4 py-3 text-sm font-medium transition-colors
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-light
              ${isActive ? "text-teal-light" : "text-slate-400 hover:text-slate-200"}
            `}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-sm bg-teal-light" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
