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
import { AdminUserSchema, isSchemaError } from "@/lib/schemas/api";
import type { AdminRole, AdminUser } from "@/types/admin";

export type { AdminRole, AdminUser };

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
  markAsAdmin: (data?: { user: AdminUser; permissions?: string[] }) => void;

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
    [permissions, role],
  );

  const hasRole = useCallback(
    (rolesToCheck: AdminRole | AdminRole[]) => {
      if (!role) return false;
      if (Array.isArray(rolesToCheck)) return rolesToCheck.includes(role);
      return role === rolesToCheck;
    },
    [role],
  );

  const markAsAdmin = useCallback(
    (data?: { user: AdminUser; permissions?: string[] }) => {
      if (!data?.user) return;
      setAdminUser(data.user);
      setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
    },
    [],
  );

  const loadSession = useCallback(
    async (opts?: { silent?: boolean }) => {
      // dedupe: se já tem um load em andamento, reutiliza
      if (inflightRef.current) return inflightRef.current;

      const silent = opts?.silent ?? true;

      const p = (async () => {
        setLoading(true);

        try {
          // P0-4 (server-truth): permissões e role SEMPRE vêm de /api/admin/me.
          // Nunca leia adminRole / adminPermissions do localStorage — isso exporia
          // o painel a XSS que eleva privilégios sem passar pelo servidor.
          const raw = await apiClient.get<unknown>("/api/admin/me");

          // Valida schema — rejeita shape inesperado sem poluir state.
          const result = AdminUserSchema.safeParse(raw);
          if (!result.success) {
            if (!silent) {
              handleApiError(new Error("Resposta de sessão admin inválida."), {
                fallback: "Erro ao validar sessão do administrador.",
              });
            }
            clearState();
            return null;
          }

          const data = result.data;

          const user: AdminUser = {
            id: data.id,
            nome: data.nome,
            email: data.email,
            role: data.role,
            role_id: data.role_id ?? null,
          };

          setAdminUser(user);
          setPermissions(data.permissions);
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
    [clearState],
  );

  const logout = useCallback(
    async (opts?: { redirectTo?: string }) => {
      // Aguarda o backend limpar o cookie HttpOnly (adminToken).
      // Cookies HttpOnly só podem ser limpos pelo servidor — fire-and-forget deixaria
      // o cookie vivo se a requisição falhar, re-autenticando o admin no próximo acesso.
      try {
        await apiClient.post("/api/admin/logout");
      } catch (err) {
        handleApiError(err, {
          fallback: "Falha ao encerrar sessão de administrador.",
        });
      } finally {
        clearState();
      }

      if (opts?.redirectTo) {
        window.location.assign(opts.redirectTo);
      }
    },
    [clearState],
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
    ],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth deve ser usado dentro de AdminAuthProvider");
  return ctx;
}
