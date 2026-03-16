"use client";

/**
 * AuthExpiredHandler — escuta o evento global "auth:expired" disparado pelo apiClient
 * quando qualquer request retorna 401 em área autenticada de usuário.
 *
 * Redireciona para /login sem que cada componente precise tratar 401 individualmente.
 * Não faz nada em rotas públicas (sem auth necessária).
 */
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// Rotas que não precisam redirecionar (já são públicas ou são o próprio login)
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export default function AuthExpiredHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleAuthExpired() {
      const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
      if (isPublic) return;

      const from = encodeURIComponent(pathname);
      router.replace(`/login?from=${from}`);
    }

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [pathname, router]);

  return null;
}
