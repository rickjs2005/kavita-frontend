"use client";

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
