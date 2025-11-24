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
    const hasCookie = document.cookie
      .split("; ")
      .some((c) => c.startsWith("adminToken="));

    if (!hasCookie && pathname !== "/admin/login") {
      setIsAuthed(false);
      setChecking(false);
      router.replace("/admin/login");
      return;
    }

    if (pathname === "/admin/login") {
      setIsAuthed(hasCookie);
      setChecking(false);
      return;
    }

    setIsAuthed(hasCookie);
    setChecking(false);
  }, [pathname, router]);

  if (checking) return null;

  // Página de login: sem sidebar, layout centralizado
  if (pathname === "/admin/login") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <main className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-xl shadow-black/60 sm:p-6">
          {children}
        </main>
      </div>
    );
  }

  if (!isAuthed) return null;

  // Layout autenticado
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      {/* Sidebar fixa (md+) */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-slate-900 md:bg-slate-950">
        <AdminSidebar />
      </aside>

      {/* Conteúdo */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* fundo com leve gradiente no conteúdo */}
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
