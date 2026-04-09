"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminLayoutInnerProps = {
  children: React.ReactNode;
};

function AdminLayoutInner({ children }: AdminLayoutInnerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const { adminUser, loading, loadSession } = useAdminAuth();

  // 1) Login é fullscreen e não depende do chrome/admin shell
  const isLogin = pathname === "/admin/login";

  // 2) URL de retorno (inclui querystring quando existir)
  const fromUrl = useMemo(() => {
    return `/admin/login?from=${encodeURIComponent(pathname)}`;
  }, [pathname]);

  // Mobile menu state — hooks SEMPRE no topo, antes de qualquer return condicional
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Para páginas não-login: validar sessão (server-truth)
    if (!isLogin) {
      loadSession({ silent: true });
    }
  }, [isLogin, loadSession]);

  // Escuta evento global disparado pelo apiClient quando qualquer request retorna 401.
  // Só redireciona se já havia sessão ativa (adminUser existia) — significa que a sessão
  // expirou. Se adminUser é null, o 401 veio do loadSession inicial (admin não logado)
  // e o redirect é tratado pelo useEffect abaixo.
  useEffect(() => {
    if (isLogin) return;
    if (!adminUser) return;

    function handleAuthExpired() {
      router.replace(fromUrl);
    }

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [isLogin, adminUser, fromUrl, router]);

  // Sem sessão: redirect via effect (não durante render)
  useEffect(() => {
    if (isLogin) return;
    if (loading) return;

    if (!adminUser) {
      router.replace(fromUrl);
    }
  }, [isLogin, loading, adminUser, router, fromUrl]);

  // Fecha menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Trava scroll do body quando menu mobile está aberto
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // ---- Retornos condicionais (APÓS todos os hooks) ----

  if (isLogin) return <>{children}</>;

  if (loading) return null;

  if (!adminUser) return null;

  // Sessão válida: renderiza shell do admin
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:shrink-0 md:border-r md:border-slate-900 md:bg-slate-950">
        <AdminSidebar />
      </aside>

      {/* Backdrop mobile */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar mobile (drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 ease-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar onNavigate={() => setMobileMenuOpen(false)} />
      </aside>

      <div className="relative flex h-screen flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--color-dark-600),_var(--color-dark-750)_55%)]" />

        {/* Top bar mobile com hambúrguer */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800/60 bg-slate-950/95 px-3 py-2.5 backdrop-blur md:hidden">
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
            className="rounded-lg p-2 hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              className="text-slate-200"
            >
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="text-sm font-semibold text-emerald-400">
              Kavita Admin
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  );
}
