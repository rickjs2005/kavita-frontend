"use client";

// src/app/painel/corretora/layout.tsx
//
// Layout do painel autenticado da corretora. Espelha a estrutura do admin:
// Provider + guard via useEffect, redirect para /painel/corretora/login sem sessão.

import React, { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CorretoraAuthProvider,
  useCorretoraAuth,
} from "@/context/CorretoraAuthContext";
import { CorretoraPanelNav } from "@/components/painel-corretora/CorretoraPanelNav";

function CorretoraPanelInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, loadSession } = useCorretoraAuth();

  const isLogin = pathname === "/painel/corretora/login";

  const fromUrl = useMemo(
    () => `/painel/corretora/login?from=${encodeURIComponent(pathname ?? "")}`,
    [pathname],
  );

  useEffect(() => {
    if (!isLogin) {
      loadSession({ silent: true });
    }
  }, [isLogin, loadSession]);

  // Sessão expirada durante uso
  useEffect(() => {
    if (isLogin || !user) return;

    function handleAuthExpired() {
      router.replace(fromUrl);
    }

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [isLogin, user, fromUrl, router]);

  // Sem sessão → redirect
  useEffect(() => {
    if (isLogin || loading) return;
    if (!user) router.replace(fromUrl);
  }, [isLogin, loading, user, router, fromUrl]);

  if (isLogin) return <>{children}</>;
  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
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
