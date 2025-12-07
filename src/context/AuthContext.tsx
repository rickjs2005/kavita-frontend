"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { api } from "@/lib/api"; // <-- export nomeado, usando fetch helper

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

// --------------------------------------------------
// Provider
// --------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Carrega usuário pelo cookie
  // -----------------------------
  const refreshUser = async () => {
    try {
      // backend: GET /api/users/me -> { id, nome, email }
      const data = await api<AuthUser>("/api/users/me");
      setUser(data);
    } catch {
      // 401/403/etc → sem sessão
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // -----------------------------
  // LOGIN (via cookie HttpOnly)
  // -----------------------------
  const login = async (email: string, senha: string) => {
    try {
      // backend: POST /api/login -> { message, user: { id, nome, email } }
      const data = await api<any>("/api/login", {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });

      const rawUser = data?.user ?? data;
      if (!rawUser?.id) {
        return { ok: false, message: "Credenciais inválidas." };
      }

      const finalUser: AuthUser = {
        id: rawUser.id,
        nome: rawUser.nome ?? "",
        email: rawUser.email ?? email,
      };

      setUser(finalUser);
      return { ok: true };
    } catch (err: any) {
      const message = err?.message || "Erro ao fazer login.";
      return { ok: false, message };
    }
  };

  // -----------------------------
  // LOGOUT
  // -----------------------------
  const logout = async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch {
      // ignore
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
