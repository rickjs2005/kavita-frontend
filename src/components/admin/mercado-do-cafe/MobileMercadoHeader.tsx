"use client";

// MobileMercadoHeader.tsx
//
// Header mobile-only (md:hidden) da pagina /admin/mercado-do-cafe.
// Renderizado em paralelo ao AdminPageHeader desktop (que continua
// servindo o md+). Foco em hierarquia tipografica enxuta:
//
//   eyebrow  text-[10px] uppercase tracking-[0.18em] opacity-70
//   titulo   text-2xl font-semibold
//   subtitulo text-sm text-slate-400 line-clamp-2
//
// Acoes em uma so linha:
//   [+ Nova Corretora ............]  [⋮ kebab]
//
// Kebab abre menu com 4 acoes secundarias (Metricas, Reconciliacao,
// Backfill, Historico) — mesmas que o desktop expoe inline.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreVertical, Plus } from "lucide-react";

export type SecondaryActionItem = {
  href: string;
  label: string;
  icon: string;
  ariaLabel: string;
  title: string;
};

type Props = {
  secondaryActions: SecondaryActionItem[];
  primaryHref: string;
  primaryLabel: string;
};

export default function MobileMercadoHeader({
  secondaryActions,
  primaryHref,
  primaryLabel,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Fecha menu ao clicar fora ou pressionar ESC.
  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="flex w-full flex-col gap-3 md:hidden">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400/70">
          Kavita Admin
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">
          Mercado do Café
        </h1>
        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
          Gerencie corretoras de café e analise solicitações de cadastro.
        </p>
      </div>

      <div className="flex items-stretch gap-2">
        <Link
          href={primaryHref}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-emerald-500 active:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          aria-label={primaryLabel}
        >
          <Plus className="h-4 w-4" aria-hidden />
          <span>{primaryLabel}</span>
        </Link>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Mais ações"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/60 text-slate-300 transition-colors duration-200 hover:border-emerald-500/40 hover:text-emerald-200 active:bg-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <MoreVertical className="h-5 w-5" aria-hidden />
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Ações secundárias"
              className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-xl border border-slate-700 bg-slate-900/95 shadow-xl shadow-black/40 backdrop-blur"
            >
              <ul className="divide-y divide-slate-800/80">
                {secondaryActions.map((a) => (
                  <li key={a.href}>
                    <Link
                      href={a.href}
                      onClick={() => setMenuOpen(false)}
                      role="menuitem"
                      aria-label={a.ariaLabel}
                      title={a.title}
                      className="flex items-center gap-2 px-3 py-3 text-xs font-medium text-slate-200 transition-colors duration-200 hover:bg-slate-800 hover:text-emerald-200"
                    >
                      <span aria-hidden className="text-base">
                        {a.icon}
                      </span>
                      <span className="min-w-0 truncate">{a.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
