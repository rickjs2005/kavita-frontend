"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import apiClient from "@/lib/apiClient";
import { handleApiError } from "@/lib/handleApiError";
import { isApiError } from "@/lib/errors";

export type AdminRole =
  | "master"
  | "gerente"
  | "suporte"
  | "leitura"
  | (string & {});

export type AdminUser = {
  id: number;
  nome: string;
  email: string;
  role: AdminRole;
  role_id: number | null;
};

type AdminAuthContextValue = {
  // Server-truth (novo padrão)
  adminUser: AdminUser | null;
  permissions: string[];
  loading: boolean;
  loadSession: (opts?: { silent?: boolean }) => Promise<AdminUser | null>;

  // Compat (não quebrar nada)
  isAdmin: boolean;
  role: AdminRole | null;
  nome: string | null;

  // Helpers
  hasPermission: (perm: string) => boolean;
  hasRole: (roles: AdminRole | AdminRole[]) => boolean;

  /**
   * Mantido por compatibilidade com fluxos antigos (ex.: login page marcando admin).
   * Recomendação: usar loadSession() após login (server-truth).
   */
  markAsAdmin: (data?: {
    user: AdminUser;
    permissions?: string[];
  }) => void;

  logout: (opts?: { redirectTo?: string }) => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // evita race condition em múltiplos loadSession simultâneos
  const inflightRef = useRef<Promise<AdminUser | null> | null>(null);

  const clearState = useCallback(() => {
    setAdminUser(null);
    setPermissions([]);
  }, []);

  const isAdmin = !!adminUser;
  const role = adminUser?.role ?? null;
  const nome = adminUser?.nome ?? null;

  const hasPermission = useCallback(
    (perm: string) => {
      // master sempre pode tudo
      if (role === "master") return true;
      return permissions.includes(perm);
    },
    [permissions, role]
  );

  const hasRole = useCallback(
    (rolesToCheck: AdminRole | AdminRole[]) => {
      if (!role) return false;
      if (Array.isArray(rolesToCheck)) return rolesToCheck.includes(role);
      return role === rolesToCheck;
    },
    [role]
  );

  const markAsAdmin = useCallback(
    (data?: { user: AdminUser; permissions?: string[] }) => {
      if (!data?.user) return;
      setAdminUser(data.user);
      setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
    },
    []
  );

  const loadSession = useCallback(
    async (opts?: { silent?: boolean }) => {
      // dedupe: se já tem um load em andamento, reutiliza
      if (inflightRef.current) return inflightRef.current;

      const silent = opts?.silent ?? true;

      const p = (async () => {
        setLoading(true);

        try {
          const data = await apiClient.get<{
            id: number;
            nome: string;
            email: string;
            role: AdminRole;
            role_id: number | null;
            permissions: string[];
          }>("/api/admin/me");

          const user: AdminUser = {
            id: data.id,
            nome: data.nome,
            email: data.email,
            role: data.role,
            role_id: data.role_id ?? null,
          };

          setAdminUser(user);
          setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
          return user;
        } catch (err) {
          // 401/403 é esperado quando não logado
          if (isApiError(err) && (err.status === 401 || err.status === 403)) {
            clearState();
            return null;
          }

          clearState();

          // Falhas inesperadas (rede/500): não “abre” admin; mantém estado limpo
          if (!silent) {
            handleApiError(err, {
              fallback: "Erro ao validar sessão do administrador.",
              // debug: true,
            });
          }

          return null;
        } finally {
          setLoading(false);
          inflightRef.current = null;
        }
      })();

      inflightRef.current = p;
      return p;
    },
    [clearState]
  );

  const logout = useCallback(
    async (opts?: { redirectTo?: string }) => {
      // Sempre tenta invalidar sessão no backend, mas não depende disso para limpar state.
      try {
        await apiClient.post("/api/admin/logout");
      } catch (err) {
        // não bloqueia UX; garante limpeza local
        handleApiError(err, {
          fallback: "Falha ao encerrar sessão de administrador.",
          // debug: true,
        });
      } finally {
        clearState();
      }

      // Não faz router aqui para não acoplar provider a layout;
      // quem chama decide se redireciona.
      // Ainda assim, damos opção de retorno (compat).
      if (opts?.redirectTo) {
        // Se você realmente quiser manter redirect aqui, faça pelo caller (layout/page)
        // Este bloco existe para compatibilidade de quem já chama logout({redirectTo})
        // mas sem importar router neste provider.
        window.location.assign(opts.redirectTo);
      }
    },
    [clearState]
  );

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      adminUser,
      permissions,
      loading,
      loadSession,

      // compat
      isAdmin,
      role,
      nome,

      hasPermission,
      hasRole,
      markAsAdmin,
      logout,
    }),
    [
      adminUser,
      permissions,
      loading,
      loadSession,
      isAdmin,
      role,
      nome,
      hasPermission,
      hasRole,
      markAsAdmin,
      logout,
    ]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth deve ser usado dentro de AdminAuthProvider");
  return ctx;
}
