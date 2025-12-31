"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { handleApiError } from "@/lib/handleApiError";

// permite roles fixos + futuros slugs (marketing, financeiro, etc.)
export type AdminRole =
  | "master"
  | "gerente"
  | "suporte"
  | "leitura"
  | (string & {});

type AdminAuth = {
  isAdmin: boolean;
  role: AdminRole | null;
  nome: string | null;
  permissions: string[];
  markAsAdmin: (data?: {
    role: AdminRole;
    nome?: string;
    permissions?: string[];
  }) => void;
  hasPermission: (perm: string) => boolean;
  hasRole: (roles: AdminRole | AdminRole[]) => boolean;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuth | null>(null);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const router = useRouter();

  const markAsAdmin = useCallback(
    (data?: { role: AdminRole; nome?: string; permissions?: string[] }) => {
      if (!data?.role) return;

      const { role, nome, permissions: perms } = data;

      setIsAdmin(true);
      setRole(role);
      if (nome) setNome(nome);
      if (Array.isArray(perms)) setPermissions(perms);

      // Persistência leve apenas para UX (não é segurança)
      try {
        localStorage.setItem("adminRole", role);
        if (nome) localStorage.setItem("adminNome", nome);
        if (Array.isArray(perms)) {
          localStorage.setItem("adminPermissions", JSON.stringify(perms));
        }
      } catch {
        // ignorar erro de localStorage
      }
    },
    []
  );

  const logout = useCallback(() => {
    // 1) tenta limpar sessão no backend (cookie HttpOnly)
    (async () => {
      try {
        await fetch(`${API_BASE}/api/admin/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        // Mostra erro amigável, mas mantém lógica de limpar local e redirecionar
        handleApiError(err, {
          fallbackMessage: "Falha ao encerrar sessão de administrador.",
        });
      }
    })();

    // 2) limpa apenas dados locais (não mexe em cookie diretamente)
    try {
      localStorage.removeItem("adminRole");
      localStorage.removeItem("adminNome");
      localStorage.removeItem("adminPermissions");
    } catch {
      // ignorar erro de localStorage
    }

    setIsAdmin(false);
    setRole(null);
    setNome(null);
    setPermissions([]);

    router.replace("/admin/login");
  }, [router]);

  const hasPermission = useCallback(
    (perm: string) => {
      // master sempre pode tudo
      if (role === "master") return true;
      return permissions.includes(perm);
    },
    [role, permissions]
  );

  const hasRole = useCallback(
    (rolesToCheck: AdminRole | AdminRole[]) => {
      if (!role) return false;
      if (Array.isArray(rolesToCheck)) {
        return rolesToCheck.includes(role);
      }
      return role === rolesToCheck;
    },
    [role]
  );

  // Carrega estado inicial (somente cache visual) + sincroniza com /api/admin/me via cookie HttpOnly
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) Carrega cache leve do localStorage (não é segurança)
    try {
      const storedRole = localStorage.getItem("adminRole") as AdminRole | null;
      const storedNome = localStorage.getItem("adminNome");
      const storedPermsRaw = localStorage.getItem("adminPermissions");

      if (storedRole) setRole(storedRole);
      if (storedNome) setNome(storedNome || null);

      if (storedPermsRaw) {
        try {
          const parsed = JSON.parse(storedPermsRaw);
          if (Array.isArray(parsed)) setPermissions(parsed);
        } catch {
          // erro no parse -> ignora
        }
      }
    } catch {
      // erro de localStorage -> ignora
    }

    // 2) Faz chamada real para /api/admin/me
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/me`, {
          method: "GET",
          credentials: "include", // importante para enviar cookie HttpOnly
        });

        if (res.status === 401) {
          // não autenticado: limpa só estado local
          setIsAdmin(false);
          setRole(null);
          setNome(null);
          setPermissions([]);
          try {
            localStorage.removeItem("adminRole");
            localStorage.removeItem("adminNome");
            localStorage.removeItem("adminPermissions");
          } catch {
            // ignore
          }
          return;
        }

        if (!res.ok) {
          // erro de servidor, mostra mensagem genérica
          handleApiError(
            new Error(
              `Erro ao carregar dados do administrador. Código ${res.status}`
            ),
            { fallbackMessage: "Erro ao carregar dados do administrador." }
          );
          return;
        }

        const data: {
          id: number;
          nome: string;
          email: string;
          role: AdminRole;
          role_id: number | null;
          permissions: string[];
        } = await res.json();

        markAsAdmin({
          role: data.role,
          nome: data.nome,
          permissions: data.permissions || [],
        });
        setIsAdmin(true);
      } catch (err) {
        handleApiError(err, {
          fallbackMessage: "Erro ao conectar com o servidor de admin.",
        });
      }
    })();
  }, [markAsAdmin]);

  return (
    <AdminAuthContext.Provider
      value={{
        isAdmin,
        role,
        nome,
        permissions,
        markAsAdmin,
        hasPermission,
        hasRole,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth deve ser usado dentro de AdminAuthProvider");
  }
  return ctx;
};
