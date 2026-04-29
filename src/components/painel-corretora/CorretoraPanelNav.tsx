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

// Ícones dedicados por seção — estilo Lucide (stroke 1.8, 20x20).
// Inline pra não depender de lib externa e manter bundle pequeno.
type IconProps = { className?: string };
const Icons = {
  home: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h4v-6h6v6h4V10" />
    </svg>
  ),
  inbox: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  ),
  chart: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 4 3 5-7" />
    </svg>
  ),
  star: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
    </svg>
  ),
  user: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  users: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  card: ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
} as const;

type NavItem = {
  href: string;
  label: string;
  icon: (props: IconProps) => React.ReactElement;
  exact?: boolean;
  requiresCapability?: Parameters<typeof can>[1];
  // Nota editorial que aparece como legenda abaixo do item ativo — dá
  // respiração ao drawer sem depender só de lista plana de labels.
  hint?: string;
};

// Agrupamento por função — "Operação" cobre o que a corretora faz
// todo dia com lead; "Conta" fica reservado pra ajustes menos
// frequentes (perfil, time, billing).
type NavSection = { label: string; items: NavItem[] };
const navSections: NavSection[] = [
  {
    label: "Operação",
    items: [
      { href: "/painel/corretora", label: "Resumo", icon: Icons.home, exact: true, hint: "Hoje na mesa" },
      { href: "/painel/corretora/leads", label: "Leads", icon: Icons.inbox, hint: "Pipeline de contatos" },
      { href: "/painel/corretora/analytics", label: "Analytics", icon: Icons.chart, hint: "Métricas e SLA" },
      { href: "/painel/corretora/reviews", label: "Avaliações", icon: Icons.star, hint: "O que dizem de você" },
    ],
  },
  {
    label: "Conta",
    items: [
      { href: "/painel/corretora/perfil", label: "Meu perfil", icon: Icons.user, hint: "Canais e vitrine pública" },
      { href: "/painel/corretora/equipe", label: "Equipe", icon: Icons.users, requiresCapability: "team.view", hint: "Usuários e papéis" },
      { href: "/painel/corretora/planos", label: "Meu plano", icon: Icons.card, hint: "Assinatura e limites" },
    ],
  },
];

// Flat list pra nav desktop (mantém ordem original, sem seções).
const navItems: NavItem[] = navSections.flatMap((s) => s.items);

function filterNav(role: CorretoraRole | null | undefined) {
  return navItems.filter((item) =>
    item.requiresCapability ? can(role, item.requiresCapability) : true,
  );
}

function filterSections(role: CorretoraRole | null | undefined): NavSection[] {
  return navSections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) =>
        i.requiresCapability ? can(role, i.requiresCapability) : true,
      ),
    }))
    .filter((s) => s.items.length > 0);
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
  const sections = filterSections(user?.role);
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
    <>
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
                fica oculto pois há nav inline. Dimensionado em 36×36
                (h-9) pra bater com o sino de notificações à direita. */}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-200 transition-colors hover:bg-white/[0.08] hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 md:hidden"
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
                {/* Largura limitada + ellipsis. Em tablets (md < lg) o
                    espaço da topbar é apertado pela nav inline ao lado,
                    então o subtítulo "Corretora" só aparece em lg+.
                    Evita a quebra feia "Laert d…" / "CORRE…". */}
                <div className="hidden min-w-0 max-w-[160px] md:block lg:max-w-[240px]">
                  <p
                    className="truncate text-sm font-semibold leading-tight text-stone-100"
                    title={user.corretora_name}
                  >
                    {user.corretora_name}
                  </p>
                  <p className="hidden truncate text-[11px] font-medium uppercase tracking-[0.14em] text-stone-400 lg:block">
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
              className="mx-2 hidden h-6 w-px bg-white/15 md:block"
            />

            {/* Bell de notificações — visível em desktop e mobile */}
            <NotificationsBell />

            {/* Avatar + nome — informação, não ação. Avatar em h-9
                pra casar com sino e botão Sair na mesma linha de 36px. */}
            <div className="hidden items-center gap-2.5 md:flex">
              <div
                aria-hidden
                className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/15 text-[11px] font-semibold text-amber-200 ring-1 ring-amber-400/30"
              >
                {initials}
              </div>
              <span className="max-w-[120px] truncate text-xs font-medium text-stone-300">
                {user?.nome?.split(" ")[0] ?? ""}
              </span>
            </div>

            {/* Sair — visível só em desktop. Em mobile o botão vive
                no rodapé do drawer. Altura explícita h-9 pra alinhar
                com avatar e sino (tinha py-1.5 que dava ~28px). */}
            <button
              type="button"
              onClick={() =>
                logout({ redirectTo: "/painel/corretora/login" })
              }
              className="ml-1 hidden h-9 items-center rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-stone-300 transition-colors hover:bg-white/[0.08] hover:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 md:inline-flex"
              aria-label="Encerrar sessão"
            >
              Sair
            </button>
          </div>
        </div>

      </div>
    </header>

    {/* ═══ DRAWER MOBILE ══════════════════════════════════════════
        Editorial dark — gradient café + glows amber, ícones por
        seção, agrupamento Operação/Conta, microcopy no item ativo.
        Só renderiza em mobile (md:hidden) e quando aberto.
        FORA do <header> de propósito: o header tem backdrop-blur-md,
        que cria um containing block e prende elementos `position:
        fixed` filhos ao próprio header em vez do viewport. */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Menu do painel">
          {/* Backdrop — click fecha o drawer */}
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm"
          />

          {/* Drawer — aside esquerdo com DNA coffee editorial */}
          <aside
            id="corretora-mobile-drawer"
            className="absolute inset-y-0 left-0 flex w-[88%] max-w-[360px] flex-col overflow-hidden border-r border-amber-900/30 bg-gradient-to-br from-stone-950 via-panel-warm-via to-stone-900 shadow-2xl shadow-black/70 animate-[slideInLeft_0.2s_ease-out]"
          >
            {/* Atmospheric glows — profundidade warm-on-dark */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/[0.12] blur-3xl"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-orange-700/[0.1] blur-3xl"
            />
            {/* Top highlight hairline */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"
            />

            {/* ─── Header — identidade editorial ────────────────── */}
            <div className="relative border-b border-white/[0.06] px-5 pb-5 pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-amber-300/80">
                    Sala Reservada
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/[0.05] hover:text-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  aria-label="Fechar menu"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Identity card — avatar + nome serif + role + corretora */}
              <div className="mt-5 flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-300/30 to-amber-600/10 text-base font-bold text-amber-100 ring-1 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                  >
                    {initials}
                  </div>
                  {/* Dot "online" — a sala está ativa quando o usuário
                      está logado. Reforça vibe de terminal vivo. */}
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-stone-950 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[17px] font-semibold leading-tight text-stone-50">
                    {firstName || "Usuário"}
                  </p>
                  {roleLabel && (
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
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

            {/* ─── Nav — agrupada em seções com labels ────────────── */}
            <nav
              className="relative flex-1 overflow-y-auto px-3 pb-4 pt-3"
              aria-label="Seções do painel"
            >
              {sections.map((section, sectionIdx) => (
                <div
                  key={section.label}
                  className={sectionIdx > 0 ? "mt-5" : ""}
                >
                  <p className="px-3 pb-2 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-stone-500">
                    {section.label}
                  </p>
                  <ul className="space-y-0.5">
                    {section.items.map((item) => {
                      const active = item.exact
                        ? pathname === item.href
                        : pathname?.startsWith(item.href);
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={`group/nav relative flex min-h-[52px] items-center gap-3 overflow-hidden rounded-xl px-3 text-[14px] font-semibold transition-all ${
                              active
                                ? "bg-gradient-to-r from-amber-400/15 via-amber-400/[0.08] to-transparent text-amber-100 ring-1 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.08)]"
                                : "text-stone-300 hover:bg-white/[0.04] hover:text-stone-50 active:bg-white/[0.06]"
                            }`}
                          >
                            {/* Barra vertical amber no item ativo */}
                            <span
                              aria-hidden
                              className={`absolute inset-y-2 left-0 w-[3px] rounded-full transition-colors ${
                                active
                                  ? "bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500"
                                  : "bg-transparent"
                              }`}
                            />

                            {/* Ícone em container quadrado */}
                            <span
                              aria-hidden
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                                active
                                  ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/30"
                                  : "bg-white/[0.04] text-stone-400 ring-1 ring-white/[0.06] group-hover/nav:text-stone-100"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>

                            {/* Label + hint editorial */}
                            <span className="min-w-0 flex-1">
                              <span className="block truncate">{item.label}</span>
                              {item.hint && (
                                <span
                                  className={`block truncate text-[10px] font-medium leading-tight ${
                                    active ? "text-amber-300/70" : "text-stone-500"
                                  }`}
                                >
                                  {item.hint}
                                </span>
                              )}
                            </span>

                            {/* Chevron no ativo */}
                            {active && (
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                className="h-4 w-4 shrink-0 text-amber-300/80"
                                aria-hidden
                              >
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* ─── Footer — Sair + marca d'água ─────────────────── */}
            <div className="relative border-t border-white/[0.06] p-3">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout({ redirectTo: "/painel/corretora/login" });
                }}
                className="group/logout flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/[0.08] px-4 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-500/15 hover:text-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover/logout:translate-x-0.5" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Encerrar sessão
              </button>
              <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-stone-600">
                Kavita · Mercado do Café
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
