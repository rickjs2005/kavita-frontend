"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import apiClient from "@/lib/apiClient";
import { isApiError } from "@/lib/errors";
import { formatApiError } from "@/lib/formatApiError";
import {
  AuthUserSchema,
  extractAuthUser,
  isSchemaError,
} from "@/lib/schemas/api";

// --------------------------------------------------
// Tipos (derivados do schema — fonte única da verdade)
// --------------------------------------------------
export type AuthUser = {
  id: number;
  nome: string;
  email: string;
};

export type RegisterPayload = {
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;

  login: (
    email: string,
    senha: string,
  ) => Promise<{ ok: boolean; message?: string }>;

  register: (
    payload: RegisterPayload,
  ) => Promise<{ ok: boolean; message?: string }>;

  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Carrega usuário pelo cookie (/api/users/me)
  // Valida schema antes de popular state — rejeita payload malformado.
  // -----------------------------
  const refreshUser = async () => {
    try {
      const data = await apiClient.get<unknown>("/api/users/me");

      // Valida schema: se o backend retornar shape inesperado, não popula state.
      const result = AuthUserSchema.safeParse(data);
      if (!result.success) {
        // Sessão ausente ou resposta malformada → trata como não autenticado.
        setUser(null);
        return;
      }

      setUser(result.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // -----------------------------
  // LOGIN
  // Usa extractAuthUser() que valida o envelope e o user shape via Zod.
  // Rejeita: email nulo, id=0, id string, campos ausentes.
  // -----------------------------
  const login = async (email: string, senha: string) => {
    const invalidMsg = "Credenciais inválidas.";

    try {
      const data = await apiClient.post<unknown>("/api/login", {
        email,
        senha,
      });

      // extractAuthUser lança SchemaError se o shape for inválido.
      // Isso impede fallback para email do formulário (bug anterior: rawUser.email ?? email).
      let validated: AuthUser;
      try {
        validated = extractAuthUser(data);
      } catch (schemaErr) {
        if (isSchemaError(schemaErr)) {
          // Backend retornou shape inesperado — não popula state.
          setUser(null);
          return { ok: false, message: invalidMsg };
        }
        throw schemaErr;
      }

      setUser(validated);
      return { ok: true };
    } catch (err) {
      setUser(null);

      // Erros HTTP (401, 403, etc.) têm mensagem útil do backend.
      if (isApiError(err)) {
        const ui = formatApiError(err, invalidMsg);
        return { ok: false, message: ui.message };
      }

      return { ok: false, message: invalidMsg };
    }
  };

  // -----------------------------
  // REGISTER
  // -----------------------------
  const register = async (payload: RegisterPayload) => {
    const fallbackMsg = "Não foi possível criar sua conta.";

    try {
      await apiClient.post<unknown>("/api/users/register", payload);
      return { ok: true };
    } catch (err: unknown) {
      const ui = formatApiError(err, fallbackMsg);
      return { ok: false, message: ui.message };
    }
  };

  // -----------------------------
  // LOGOUT
  // Limpa state local primeiro, notifica backend em seguida (não-bloqueante).
  // -----------------------------
  const logout = async () => {
    setUser(null);
    apiClient.post("/api/logout").catch(() => {
      // silencioso — state local já foi limpo
    });
  };

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
};
