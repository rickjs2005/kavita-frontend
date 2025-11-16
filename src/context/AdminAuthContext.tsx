'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type AdminAuth = {
  isAdmin: boolean;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuth | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // Checa o cookie quando carrega a página (e sempre que o doc mudar)
  useEffect(() => {
    const hasToken = document.cookie.split('; ').some(c => c.startsWith('adminToken='));
    setIsAdmin(hasToken);
  }, []);

  const logout = () => {
    // Limpa o cookie e manda para o login
    document.cookie = 'adminToken=; path=/; max-age=0';
    setIsAdmin(false);
    router.replace('/admin/login');
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth deve ser usado dentro de AdminAuthProvider');
  return ctx;
};
