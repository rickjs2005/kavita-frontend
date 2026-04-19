// src/components/layout/Header.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useHeaderVariant } from "@/hooks/useHeaderVariant";

import CartCar from "@/components/cart/CartCar";
import UserMenu from "@/components/ui/UserMenu";
import MainNavCategories from "@/components/layout/MainNavCategories";

import type { PublicShopSettings } from "@/server/data/shopSettings";
import { absUrl } from "@/utils/absUrl";

const SearchBar = dynamic(() => import("@/components/ui/SearchBar"), {
  ssr: false,
});

export type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  is_active?: boolean | 0 | 1;
};

type HeaderProps = {
  categories?: PublicCategory[];
  shop?: PublicShopSettings;
};

function isActiveCategory(c: PublicCategory) {
  if (typeof c.is_active === "undefined") return true;
  return c.is_active === true || c.is_active === 1;
}

export default function Header({ categories, shop }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const variant = useHeaderVariant();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const isDronePage = pathname.startsWith("/drones");

  const logoSrc = isDronePage
    ? "/kavita-drone.png"
    : shop?.logo_url?.trim()
      ? absUrl(shop.logo_url)
      : "/images/kavita2.png";

  const logoAlt = shop?.store_name?.trim() ? shop.store_name : "Kavita";

  const safeCategories = useMemo<PublicCategory[]>(
    () => (Array.isArray(categories) ? categories : []),
    [categories],
  );

  const publicActiveCategories = useMemo<PublicCategory[]>(
    () => safeCategories.filter(isActiveCategory),
    [safeCategories],
  );

  const isAuthenticated = !!user;
  const cartCount = cartItems.length;

  // Fecha menu quando troca rota
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Trava scroll quando menu aberto
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Clique fora + ESC
  useEffect(() => {
    if (!isMenuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };

    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [isMenuOpen]);

  if (variant === "hidden") return null;

  // ─── MINIMAL HEADER (checkout, cadastro, auth) ───
  if (variant === "minimal") {
    return (
      <>
        <header className="fixed top-0 left-0 w-full z-50 bg-header">
          <div className="w-full border-b border-white/10">
            <div className="max-w-6xl mx-auto h-[68px] flex items-center justify-between px-4 md:px-6">
              {/* Voltar */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
                aria-label="Voltar"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Voltar</span>
              </button>

              {/* Logo centralizada */}
              <Link href="/" className="absolute left-1/2 -translate-x-1/2">
                <Image
                  src={logoSrc}
                  alt={logoAlt}
                  width={380}
                  height={100}
                  priority
                  className={`w-auto h-[46px] sm:h-[52px] ${isDronePage ? "drop-shadow-[0_1px_12px_rgba(255,255,255,0.4)] brightness-110" : ""}`}
                  sizes="(max-width: 640px) 200px, 240px"
                />
              </Link>

              {/* Carrinho (discreto) */}
              <div className="relative">
                <button
                  aria-label="Abrir carrinho"
                  className="p-1.5 rounded-full text-white/60 hover:text-accent transition-colors"
                  onClick={() => setIsCartOpen(true)}
                >
                  <CartIcon size={20} />
                </button>
                {!!cartCount && <CartBadge count={cartCount} />}
              </div>
            </div>
          </div>
        </header>

        <CartCar isCartOpen={isCartOpen} closeCart={() => setIsCartOpen(false)} />
        <div aria-hidden className="h-[68px]" />
      </>
    );
  }

  const showCategories = variant === "ecommerce";

  // ─── ECOMMERCE & MODULES HEADER ───
  return (
    <>
      {/* Acessibilidade */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-[60] bg-white text-header px-3 py-1 rounded"
      >
        Pular para o conteúdo
      </a>

      <header className="fixed top-0 left-0 w-full z-50 bg-header">
        {/* ── TOP BAR ── */}
        <div className="w-full border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto h-[76px] md:h-24 flex items-center px-4 md:px-6 lg:px-8 gap-2 md:gap-6 lg:gap-8">
            {/* Menu mobile + Logo formam bloco esquerdo no mobile */}
            <button
              aria-label="Abrir menu"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              className="md:hidden shrink-0 rounded-lg p-1.5 -ml-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => setIsMenuOpen(true)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Logo — centralizado no mobile, âncora esquerda no desktop */}
            <Link href="/" className="flex items-center justify-center flex-1 md:flex-none md:justify-start shrink-0 min-w-0 sm:min-w-[200px] md:min-w-[280px]">
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={480}
                height={130}
                priority
                className={`w-auto h-[50px] sm:h-[60px] md:h-[76px] ${isDronePage ? "drop-shadow-[0_1px_16px_rgba(255,255,255,0.45)] brightness-110" : ""}`}
                sizes="(max-width: 640px) 200px, (max-width: 1024px) 280px, 380px"
              />
            </Link>

            {/* Search (desktop/tablet) — subordinado ao logo */}
            <div
              className="hidden sm:flex flex-1 justify-center min-w-0 mx-2 md:mx-4"
              suppressHydrationWarning
            >
              <div className="w-full max-w-[260px] md:max-w-[340px] lg:max-w-[420px] xl:max-w-[480px]">
                <SearchBar />
              </div>
            </div>

            {/* Navegação direita */}
            <div className="flex items-center gap-1.5 md:gap-2.5 lg:gap-4 ml-auto shrink-0">
              {/* Módulos — desktop only, peso visual reduzido */}
              <nav className="hidden md:flex items-center gap-0.5 lg:gap-1" aria-label="Módulos">
                <ModuleLink
                  href="/news"
                  label="News"
                  active={pathname.startsWith("/news")}
                />
                <ModuleLink
                  href="/mercado-do-cafe"
                  label="Café"
                  icon="☕"
                  active={pathname.startsWith("/mercado-do-cafe")}
                />
                <ModuleLink
                  href="/contato"
                  label="Atendimento"
                  active={pathname.startsWith("/contato")}
                />
              </nav>

              {/* Separador */}
              <span className="hidden md:block w-px h-5 bg-white/15" aria-hidden />

              {/* User menu desktop */}
              <div className="hidden md:block">
                <UserMenu />
              </div>

              {/* Carrinho */}
              <div className="relative">
                <button
                  aria-label="Abrir carrinho"
                  className="p-1.5 rounded-full text-white/80 hover:text-accent transition-colors"
                  onClick={() => setIsCartOpen(true)}
                >
                  <CartIcon size={22} />
                </button>
                {!!cartCount && <CartBadge count={cartCount} />}
              </div>
            </div>
          </div>
        </div>

        {/* ── NAV CATEGORIAS (apenas ecommerce) ── */}
        {showCategories && publicActiveCategories.length > 0 && (
          <nav className="hidden md:block w-full bg-nav/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto h-9 px-4 md:px-6 lg:px-8 flex items-center justify-center">
              <MainNavCategories categories={publicActiveCategories} />
            </div>
          </nav>
        )}
      </header>

      {/* ── BACKDROP MOBILE ── */}
      {isMenuOpen && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[3px] animate-[fadeIn_0.2s_ease-out]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* ── MENU MOBILE ── */}
      {isMenuOpen && (
        <aside
          ref={menuRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          className="fixed z-50 top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col overflow-y-auto animate-[slideInLeft_0.25s_ease-out]"
          style={{ willChange: "transform" }}
        >
          {/* Cabeçalho do drawer */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
              <Image
                src={logoSrc}
                alt={logoAlt}
                width={280}
                height={76}
                className="w-auto h-11"
                sizes="200px"
              />
            </Link>
            <button
              aria-label="Fechar menu"
              className="rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Busca mobile */}
          <div className="px-5 py-3 border-b border-gray-100 sm:hidden" suppressHydrationWarning>
            <SearchBar />
          </div>

          {/* Conteúdo do menu */}
          <div className="flex-1 px-3 py-3 space-y-1">
            {/* ── Seção: Loja ── */}
            <MobileMenuSection label="Loja">
              {publicActiveCategories.map((cat) => (
                <MobileMenuLink
                  key={cat.id}
                  href={`/categorias/${cat.slug}`}
                  label={cat.name}
                  onClick={() => setIsMenuOpen(false)}
                />
              ))}
              <MobileMenuLink
                href="/servicos"
                label="Serviços"
                onClick={() => setIsMenuOpen(false)}
              />
            </MobileMenuSection>

            {/* ── Seção: Módulos ── */}
            <MobileMenuSection label="Módulos">
              <MobileMenuLink
                href="/news"
                label="Kavita News"
                onClick={() => setIsMenuOpen(false)}
              />
              <MobileMenuLink
                href="/mercado-do-cafe"
                label="Mercado do Café"
                icon="☕"
                onClick={() => setIsMenuOpen(false)}
              />
              <Link
                href="/drones"
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-accent-bright hover:bg-orange-50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                Kavita Drone
              </Link>
            </MobileMenuSection>

            {/* ── Seção: Minha Conta ── */}
            <MobileMenuSection label="Minha Conta">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 mb-1">
                    <p className="text-sm font-medium text-gray-900">{user?.nome ?? "Usuário"}</p>
                    {user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
                  </div>
                  <MobileMenuLink href="/meus-dados" label="Meus Dados" onClick={() => setIsMenuOpen(false)} />
                  <MobileMenuLink href="/favoritos" label="Favoritos" onClick={() => setIsMenuOpen(false)} />
                  <MobileMenuLink href="/pedidos" label="Meus Pedidos" onClick={() => setIsMenuOpen(false)} />
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false); }}
                    className="w-full text-left rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sair
                  </button>
                </>
              ) : (
                <MobileMenuLink href="/login" label="Entrar / Criar conta" onClick={() => setIsMenuOpen(false)} />
              )}
            </MobileMenuSection>

            {/* ── Seção: Área da Corretora ──
                Espelha o atalho que existe no UserMenu do desktop. O
                painel tem contexto de auth próprio (cookie corretoraToken);
                o guard do layout redireciona pro login se não houver
                sessão de corretora ativa. */}
            <MobileMenuSection label="Área da Corretora">
              <MobileMenuLink
                href="/painel/corretora"
                label="Painel da corretora"
                icon="☕"
                onClick={() => setIsMenuOpen(false)}
              />
            </MobileMenuSection>

            {/* ── Seção: Atendimento ── */}
            <MobileMenuSection label="Atendimento">
              <MobileMenuLink
                href="/contato"
                label="Fale conosco"
                onClick={() => setIsMenuOpen(false)}
              />
              <MobileMenuLink
                href="/trabalhe-conosco"
                label="Trabalhe conosco"
                onClick={() => setIsMenuOpen(false)}
              />
            </MobileMenuSection>
          </div>
        </aside>
      )}

      {/* Carrinho lateral */}
      <CartCar isCartOpen={isCartOpen} closeCart={() => setIsCartOpen(false)} />

      {/* Espaçador — topbar + nav (se ecommerce com categorias) */}
      <div
        aria-hidden
        className={
          showCategories && publicActiveCategories.length > 0
            ? "h-[76px] md:h-[132px]" /* 96px topbar + 36px nav */
            : "h-[76px] md:h-24"       /* só topbar */
        }
      />
    </>
  );
}

/* ═══════════════════════════════════════════
   Sub-componentes internos
   ═══════════════════════════════════════════ */

function ModuleLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon?: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap ${
        active
          ? "bg-white/15 text-white"
          : "text-white/55 hover:text-white/90 hover:bg-white/10"
      }`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </Link>
  );
}

function MobileMenuSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2">
      <p className="px-3 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MobileMenuLink({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-header transition-colors"
      onClick={onClick}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {label}
    </Link>
  );
}

function CartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function CartBadge({ count }: { count: number }) {
  return (
    <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
      {count}
    </span>
  );
}
