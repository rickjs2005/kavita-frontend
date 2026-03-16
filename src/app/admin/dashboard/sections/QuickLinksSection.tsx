"use client";

import Link from "next/link";
import type { QuickLink } from "../dashboardTypes";

type Props = {
  links: QuickLink[];
  hasPermission: (permission: string) => boolean;
};

export function QuickLinksSection({ links, hasPermission }: Props) {
  const visible = links.filter((l) => hasPermission(l.permission));
  if (visible.length === 0) return null;

  return (
    <section className="mt-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Navegação rápida
          </p>
          <h2 className="text-sm font-semibold text-slate-50">
            Módulos principais do painel
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 px-3 py-3 text-xs text-slate-200 shadow-sm shadow-slate-950/40 transition hover:-translate-y-[1px] hover:border-emerald-500/60 hover:bg-slate-900"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-base">{link.icon}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium text-emerald-300 opacity-0 transition group-hover:opacity-100">
                Abrir
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-50">{link.label}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {link.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
