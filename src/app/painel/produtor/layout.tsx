"use client";

// src/app/painel/produtor/layout.tsx
//
// Layout do painel do produtor — guarded. Sem sessão, redireciona para
// /produtor/entrar.

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ProducerAuthProvider,
  useProducerAuth,
} from "@/context/ProducerAuthContext";

function Inner({ children }: { children: React.ReactNode }) {
  const { user, loading, loadSession } = useProducerAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadSession({ silent: true });
  }, [loadSession]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const from = encodeURIComponent(pathname ?? "/painel/produtor");
      router.replace(`/produtor/entrar?from=${from}`);
    }
  }, [loading, user, router, pathname]);

  if (loading || !user) return null;

  return (
    <div className="relative min-h-screen bg-stone-50 text-stone-900">
      {/* Ambient warm overlay (coerente com painel corretora) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-amber-100/40 via-orange-50/20 to-transparent"
      />
      {children}
    </div>
  );
}

export default function ProducerPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProducerAuthProvider>
      <Inner>{children}</Inner>
    </ProducerAuthProvider>
  );
}
