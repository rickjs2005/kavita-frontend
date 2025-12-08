"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminLayoutInnerProps = {
  children: React.ReactNode;
};

function AdminLayoutInner({ children }: AdminLayoutInnerProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let hasRole = false;

    try {
      const storedRole = localStorage.getItem("adminRole");
      hasRole = !!storedRole;
    } catch {
      hasRole = false;
    }

    // se não tiver "sinal" de admin e não estiver na tela de login → manda pro login
    if (!hasRole && pathname !== "/admin/login") {
      setIsAuthed(false);
      setChecking(false);
      router.replace(`/admin/login?from=${encodeURIComponent(pathname)}`);
      return;
    }

    setIsAuthed(hasRole);
    setChecking(false);
  }, [pathname, router]);

  if (checking) return null;

  // Tela de login: deixa o próprio page.tsx controlar o layout (fullscreen)
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!isAuthed) return null;

  // Layout autenticado: sidebar fixa + conteúdo rolando
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50">
      {/* Sidebar fixa no lado esquerdo (desktop/tablet) */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:shrink-0 md:border-r md:border-slate-900 md:bg-slate-950">
        <AdminSidebar />
      </aside>

      {/* Conteúdo à direita: só aqui rola scroll */}
      <div className="relative flex h-screen flex-1 flex-col">
        {/* fundo com leve gradiente */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#0f172a,_#020617_55%)]" />

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
