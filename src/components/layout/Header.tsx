// src/components/layout/Header.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

import CartCar from "@/components/cart/CartCar";
import UserMenu from "@/components/ui/UserMenu";
import MainNavCategories from "@/components/layout/MainNavCategories";

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
  categories?: PublicCategory[]; // pode vir undefined em alguns SSR/ISR
};

// rotas em que o header some
const EXCLUDED_ROUTES = [
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/admin",
  "/admin/login",
  "/admin/produtos",
  "/admin/destaques",
  "/admin/pedidos",
  "/admin/servicos",
  "/admin/servicos/pendentes",
  "/admin/clientes",
  "/admin/carrinhos",
  "/admin/configuracoes",
  "/admin/cupons",
  "/admin/relatorios",
  "/admin/relatorios/vendas",
  "/admin/relatorios/servicos",
  "/admin/relatorios/clientes",
  "/admin/relatorios/estoque",
  "/admin/relatorios/produtos",
  "/admin/configuracoes/usuarios",
  "/admin/logs",
  "/admin/equipe",
  "/admin/configuracoes/categorias",
  "/admin/kavita-news",
] as const;

function isActiveCategory(c: PublicCategory) {
  // se o campo vier undefined, tratamos como ativo (padrão antigo)
  if (typeof c.is_active === "undefined") return true;
  return c.is_active === true || c.is_active === 1;
}

export default function Header({ categories }: HeaderProps) {
  // Hooks SEMPRE no topo (nada de return antes deles)
  const pathname = usePathname();
  const { cartItems } = useCart();
  const { user, logout } = useAuth();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const isDronePage = pathname.startsWith("/drones");
  const isNewsPage = pathname.startsWith("/news");

  // Normaliza categories (evita crash/hydration estranho)
  const safeCategories = useMemo<PublicCategory[]>(
    () => (Array.isArray(categories) ? categories : []),
    [categories]
  );

  // Apenas categorias públicas ativas (fonte única)
  const publicActiveCategories = useMemo<PublicCategory[]>(
    () => safeCategories.filter(isActiveCategory),
    [safeCategories]
  );

  const hideHeader = useMemo(() => {
    const isExcluded = EXCLUDED_ROUTES.includes(pathname as (typeof EXCLUDED_ROUTES)[number]);
    const isAdminClientSubRoute = pathname.startsWith("/admin/clientes/");
    return isExcluded || isAdminClientSubRoute;
  }, [pathname]);

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

  // Agora sim: return condicional (APÓS todos hooks)
  if (hideHeader) return null;

  // cores fixas
  const topBarBg = "bg-[#083E46]";
  const navBg = "bg-[#038284]";
  const brandColor = "text-white";

  return (
    <>
      {/* acessibilidade */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-[60] bg-white text-[#083E46] px-3 py-1 rounded"
      >
        Pular para o conteúdo
      </a>

      {/* HEADER FIXO */}
      <header className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${topBarBg}`}>
        {/* TOP BAR */}
        <div className="w-full border-b border-black/10">
          <div className="max-w-6xl mx-auto h-[76px] md:h-[88px] flex items-center justify-between px-4 md:px-6 gap-3 md:gap-6">
            {/* menu mobile */}
            <button
              aria-label="Abrir menu"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              className="md:hidden mr-1 rounded-xl p-2 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#359293]"
              onClick={() => setIsMenuOpen(true)}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className={brandColor}>
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src={isDronePage ? "/images/drone/kavita-drone.png" : "/images/kavita2.png"}
                alt="Kavita"
                width={360}
                height={120}
                priority
                className="w-auto [height:clamp(2.6rem,5vw,5.5rem)] sm:[height:clamp(2.8rem,5vw,6rem)]"
                sizes="(max-width: 640px) 160px, (max-width: 1024px) 220px, 260px"
              />
            </Link>

            {/* search desktop */}
            <div className="hidden sm:flex flex-1 justify-center mx-3 md:mx-6" suppressHydrationWarning>
              <div className="w-full max-w-xl">
                <SearchBar />
              </div>
            </div>

            {/* lado direito */}
            <div className="flex items-center gap-4 md:gap-7">
              {/* Kavita News (desktop) */}
              <Link
                href="/news"
                className={`hidden md:inline-flex items-center text-sm font-semibold tracking-wide rounded-full px-4 py-1.5 border transition-all
                  ${
                    isNewsPage
                      ? "border-white text-white bg-white/10"
                      : "border-white/25 text-white/95 hover:border-white hover:text-white"
                  }`}
              >
                Kavita News
              </Link>

              {/* atendimento desktop */}
              <Link
                href="/contato"
                className="hidden md:inline-flex items-center text-sm font-medium tracking-wide rounded-full px-4 py-1.5 border border-white/25 text-white/95 hover:border-white hover:text-white transition-all"
              >
                Atendimento
              </Link>

              {/* user menu desktop */}
              <div className={`hidden md:block ${brandColor}`}>
                <UserMenu />
              </div>

              {/* carrinho */}
              <div className="relative">
                <button
                  aria-label="Abrir carrinho"
                  className="p-1.5 rounded-full text-[#EC5B20] hover:bg-black/10 transition-colors"
                  onClick={() => setIsCartOpen(true)}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="20" r="1.6" />
                    <circle cx="18" cy="20" r="1.6" />
                    <path d="M3 4h2l2.4 11h11.2l2-8H7" />
                  </svg>
                </button>

                {!!cartCount && (
                  <span className="absolute -top-1 -right-1 bg-white text-[#083E46] text-[11px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {cartCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* NAV DESKTOP */}
        <nav className={`hidden md:block w-full h-[44px] ${navBg} shadow-sm`}>
          <div className="max-w-6xl mx-auto h-full px-4 md:px-6 flex items-center justify-center">
            <MainNavCategories categories={publicActiveCategories} />
          </div>
        </nav>
      </header>

      {/* backdrop mobile */}
      {isMenuOpen && (
        <button
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* MENU MOBILE */}
      {isMenuOpen && (
        <aside
          ref={menuRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          className="fixed z-50 top-0 left-0 h-full w-80 max-w-[80vw] bg-white shadow-2xl p-5 flex flex-col gap-4 overflow-y-auto"
        >
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-[#083E46]">Menu</span>
            <button aria-label="Fechar menu" className="rounded-full p-2 hover:bg-gray-100" onClick={() => setIsMenuOpen(false)}>
              ✕
            </button>
          </div>

          {/* search mobile */}
          <div className="sm:hidden" suppressHydrationWarning>
            <SearchBar />
          </div>

          {/* saudação / auth */}
          <div className="mt-1">
            {isAuthenticated ? (
              <p className="text-sm text-gray-600">
                Olá, <span className="font-semibold text-[#083E46]">{user?.nome ?? "Usuário"}</span>.
                {" "}
                <button className="text-[#083E46] font-semibold underline" onClick={logout}>
                  Sair
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Olá!{" "}
                <Link className="text-[#083E46] font-semibold underline" href="/login">
                  Faça login
                </Link>{" "}
                para acompanhar seus pedidos.
              </p>
            )}
          </div>

          {/* links fixos + categorias */}
          <nav className="mt-2">
            <ul className="space-y-1.5">
              <li>
                <Link
                  className="block rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#083E46] hover:bg-gray-100"
                  href="/news"
                >
                  Kavita News
                </Link>
              </li>

              <li>
                <Link
                  className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#083E46] hover:bg-gray-100"
                  href="/servicos"
                >
                  Serviços
                </Link>
              </li>

              <li>
                <Link
                  className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#083E46] hover:bg-gray-100"
                  href="/contato"
                >
                  Atendimento
                </Link>
              </li>

              {/* categorias públicas ativas (IMPORTANTE para seu teste) */}
              {publicActiveCategories.length > 0 && (
                <li className="pt-2">
                  <div className="text-xs font-semibold text-gray-500 px-3.5 pb-1">Categorias</div>
                  <ul className="space-y-1.5">
                    {publicActiveCategories.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#083E46] hover:bg-gray-100"
                          href={`/categorias/${cat.slug}`}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </nav>

          {/* login / meus pedidos */}
          {!isAuthenticated && (
            <div className="border-top border-t pt-3 mt-2">
              <Link className="block text-sm text-[#083E46] hover:underline" href="/login">
                Login / Meus Pedidos
              </Link>
            </div>
          )}
        </aside>
      )}

      {/* carrinho lateral */}
      <CartCar isCartOpen={isCartOpen} closeCart={() => setIsCartOpen(false)} />

      {/* espaçador do header fixo */}
      <div aria-hidden className="h-[96px] md:h-[134px]" />
    </>
  );
}
