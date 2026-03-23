"use client";

/**
 * Guard de UX para páginas admin que exigem permissão ou role específico.
 *
 * CLASSIFICAÇÃO: guard de UX — não é uma camada de segurança.
 * A segurança real é aplicada pelo backend:
 *   - autenticação: verifyAdmin (cookie adminToken + tokenVersion)
 *   - autorização: requirePermission (permissões consultadas no banco)
 *
 * SUPOSIÇÃO CRÍTICA: este hook assume que AdminAuthContext já foi hidratado
 * via loadSession() antes de o componente montar. Isso é garantido por
 * admin/layout.tsx, que bloqueia o render dos filhos enquanto loading: true.
 * Não use este hook fora do AdminAuthProvider ou em testes sem mockar o contexto.
 *
 * FONTE DE DADOS: permissões vêm de GET /api/admin/me (server-truth),
 * nunca de localStorage ou JWT local.
 *
 * Consumer atual: app/admin/configuracoes/usuarios/page.tsx
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth, AdminRole } from "@/context/AdminAuthContext";

type UseAdminRouteGuardOptions = {
  // Pelo menos um dos dois pode ser usado
  permission?: string | string[];
  roles?: AdminRole | AdminRole[];
  // Para onde mandar quem não tiver acesso
  redirectTo?: string;
};

type GuardState = {
  allowed: boolean;
  checking: boolean;
};

export function useAdminRouteGuard({
  permission,
  roles,
  redirectTo = "/admin",
}: UseAdminRouteGuardOptions): GuardState {
  const router = useRouter();
  const { isAdmin, hasPermission, hasRole } = useAdminAuth();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // ainda carregando contexto? (primeiro render)
    // se não for admin, já manda embora
    if (!isAdmin) {
      router.replace(redirectTo);
      setAllowed(false);
      setChecking(false);
      return;
    }

    // valida permissão
    if (permission) {
      const requiredPerms = Array.isArray(permission)
        ? permission
        : [permission];

      const hasAllPerms = requiredPerms.every((p) => hasPermission(p));

      if (!hasAllPerms) {
        setAllowed(false);
        setChecking(false);
        // opção 1: redirecionar
        router.replace(redirectTo);
        return;
      }
    }

    // valida role
    if (roles) {
      if (!hasRole(roles)) {
        setAllowed(false);
        setChecking(false);
        router.replace(redirectTo);
        return;
      }
    }

    // passou em tudo
    setAllowed(true);
    setChecking(false);
  }, [isAdmin, permission, roles, hasPermission, hasRole, redirectTo, router]);

  return { allowed, checking };
}
