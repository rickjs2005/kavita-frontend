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
import { GrainOverlay } from "@/components/painel-corretora/GrainOverlay";

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
    <div className="relative min-h-screen bg-stone-50 text-stone-900">
      {/* Camada 1 — Warm ambient gradient no topo (cria atmosfera) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[340px] bg-gradient-to-b from-amber-50/60 via-stone-50/40 to-transparent"
      />

      {/* Camada 2 — Textura de grão, fixa na viewport (material) */}
      <GrainOverlay tone="light" />

      <CorretoraPanelNav />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8 md:pb-20 md:pt-8">
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
