'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/context/AdminAuthContext';
import AdminSidebar from '../../components/admin/AdminSidebar';

/**
 * Layout interno do painel admin.
 * Controla autenticação e estrutura principal do painel.
 */
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAdminAuth();

  const [checking, setChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    // Checa se o cookie adminToken existe
    const hasCookie = document.cookie.split('; ').some(c => c.startsWith('adminToken='));

    // Se não tiver token e não for a tela de login, redireciona
    if (!hasCookie && pathname !== '/admin/login') {
      setIsAuthed(false);
      setChecking(false);
      router.replace('/admin/login');
      return;
    }

    // Se for a tela de login, apenas marca estado
    if (pathname === '/admin/login') {
      setIsAuthed(hasCookie);
      setChecking(false);
      return;
    }

    // Caso contrário, usuário autenticado
    setIsAuthed(hasCookie);
    setChecking(false);
  }, [pathname, router]);

  if (checking) return null; // Evita piscar conteúdo antes da checagem

  // Página de login → sem layout de painel
  if (pathname === '/admin/login') {
    return (
      <main className="flex-1 w-full p-4 sm:p-6">
        <div className="max-w-screen-xl mx-auto w-full">
          {children}
        </div>
      </main>
    );
  }

  // Se não autenticado, bloqueia
  if (!isAuthed) return null;

  // Layout principal do painel admin
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar com menu e botão sair */}
      <aside className="w-64 bg-white shadow-lg hidden md:block">
        <AdminSidebar />
      </aside>

      {/* Conteúdo do painel */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

/**
 * Layout principal exportado.
 * Envolve todo o painel admin com o contexto de autenticação.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </AdminAuthProvider>
  );
}
