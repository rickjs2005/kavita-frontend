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

export type RegisterPayload = {
  nome: string;
  email: string;
  senha: string;
  cpf?: string; // <-- para não quebrar o /register
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;

  login: (
    email: string,
    senha: string
  ) => Promise<{ ok: boolean; message?: string }>;

  register: (
    payload: RegisterPayload
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

      if (!rawUser?.id) {
        setUser(null);
        return { ok: false, message: invalidMsg };
      }

      const finalUser: AuthUser = {
        id: Number(rawUser.id),
        nome: rawUser.nome ?? "",
        email: rawUser.email ?? email,
      };

      setUser(finalUser);
      return { ok: true };
    } catch {
      setUser(null);
      return { ok: false, message: invalidMsg };
    }
  };

  // -----------------------------
  // REGISTER
  // -----------------------------
  const register = async (payload: RegisterPayload) => {
    const fallbackMsg = "Não foi possível criar sua conta.";

    try {
      await api<any>("/api/users/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Se sua API já loga e seta cookie ao registrar, descomente:
      // await refreshUser();

      return { ok: true };
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.response?.data?.message ||
        err?.data?.message ||
        fallbackMsg;

      return { ok: false, message: msg };
    }
  };

  // -----------------------------
  // LOGOUT
  // -----------------------------
  const logout = async () => {
    try {
      await api("/api/logout", { method: "POST" });
    } catch {
      // silencioso
    }
    setUser(null);
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
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
};
