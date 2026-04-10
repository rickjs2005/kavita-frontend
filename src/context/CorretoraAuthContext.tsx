"use client";

// src/context/CorretoraAuthContext.tsx
//
// Contexto de autenticação do painel da corretora.
// Espelha AdminAuthContext, mas sem RBAC (não existem permissões).

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import apiClient from "@/lib/apiClient";
import { isApiError } from "@/lib/errors";
import type { CorretoraUser } from "@/types/corretoraUser";

type CorretoraAuthContextValue = {
  user: CorretoraUser | null;
  loading: boolean;
  loadSession: (opts?: { silent?: boolean }) => Promise<CorretoraUser | null>;
  markLoggedIn: (user: CorretoraUser) => void;
  logout: (opts?: { redirectTo?: string }) => Promise<void>;
};

const CorretoraAuthContext = createContext<CorretoraAuthContextValue | null>(
  null,
);

export function CorretoraAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<CorretoraUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const inflightRef = useRef<Promise<CorretoraUser | null> | null>(null);

  const clearState = useCallback(() => setUser(null), []);

  const markLoggedIn = useCallback((u: CorretoraUser) => setUser(u), []);

  const loadSession = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (inflightRef.current) return inflightRef.current;

      const p = (async () => {
        setLoading(true);
        try {
          const data = await apiClient.get<CorretoraUser>("/api/corretora/me");
          setUser(data);
          return data;
        } catch (err) {
          if (isApiError(err) && (err.status === 401 || err.status === 403)) {
            clearState();
            return null;
          }
          clearState();
          if (!opts?.silent) {
            console.warn("Erro ao validar sessão da corretora", err);
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
      try {
        await apiClient.post("/api/corretora/logout");
      } catch {
        // ignorar — cookie pode já estar expirado
      } finally {
        clearState();
      }
      if (opts?.redirectTo) {
        window.location.assign(opts.redirectTo);
      }
    },
    [clearState],
  );

  const value = useMemo<CorretoraAuthContextValue>(
    () => ({ user, loading, loadSession, markLoggedIn, logout }),
    [user, loading, loadSession, markLoggedIn, logout],
  );

  return (
    <CorretoraAuthContext.Provider value={value}>
      {children}
    </CorretoraAuthContext.Provider>
  );
}

export function useCorretoraAuth() {
  const ctx = useContext(CorretoraAuthContext);
  if (!ctx) {
    throw new Error(
      "useCorretoraAuth deve ser usado dentro de CorretoraAuthProvider",
    );
  }
  return ctx;
}
