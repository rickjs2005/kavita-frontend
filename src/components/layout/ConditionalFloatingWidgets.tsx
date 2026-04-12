"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isPrivateArea } from "@/utils/isPrivateArea";
import { isAuthRoute } from "@/utils/isAuthRoute";

/**
 * Esconde widgets flutuantes (WhatsApp, ChatAssistant) em áreas privadas
 * e em rotas de autenticação que precisam de foco e limpeza visual.
 *
 * Para adicionar novas rotas sem widgets, registre-as em:
 * - src/utils/isPrivateArea.ts  (áreas privadas)
 * - src/utils/isAuthRoute.ts    (fluxos de autenticação)
 */
export default function ConditionalFloatingWidgets({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (isPrivateArea(pathname) || isAuthRoute(pathname)) return null;
  return <>{children}</>;
}
