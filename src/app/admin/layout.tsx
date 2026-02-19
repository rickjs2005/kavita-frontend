"use client";

import React, { useEffect, useMemo } from "react";
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
    // pathname no Next não inclui search params; mas seu layout já usava pathname
    // então mantemos o mesmo comportamento pra não "quebrar nada".
    return `/admin/login?from=${encodeURIComponent(pathname)}`;
  }, [pathname]);

  useEffect(() => {
    // Para páginas não-login: validar sessão (server-truth)
    if (!isLogin) {
      // silent true para não spammar toast em 401
      loadSession({ silent: true });
    }
  }, [isLogin, loadSession]);

  // ✅ 4) Sem sessão: redirect via effect (não durante render)
  useEffect(() => {
    if (isLogin) return;
    if (loading) return;

    if (!adminUser) {
      router.replace(fromUrl);
    }
  }, [isLogin, loading, adminUser, router, fromUrl]);

  // 3) Se estiver na tela de login, renderiza direto
  if (isLogin) return <>{children}</>;

  // 4) Enquanto valida sessão, segura render para evitar flicker
  if (loading) return null;

  // 5) Se não tem user, já disparamos o redirect no effect acima
  if (!adminUser) return null;

  // 6) Sessão válida: renderiza shell do admin
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50">
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:shrink-0 md:border-r md:border-slate-900 md:bg-slate-950">
        <AdminSidebar />
      </aside>

      <div className="relative flex h-screen flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#0f172a,_#020617_55%)]" />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  );
}
