"use client";

/**
 * AuthExpiredHandler — escuta o evento global "auth:expired" disparado pelo apiClient
 * quando qualquer request retorna 401 em área autenticada de usuário.
 *
 * Redireciona para /login APENAS quando o usuário está em uma rota que requer auth.
 * Rotas públicas (home, produtos, categorias etc.) NUNCA redirecionam — um 401 em
 * /api/users/me para visitante anônimo é comportamento normal, não sessão expirada.
 */
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isPrivateArea } from "@/utils/isPrivateArea";

// Apenas rotas que REQUEREM autenticação disparam redirect para /login.
// Todas as demais são consideradas públicas e ignoram 401 silenciosamente.
const PROTECTED_PREFIXES = [
  "/pedidos",
  "/meus-dados",
  "/favoritos",
];

export default function AuthExpiredHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleAuthExpired() {
      // Áreas privadas (admin, painel da corretora) têm handler próprio
      // no layout exclusivo — não interferir para evitar dispatch duplo.
      if (isPrivateArea(pathname)) return;

      // Só redireciona se a rota atual requer autenticação
      const isProtected = PROTECTED_PREFIXES.some((p) =>
        pathname === p || pathname.startsWith(p + "/"),
      );
      if (!isProtected) return;

      const from = encodeURIComponent(pathname);
      router.replace(`/login?from=${from}`);
    }

    window.addEventListener("auth:expired", handleAuthExpired);
    return () => window.removeEventListener("auth:expired", handleAuthExpired);
  }, [pathname, router]);

  return null;
}
