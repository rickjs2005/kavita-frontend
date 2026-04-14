"use client";

// src/context/ProducerAuthContext.tsx
//
// Context de auth do produtor. Espelha o padrão do AdminAuthContext /
// CorretoraAuthContext — fetch em /api/produtor/me com unwrap defensivo.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import type { Producer } from "@/types/producer";

type Ctx = {
  user: Producer | null;
  loading: boolean;
  loadSession: (opts?: { silent?: boolean }) => Promise<Producer | null>;
  markLoggedIn: (u: Producer) => void;
  logout: (opts?: { redirectTo?: string }) => Promise<void>;
};

const ProducerAuthContext = createContext<Ctx | null>(null);

export function ProducerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Producer | null>(null);
  const [loading, setLoading] = useState(true);
  const inflight = useRef<Promise<Producer | null> | null>(null);

  const loadSession = useCallback(async (opts?: { silent?: boolean }) => {
    if (inflight.current) return inflight.current;
    inflight.current = (async () => {
      try {
        if (!opts?.silent) setLoading(true);
        const data = await apiClient.get<Producer>("/api/produtor/me");
        setUser(data);
        return data;
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          setUser(null);
          return null;
        }
        setUser(null);
        return null;
      } finally {
        inflight.current = null;
        setLoading(false);
      }
    })();
    return inflight.current;
  }, []);

  const markLoggedIn = useCallback((u: Producer) => setUser(u), []);

  const logout = useCallback(async (opts?: { redirectTo?: string }) => {
    try {
      await apiClient.post("/api/produtor/logout");
    } catch {
      // silencioso — cookie será limpo de qualquer jeito
    }
    setUser(null);
    if (opts?.redirectTo && typeof window !== "undefined") {
      window.location.assign(opts.redirectTo);
    }
  }, []);

  useEffect(() => {
    loadSession({ silent: true });
  }, [loadSession]);

  const value = useMemo(
    () => ({ user, loading, loadSession, markLoggedIn, logout }),
    [user, loading, loadSession, markLoggedIn, logout],
  );

  return (
    <ProducerAuthContext.Provider value={value}>
      {children}
    </ProducerAuthContext.Provider>
  );
}

export function useProducerAuth() {
  const ctx = useContext(ProducerAuthContext);
  if (!ctx) {
    throw new Error(
      "useProducerAuth must be used within ProducerAuthProvider",
    );
  }
  return ctx;
}
