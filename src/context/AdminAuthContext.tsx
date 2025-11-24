'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type AdminAuth = {
  isAdmin: boolean;
  markAsAdmin: () => void;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuth | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Checa o cookie quando carrega a aplicação (refresh, abrir nova aba, etc.)
  useEffect(() => {
    const hasToken = document.cookie
      .split('; ')
      .some((c) => c.startsWith('adminToken='));
    setIsAdmin(hasToken);
  }, []);

  const markAsAdmin = () => {
    setIsAdmin(true);
  };

  const logout = () => {
    // Limpa o cookie e manda para o login
    document.cookie = 'adminToken=; path=/; max-age=0';
    setIsAdmin(false);
    router.replace('/admin/login');
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, markAsAdmin, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider');
  return ctx;
};
