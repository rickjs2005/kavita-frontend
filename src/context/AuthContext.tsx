"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import type { AuthUser, BackendLoginResponse } from "@/types/auth";

// -----------------------------
// Tipagem do contexto
// -----------------------------
type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (
    email: string,
    senha: string
  ) => Promise<{ ok: boolean; message?: string }>;
  register: (
    payload: Record<string, unknown>
  ) => Promise<{ ok: boolean; message?: string }>;
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
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    return;
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }
}

/**
 * 🔥 Limpa tudo que for relacionado a carrinho no storage
 * - carrinhos por usuário (cartItems_123)
 * - carrinho de convidado (cartItems_guest)
 * - flags de sessão (_cleared)
 */
function clearCartStorage() {
  if (typeof window === "undefined") return;

  try {
    // localStorage
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("cartItems_")) {
        localStorage.removeItem(key);
      }
      if (key.startsWith("lastOrder_")) {
        localStorage.removeItem(key);
      }
    }

    // sessionStorage
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith("cartItems_") || key.endsWith("_cleared")) {
        sessionStorage.removeItem(key);
      }
      if (key.startsWith("lastOrder_")) {
        sessionStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn("Não foi possível limpar storage do carrinho:", e);
  }
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
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const u = JSON.parse(raw) as AuthUser;
        if (u?.id || u?.token) {
          setUser(u);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // ---------------------------
  // LOGIN
  // - tenta /api/users/login (primeira preferência)
  // - se a rota não existir, tenta /api/login
  // - nunca lança erro: retorna { ok, message }
  // ---------------------------
  const login: AuthContextValue["login"] = async (email, senha) => {
    setError(null);

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

      // Se não for "rota não encontrada", é erro real (credencial, etc.)
      if (!notFound) {
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
    const normalized = normalizeBackendUser(data!);
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

    // 🧹 Sempre que logar (mesmo usuário ou outro), garantimos que
    // não existe carrinho "fantasma" preso no storage.
    clearCartStorage();

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
    // 🧹 Limpa carrinho salvo (localStorage + sessionStorage)
    clearCartStorage();

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
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
};
