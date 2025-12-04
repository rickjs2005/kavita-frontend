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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type PublicCategory = {
  id: number;
  name: string;
  slug: string;
  is_active?: boolean | 0 | 1;
};

// hook simples pra reaproveitar as categorias no mobile
function usePublicCategories() {
  const [categorias, setCategorias] = useState<PublicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategorias() {
      try {
        const res = await fetch(`${API_BASE}/api/public/categorias`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error(`Erro ao carregar categorias (${res.status})`);

        const data = await res.json();
        const arr: PublicCategory[] = Array.isArray(data)
          ? data
          : (data?.categorias as PublicCategory[]) || [];

        const ativas = arr.filter(
          (c) =>
            c.is_active === undefined ||
            c.is_active === 1 ||
            c.is_active === true
        );

        setCategorias(ativas);
      } catch (err) {
        console.error("[Header/usePublicCategories] Erro:", err);
        setCategorias([]);
      } finally {
        setLoading(false);
      }
    }

    loadCategorias();
  }, []);

  return { categorias, loading };
}

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
] as const;

export default function Header() {
  const pathname = usePathname();
  const { cartItems } = useCart();
  const { user, logout } = useAuth();

  const hideHeader =
    EXCLUDED_ROUTES.includes(pathname as any) ||
    pathname.startsWith("/admin/clientes/");

  const isAuthenticated = !!user;

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const isDronePage = pathname.startsWith("/drones");

  const { categorias } = usePublicCategories();

  useEffect(() => setMounted(true), []);

  const cartCount = cartItems.length;
  const cartTotal = useMemo(
    () => cartItems.reduce((t, i) => t + i.price * i.quantity, 0),
    [cartItems]
  );
  // cartTotal está pronto se quiser mostrar depois

  // fecha menu quando troca de rota
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // trava scroll quando menu aberto
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // clique fora + ESC
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMenuOpen(false);
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

  if (hideHeader) return null;

  // agora cores fixas (não some texto quando rola)
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
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${topBarBg}`}
      >
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
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                className={brandColor}
              >
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src={
                  isDronePage
                    ? "/images/drone/kavita-drone.png"
                    : "/images/kavita2.png"
                }
                alt="Kavita"
                width={360}
                height={120}
                priority
                className="w-auto [height:clamp(2.6rem,5vw,5.5rem)] sm:[height:clamp(2.8rem,5vw,6rem)]"
                sizes="(max-width: 640px) 160px, (max-width: 1024px) 220px, 260px"
              />
            </Link>

            {/* search desktop (mais compacto) */}
            <div
              className="hidden sm:flex flex-1 justify-center mx-3 md:mx-6"
              suppressHydrationWarning
            >
              <div className="w-full max-w-xl">
                <SearchBar />
              </div>
            </div>

            {/* lado direito */}
            <div className="flex items-center gap-4 md:gap-7">
              {/* atendimento desktop */}
              <Link
                href="/contato"
                className="hidden md:inline-flex items-center text-sm font-medium tracking-wide rounded-full px-4 py-1.5 border border-white/25 text-white/95 hover:border-white hover:text-white transition-all"
              >
                Atendimento
              </Link>

              {/* user menu desktop */}
              <div className={`hidden md:block ${brandColor}`}>
                {mounted && <UserMenu />}
              </div>

              {/* carrinho – ícone mais “carrinho” */}
              <div className="relative">
                <button
                  aria-label="Abrir carrinho"
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="p-1.5 rounded-full text-[#EC5B20] hover:bg-black/10 transition-colors"
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
                {mounted && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1 bg-white text-lime-600 text-[11px] md:text-xs rounded-full min-w-[1.25rem] h-5 md:min-w-[1.5rem] md:h-6 px-1 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* barra de categorias desktop */}
        <nav
          className={`hidden md:block w-full h-[44px] ${navBg} text-[#083E46] shadow-sm`}
        >
          <div className="max-w-6xl mx-auto h-full px-4 md:px-6 flex items-center justify-center">
            <MainNavCategories />
          </div>
        </nav>
      </header>

      {/* MENU MOBILE OFF-CANVAS */}
      {isMenuOpen && (
        <>
          <button
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            className="fixed z-50 top-0 left-0 h-full w-80 max-w-[80vw] bg-white shadow-2xl p-5 flex flex-col gap-4 overflow-y-auto"
            ref={menuRef}
          >
            {/* header do painel */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-[#083E46]">
                Menu
              </span>
              <button
                className="rounded-full p-2 hover:bg-gray-100"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Fechar menu"
              >
                ✕
              </button>
            </div>

            {/* search mobile */}
            <div className="sm:hidden" suppressHydrationWarning>
              <SearchBar />
            </div>

            {/* saudação / login */}
            <div className="mt-1">
              {mounted && isAuthenticated ? (
                <p className="text-sm text-gray-600">
                  Bem-vindo,{" "}
                  <span className="font-semibold text-[#083E46]">
                    {user?.name || user?.email}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  Olá!{" "}
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-[#083E46] font-semibold underline"
                  >
                    Faça login
                  </Link>{" "}
                  para acompanhar seus pedidos.
                </p>
              )}
            </div>

            {/* categorias do backend – mesma lista do desktop */}
            <nav className="mt-2">
              <ul className="space-y-1.5">
                {categorias.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/categorias/${cat.slug}`}
                      className={`block rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                        pathname === `/categorias/${cat.slug}`
                          ? "bg-[#EC5B20]/10 text-[#EC5B20]"
                          : "text-[#083E46] hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/contato"
                    className={`block rounded-xl px-3.5 py-2.5 text-sm font-medium ${
                      pathname === "/contato"
                        ? "bg-[#EC5B20]/10 text-[#EC5B20]"
                        : "text-[#083E46] hover:bg-gray-100"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Atendimento
                  </Link>
                </li>
              </ul>
            </nav>

            {/* minha conta / sair */}
            <div className="border-top border-t pt-3 mt-2">
              {!mounted ? null : isAuthenticated ? (
                <nav className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                    Minha conta
                  </span>
                  <Link
                    href="/meus-dados"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm text-[#083E46] hover:underline"
                  >
                    Meus dados
                  </Link>
                  <Link
                    href="/pedidos"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm text-[#083E46] hover:underline"
                  >
                    Meus pedidos
                  </Link>
                  <Link
                    href="/favoritos"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-sm text-[#083E46] hover:underline"
                  >
                    Favoritos
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="text-left text-sm text-red-600 hover:underline mt-1"
                  >
                    Sair
                  </button>
                </nav>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-sm text-[#083E46] hover:underline"
                >
                  Login / Meus Pedidos
                </Link>
              )}
            </div>
          </aside>
        </>
      )}

      {/* carrinho + espaçador do header */}
      <div className="flex">
        <main
          id="conteudo"
          className={`flex-1 transition-all duration-300 ${
            isCartOpen ? "md:ml-96" : "ml-0"
          }`}
        >
          <CartCar
            isCartOpen={isCartOpen}
            closeCart={() => setIsCartOpen(false)}
          />
        </main>
      </div>

      {/* espaço pro conteúdo não ficar embaixo do header fixo */}
      <div aria-hidden className="h-[96px] md:h-[134px]" />
    </>
  );
}
