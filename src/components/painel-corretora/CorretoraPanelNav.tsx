"use client";

// src/components/painel-corretora/CorretoraPanelNav.tsx
//
// Topbar sticky da Sala Reservada. Três zonas:
//
//   [ Brand lockup | Corretora name ]   [ Nav pills ]   [ Avatar + Sair ]
//
// Desktop: layout em linha única, h-16. Mobile: duas linhas — brand +
// avatar na primeira, nav pills na segunda, sem precisar de hambúrguer
// (só temos 3 itens de nav).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCorretoraAuth } from "@/context/CorretoraAuthContext";
import { can, type CorretoraRole } from "@/types/corretoraUser";
import { PanelBrand } from "./PanelBrand";
import { NotificationsBell } from "./NotificationsBell";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  requiresCapability?: Parameters<typeof can>[1];
};

const navItems: NavItem[] = [
  { href: "/painel/corretora", label: "Resumo", exact: true },
  { href: "/painel/corretora/leads", label: "Leads" },
  { href: "/painel/corretora/perfil", label: "Meu perfil" },
  {
    href: "/painel/corretora/equipe",
    label: "Equipe",
    requiresCapability: "team.view",
  },
  { href: "/painel/corretora/planos", label: "Meu plano" },
];

function filterNav(role: CorretoraRole | null | undefined) {
  return navItems.filter((item) =>
    item.requiresCapability ? can(role, item.requiresCapability) : true,
  );
}

function initialsFrom(name?: string | null): string {
  if (!name) return "··";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "··";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CorretoraPanelNav() {
  const pathname = usePathname();
  const { user, logout } = useCorretoraAuth();

  const initials = initialsFrom(user?.nome);
  const items = filterNav(user?.role);

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/[0.06] bg-stone-950/90 backdrop-blur-md"
      aria-label="Navegação da Sala Reservada"
    >
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        {/* LINHA 1: Brand + contexto da corretora + ações */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* LEFT — brand lockup + corretora name */}
          <div className="flex min-w-0 items-center gap-5">
            <Link
              href="/painel/corretora"
              className="shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
              aria-label="Ir para o resumo"
            >
              <PanelBrand tone="light" />
            </Link>

            {user?.corretora_name && (
              <>
                <span
                  aria-hidden
                  className="hidden h-6 w-px bg-white/15 md:block"
                />
                <div className="hidden min-w-0 md:block">
                  <p className="truncate text-sm font-semibold text-stone-100">
                    {user.corretora_name}
                  </p>
                  <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400">
                    Corretora
                  </p>
                </div>
              </>
            )}
          </div>

          {/* RIGHT — desktop nav inline + avatar + logout */}
          <div className="flex items-center gap-2">
            <nav
              className="hidden md:flex md:items-center md:gap-1"
              aria-label="Seções do painel"
            >
              {items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 ${
                      active
                        ? "text-amber-200"
                        : "text-stone-400 hover:text-stone-100"
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-3 -bottom-[17px] h-[2px] rounded-full bg-amber-400"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            <span
              aria-hidden
              className="mx-2 hidden h-6 w-px bg-stone-300 md:block"
            />

            {/* Bell de notificações — visível em desktop e mobile */}
            <NotificationsBell />

            {/* Avatar + nome — informação, não ação */}
            <div className="hidden items-center gap-2.5 md:flex">
              <div
                aria-hidden
                className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400/15 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-400/30"
              >
                {initials}
              </div>
              <span className="max-w-[120px] truncate text-xs font-medium text-stone-300">
                {user?.nome?.split(" ")[0] ?? ""}
              </span>
            </div>

            {/* Sair — ação secundária sutil */}
            <button
              type="button"
              onClick={() =>
                logout({ redirectTo: "/painel/corretora/login" })
              }
              className="ml-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950"
              aria-label="Encerrar sessão"
            >
              Sair
            </button>
          </div>
        </div>

        {/* LINHA 2 (mobile only): nav pills + corretora name compacto */}
        <div className="flex items-center justify-between gap-3 border-t border-white/[0.04] py-2.5 md:hidden">
          <nav
            className="flex items-center gap-1 overflow-x-auto"
            aria-label="Seções do painel (mobile)"
          >
            {items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30"
                      : "bg-white/[0.04] text-stone-400 ring-1 ring-white/[0.06] hover:text-stone-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {user?.corretora_name && (
            <span className="shrink-0 truncate max-w-[120px] text-[11px] font-medium text-stone-400">
              {user.corretora_name}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
