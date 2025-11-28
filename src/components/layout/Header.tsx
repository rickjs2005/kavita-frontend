"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import dynamic from "next/dynamic"; 
import CartCar from "@/components/cart/CartCar";
import UserMenu from "@/components/ui/UserMenu";

// ⬅️ SearchBar apenas no cliente (sem SSR)
const SearchBar = dynamic(() => import("@/components/ui/SearchBar"), { ssr: false });

const NAV_LINKS = [
  { route: "/categorias/medicamentos", label: "Medicamentos" },
  { route: "/categorias/pets", label: "Pets" },
  { route: "/categorias/fazenda", label: "Fazenda" },
  { route: "/drones", label: "Kavita-Drone" },
  { route: "/servicos", label: "Serviços" }, 
  { route: "/categorias/pragas-e-insetos", label: "Pragas e Insetos" },
  { route: "/categorias/outros", label: "Outros" },
] as const;

const EXCLUDED_ROUTES = [
  "/checkout", "/login", "/register", "/forgot-password", "/reset-password",
  "/admin", "/admin/login", "/admin/produtos", "/admin/destaques",
  "/admin/pedidos", "/admin/servicos", "/admin/clientes","/admin/carrinhos",
  "/admin/configuracoes","/admin/cupons","/admin/relatorios", "/admin/relatorios/vendas", "/admin/relatorios/servicos",
  "/admin/relatorios/clientes", "/admin/relatorios/estoque","/admin/relatorios/produtos",
] as const;

export default function Header() {
  const pathname = usePathname();

  // ✅ única mudança: também esconde em /admin/clientes/QUALQUER-COISA
  const hideHeader =
    EXCLUDED_ROUTES.includes(pathname as any) ||
    pathname.startsWith("/admin/clientes/");

  const { cartItems } = useCart();
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // gate de montagem (mantido)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const menuRef = useRef<HTMLDivElement>(null);
  const isDronePage = pathname.startsWith("/drones");

  const cartCount = cartItems.length;
  const cartTotal = useMemo(
    () => cartItems.reduce((t, i) => t + i.price * i.quantity, 0),
    [cartItems]
  );

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setIsMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsMenuOpen(false);
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [isMenuOpen]);

  if (hideHeader) return null;

  const topBarBg = isScrolled ? "bg-white/55 backdrop-blur-md" : "bg-[#083E46]";
  const navBg = isScrolled ? "bg-white/40 backdrop-blur-md" : "bg-[#038284]";
  const brandColor = isScrolled ? "text-[#083E46]" : "text-white";

  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-[60] bg-white text-[#083E46] px-3 py-1 rounded">
        Pular para o conteúdo
      </a>

      <header className={`fixed top-0 left-0 w-full z-50 transition-colors ${topBarBg}`}>
        <div className="w-full h-[72px] md:h-[108px] flex items-center justify-between px-4 md:px-8">
          <button
            aria-label="Abrir menu"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            className="md:hidden mr-2 rounded-lg p-2 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-[#359293]"
            onClick={() => setIsMenuOpen(true)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" className={brandColor}>
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/" className="flex items-center shrink-0">
            <Image
              src={isDronePage ? "/images/drone/kavita-drone.png" : "/images/kavita2.png"}
              alt="Kavita"
              width={360}
              height={120}
              priority
              className="w-auto [height:clamp(2.75rem,5vw,6rem)] sm:[height:clamp(3rem,5vw,6.5rem)]"
              sizes="(max-width: 640px) 160px, (max-width: 1024px) 220px, 260px"
            />
          </Link>

          {/* SearchBar só no cliente; suprime qualquer aviso residual de hidratação */}
          <div className="hidden sm:flex flex-1 justify-center mx-3 md:mx-8" suppressHydrationWarning>
            <SearchBar />
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className={`hidden md:block ${brandColor}`}>
              {mounted ? <UserMenu /> : null}
            </div>

            <div className="relative">
              <button
                aria-label="Abrir carrinho"
                onClick={() => setIsCartOpen(!isCartOpen)}
                className={`p-1 transition-colors ${isScrolled ? "text-[#359293]" : "text-[#EC5B20]"}`}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45c-.24.43-.37.92-.37 1.43 0 1.66 1.34 3 3 3h8v-2h-8c-.55 0-1-.45-1-1 0-.18.05-.35.12-.5l.88-1.6h6.45c1.1 0 2.08-.72 2.42-1.77l2.54-7.63c.08-.23.12-.47.12-.72 0-1.1-.9-2-2-2h-14v2h14l-2.5 7.5h-6.45l-3.1-6.5z" />
                </svg>
              </button>
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-lime-600 text-[11px] md:text-xs rounded-full w-5 h-5 md:w-6 md:h-6 grid place-items-center">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className={`hidden md:block w-full h-[48px] ${navBg} text-[#083E46]`}>
          <ul className="flex items-center justify-center h-full gap-5 lg:gap-10 xl:gap-14">
            {NAV_LINKS.map((link) => (
              <li key={link.route}>
                <Link
                  href={link.route}
                  className={`px-3 py-1.5 hover:text-[#EC5B20] transition-colors ${
                    pathname === link.route ? "text-[#EC5B20] font-medium" : brandColor
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* Off-canvas mobile */}
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
            className="fixed z-50 top-0 left-0 h-full w-80 bg-white shadow-2xl p-5 flex flex-col gap-4"
            ref={menuRef}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-[#083E46]">Navegação</span>
              <button className="rounded-lg p-2 hover:bg-gray-100" onClick={() => setIsMenuOpen(false)} aria-label="Fechar menu">✕</button>
            </div>

            {/* SearchBar mobile também só no cliente */}
            <div className="sm:hidden" suppressHydrationWarning>
              <SearchBar />
            </div>

            <nav className="flex-1 overflow-y-auto">
              <ul className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <li key={link.route}>
                    <Link
                      href={link.route}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                        pathname === link.route ? "bg-[#EC5B20]/10 text-[#EC5B20]" : "text-[#083E46] hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t pt-3">
              {!mounted ? null : (
                isAuthenticated ? (
                  <nav className="flex flex-col gap-1">
                    <Link href="/meus-dados" onClick={() => setIsMenuOpen(false)} className="text-sm text-[#083E46] hover:underline">Meus dados</Link>
                    <Link href="/pedidos" onClick={() => setIsMenuOpen(false)} className="text-sm text-[#083E46] hover:underline">Meus pedidos</Link>
                    <Link href="/favoritos" onClick={() => setIsMenuOpen(false)} className="text-sm text-[#083E46] hover:underline">Favoritos</Link>
                    <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-left text-sm text-red-600 hover:underline">Sair</button>
                  </nav>
                ) : (
                  <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block text-sm text-[#083E46] hover:underline">
                    Login / Meus Pedidos
                  </Link>
                )
              )}
            </div>
          </aside>
        </>
      )}

      {/* Carrinho + spacer do header fixo */}
      <div className="flex">
        <main id="conteudo" className={`flex-1 transition-all duration-300 ${isCartOpen ? "md:ml-96" : "ml-0"}`}>
          <CartCar isCartOpen={isCartOpen} closeCart={() => setIsCartOpen(false)} />
        </main>
      </div>
      <div aria-hidden className="h-[96px] md:h-[152px]" />
    </>
  );
}
