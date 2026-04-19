"use client";

// src/components/painel-corretora/CorretoraPanelNav.tsx
//
// Topbar sticky da Sala Reservada.
//
// Desktop: nav inline na topbar ([brand | nav | bell + avatar + sair]).
// Mobile: botão hambúrguer abre drawer lateral com header (avatar +
// corretora), lista de navegação vertical e botão Sair no rodapé.
// Fecha em: click fora, ESC, mudança de rota.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCorretoraAuth } from "@/context/CorretoraAuthContext";
import { can, ROLE_LABELS, type CorretoraRole } from "@/types/corretoraUser";
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
  { href: "/painel/corretora/analytics", label: "Analytics" },
  { href: "/painel/corretora/reviews", label: "Avaliações" },
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
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = initialsFrom(user?.nome);
  const items = filterNav(user?.role);
  const firstName = user?.nome?.split(" ")[0] ?? "";
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : "";

  // Fecha o drawer ao navegar. Sem isso, usuário clica num item e o
  // drawer fica aberto sobre a nova rota.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Trava o scroll do body enquanto o drawer está aberto — evita
  // scrollar o conteúdo de trás quando o usuário rola dentro do menu.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // ESC fecha o drawer.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header
      className="sticky top-0 z-40 border-b border-white/[0.06] bg-stone-950/90 backdrop-blur-md"
      aria-label="Navegação da Sala Reservada"
    >
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        {/* LINHA ÚNICA em mobile e desktop. Em mobile tem hambúrguer
            à esquerda que abre drawer; em desktop tem nav inline no
            meio e avatar/sair à direita (como antes). */}
        <div className="flex h-14 items-center justify-between gap-3 md:h-16 md:gap-4">
          {/* LEFT — hambúrguer (mobile only) + brand lockup + corretora name */}
          <div className="flex min-w-0 items-center gap-3 md:gap-5">
            {/* Hambúrguer — abre drawer lateral em mobile. Em desktop
                fica oculto pois há nav inline. */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-stone-200 transition-colors hover:bg-white/[0.08] hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 md:hidden"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              aria-controls="corretora-mobile-drawer"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>

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

            {/* Sair — visível só em desktop. Em mobile o botão vive
                no rodapé do drawer. */}
            <button
              type="button"
              onClick={() =>
                logout({ redirectTo: "/painel/corretora/login" })
              }
              className="ml-1 hidden rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 md:inline-flex"
              aria-label="Encerrar sessão"
            >
              Sair
            </button>
          </div>
        </div>

      </div>

      {/* ═══ DRAWER MOBILE ══════════════════════════════════════════
          Backdrop fullscreen + aside da esquerda com header de
          identidade + lista de nav + rodapé com "Sair". Só renderiza
          DOM quando aberto (perf) e em mobile (md:hidden no wrapper). */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel">
          {/* Backdrop — click fecha o drawer */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Drawer — aside esquerdo */}
          <aside
            id="corretora-mobile-drawer"
            className="absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col border-r border-white/[0.08] bg-stone-950 shadow-2xl shadow-black/60 animate-[slideInLeft_0.2s_ease-out]"
          >
            {/* Header — identidade do usuário */}
            <div className="relative border-b border-white/[0.06] p-5">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
              />
              <div className="flex items-center justify-between gap-3">
                <PanelBrand tone="light" />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/[0.05] hover:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="Fechar menu"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div
                  aria-hidden
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400/15 text-sm font-bold text-amber-200 ring-1 ring-amber-400/30"
                >
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-50">
                    {firstName || "Usuário"}
                  </p>
                  {roleLabel && (
                    <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                      {roleLabel}
                    </p>
                  )}
                  {user?.corretora_name && (
                    <p className="mt-1 truncate text-[11px] text-stone-400">
                      {user.corretora_name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Nav — lista vertical com tap target 48px */}
            <nav
              className="flex-1 overflow-y-auto p-3"
              aria-label="Seções do painel"
            >
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname?.startsWith(item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition-colors ${
                          active
                            ? "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/40"
                            : "text-stone-300 hover:bg-white/[0.05] hover:text-stone-50 active:bg-white/[0.08]"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`h-5 w-1 rounded-full transition-colors ${
                            active ? "bg-amber-400" : "bg-transparent"
                          }`}
                        />
                        <span className="flex-1">{item.label}</span>
                        {active && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4 text-amber-300" aria-hidden>
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer — botão Sair */}
            <div className="border-t border-white/[0.06] p-3">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout({ redirectTo: "/painel/corretora/login" });
                }}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-4 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Encerrar sessão
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
