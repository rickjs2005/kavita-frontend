"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { api } from "@/lib/api"; // helper de fetch já existente
import { handleApiError } from "@/lib/handleApiError";

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
      const data = await api<AuthUser>("/api/users/me");
      setUser(data);
    } catch {
      // sessão inválida/expirada → apenas limpa user, sem toast
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
    } catch (err) {
      const message = handleApiError(
        err,
        "Não foi possível fazer login. Tente novamente."
      );
      return { ok: false, message };
    }
  };

  // -----------------------------
  // LOGOUT
  // -----------------------------
  const logout = async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch (err) {
      // não impede logout local, mas mostra mensagem amigável se der erro
      handleApiError(err, "Falha ao encerrar sessão do usuário.");
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
