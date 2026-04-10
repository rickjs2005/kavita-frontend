"use client";

// src/app/painel/corretora/layout.tsx
//
// Layout do painel autenticado da corretora. Espelha a estrutura do admin:
// Provider + guard via useEffect, redirect para /painel/corretora/login sem sessão.
//
// Rotas sem shell (fullscreen, sem CorretoraPanelNav):
//   /painel/corretora/login
//   /painel/corretora/esqueci-senha
//   /painel/corretora/resetar-senha
// Todas as demais usam o shell privado com nav no topo.

import React, { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CorretoraAuthProvider,
  useCorretoraAuth,
} from "@/context/CorretoraAuthContext";
import { CorretoraPanelNav } from "@/components/painel-corretora/CorretoraPanelNav";

const FULLSCREEN_ROUTES = [
  "/painel/corretora/login",
  "/painel/corretora/esqueci-senha",
  "/painel/corretora/resetar-senha",
];

function isFullscreenRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return FULLSCREEN_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
}

function CorretoraPanelInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, loadSession } = useCorretoraAuth();

  const isFullscreen = isFullscreenRoute(pathname);

  const fromUrl = useMemo(
    () => `/painel/corretora/login?from=${encodeURIComponent(pathname ?? "")}`,
    [pathname],
  );

  useEffect(() => {
    if (!isFullscreen) {
      loadSession({ silent: true });
    }
  }, [isFullscreen, loadSession]);

  // Sessão expirada durante uso do painel autenticado
  useEffect(() => {
    if (isFullscreen || !user) return;

    function handleAuthExpired() {
      router.replace(fromUrl);
    }

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [isFullscreen, user, fromUrl, router]);

  // Sem sessão em rota protegida → redirect
  useEffect(() => {
    if (isFullscreen || loading) return;
    if (!user) router.replace(fromUrl);
  }, [isFullscreen, loading, user, router, fromUrl]);

  // Rotas de auth (login/esqueci/resetar) renderizam sem shell.
  // Elas têm seu próprio layout fullscreen (gradient/card centralizado).
  if (isFullscreen) return <>{children}</>;

  // Enquanto carrega sessão ou sem user, não piscar o shell.
  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <CorretoraPanelNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}

export default function CorretoraPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CorretoraAuthProvider>
      <CorretoraPanelInner>{children}</CorretoraPanelInner>
    </CorretoraAuthProvider>
  );
}
