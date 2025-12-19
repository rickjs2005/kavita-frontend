"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { api } from "@/lib/api";

// --------------------------------------------------
// Tipos
// --------------------------------------------------
export type AuthUser = {
  id: number;
  nome: string;
  email: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (
    email: string,
    senha: string
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Carrega usuário pelo cookie
  // -----------------------------
  const refreshUser = async () => {
    try {
      const data = await api<AuthUser>("/api/users/me");
      setUser(data);
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
  // LOGIN (consistente e silencioso)
  // -----------------------------
  const login = async (email: string, senha: string) => {
    const invalidMsg = "Credenciais inválidas.";

    try {
      const data = await api<any>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });

      const rawUser = data?.user ?? data;

      // Se backend não retornou user válido, trata como inválido
      if (!rawUser?.id) {
        setUser(null);
        return { ok: false, message: invalidMsg };
      }

      const finalUser: AuthUser = {
        id: rawUser.id,
        nome: rawUser.nome ?? "",
        email: rawUser.email ?? email,
      };

      setUser(finalUser);
      return { ok: true };
    } catch {
      // Regra de UX: qualquer falha no login = credenciais inválidas (sem overlay)
      setUser(null);
      return { ok: false, message: invalidMsg };
    }
  };

  // -----------------------------
  // LOGOUT
  // -----------------------------
  const logout = async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch {
      // silencioso por padrão (evita overlay e mantém UX limpa)
    }
    setUser(null);
  };

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
};
