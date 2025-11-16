"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { AuthUser, BackendLoginResponse } from "@/types/auth";

// -----------------------------
// Tipagem do contexto
// -----------------------------
type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, senha: string) => Promise<{ ok: boolean; message?: string }>;
  register: (payload: Record<string, unknown>) => Promise<{ ok: boolean; message?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// -----------------------------
// Helpers
// -----------------------------
const STORAGE_KEY = "auth:user";

function normalizeBackendUser(payload: BackendLoginResponse): AuthUser {
  const p: any = payload || {};
  return {
    token: typeof p.token === "string" ? p.token : undefined,
    id: p.id ?? p.user?.id ?? undefined,
    nome: p.nome ?? p.user?.nome ?? undefined,
    email: p.email ?? p.user?.email ?? undefined,
  };
}

function persistUser(u: AuthUser | null) {
  if (!u) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
}

// -----------------------------
// Provider
// -----------------------------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hidratar usuário salvo
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const u = JSON.parse(raw) as AuthUser;
        if (u?.id || u?.token) setUser(u);
      }
    } catch {}
    setLoading(false);
  }, []);

  // ---------------------------
  // LOGIN
  // - tenta /api/users/login (primeira preferência)
  // - se a rota não existir, tenta /api/login
  // - nunca lança erro: retorna { ok, message }
  // ---------------------------
  const login: AuthContextValue["login"] = async (email, senha) => {
    setError(null);

    // tenta uma rota; se falhar por "não encontrada", tenta a outra
    const tryLogin = async (path: string) => {
      const data = await api<BackendLoginResponse>(path, {
        method: "POST",
        body: JSON.stringify({ email, senha }),
      });
      return data;
    };

    let data: BackendLoginResponse | null = null;

    try {
      data = await tryLogin("/api/users/login");
    } catch (e: any) {
      const msg: string = e?.message || "";
      const notFound =
        /404|rota n[aã]o encontrada|not found/i.test(msg) ||
        /Cannot POST/i.test(msg);
      if (!notFound) {
        // erro "real" (credenciais, etc.) — retorna para a UI
        const message = msg || "Erro ao fazer login.";
        setError(message);
        return { ok: false, message };
      }
      // tenta rota alternativa
      try {
        data = await tryLogin("/api/login");
      } catch (e2: any) {
        const message = e2?.message || "Erro ao fazer login.";
        setError(message);
        return { ok: false, message };
      }
    }

    // normaliza e valida
    const normalized = normalizeBackendUser(data);
    if (!normalized.id && !normalized.token) {
      const message = "Credenciais inválidas.";
      setError(message);
      return { ok: false, message };
    }

    const finalUser: AuthUser = {
      id: normalized.id ?? null,
      nome: normalized.nome ?? null,
      email: normalized.email ?? email,
      token: normalized.token ?? null,
    };

    setUser(finalUser);
    persistUser(finalUser);
    return { ok: true };
  };

  // ---------------------------
  // REGISTER
  // - usa /api/users/register (padrão do projeto)
  // - nunca lança erro
  // ---------------------------
  const register: AuthContextValue["register"] = async (payload) => {
    setError(null);
    try {
      await api("/api/users/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { ok: true };
    } catch (e: any) {
      const message = e?.message || "Erro ao criar conta.";
      setError(message);
      return { ok: false, message };
    }
  };

  // ---------------------------
  // LOGOUT
  // ---------------------------
  const logout = () => {
    setUser(null);
    persistUser(null);
    // se quiser, limpe cookies aqui (ex.: document.cookie = 'userToken=; max-age=0; path=/')
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, error, login, register, logout }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// -----------------------------
// Hook
// -----------------------------
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
};