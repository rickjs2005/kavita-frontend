"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isPrivateArea } from "@/utils/isPrivateArea";

/**
 * Esconde o chrome público (Header, WhatsApp flutuante, ChatAssistant,
 * AuthExpiredHandler global) dentro de áreas privadas do Kavita.
 *
 * Hoje cobre /admin e /painel/corretora. Rotas privadas futuras só
 * precisam ser registradas em src/utils/isPrivateArea.ts — este
 * componente não muda.
 */
export default function ConditionalHeader({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (isPrivateArea(pathname)) return null;
  return <>{children}</>;
}
