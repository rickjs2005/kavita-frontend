"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

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

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const router = useRouter();

  const markAsAdmin = useCallback(
    (data?: {
      role: AdminRole;
      nome?: string;
      permissions?: string[];
    }) => {
      if (!data?.role) return;

      const { role, nome, permissions: perms } = data;

      setIsAdmin(true);
      setRole(role);
      if (nome) setNome(nome);
      if (Array.isArray(perms)) setPermissions(perms);

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
    // limpa cookie do token
    document.cookie = "adminToken=; path=/; max-age=0";

    try {
      localStorage.removeItem("adminToken");
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

  // Carrega estado inicial do client (cookie/localStorage) + sincroniza com /api/admin/me
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    try {
      const hasTokenCookie = document.cookie
        .split("; ")
        .some((c) => c.startsWith("adminToken="));

      const storedRole = localStorage.getItem("adminRole") as
        | AdminRole
        | null;
      const storedNome = localStorage.getItem("adminNome");
      const storedPermsRaw = localStorage.getItem("adminPermissions");

      setIsAdmin(hasTokenCookie);
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

      // Se tiver token, sincroniza com /api/admin/me
      const token = localStorage.getItem("adminToken");
      if (hasTokenCookie && token) {
        (async () => {
          try {
            const res = await fetch(`${API_BASE}/api/admin/me`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              credentials: "include",
            });

            if (res.status === 401) {
              // token inválido/expirado -> força logout
              logout();
              return;
            }

            if (!res.ok) {
              console.error(
                "Erro ao carregar /api/admin/me:",
                res.status,
                res.statusText
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
          } catch (err) {
            console.error("Erro ao chamar /api/admin/me:", err);
          }
        })();
      }
    } catch {
      // se der erro em localStorage/cookie, só segue
    }
  }, [logout, markAsAdmin]);

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
