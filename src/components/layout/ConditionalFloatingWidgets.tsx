"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isPrivateArea } from "@/utils/isPrivateArea";
import { isAuthRoute } from "@/utils/isAuthRoute";

/**
 * Rotas públicas onde o WhatsApp/ChatAssistant globais são escondidos
 * porque competiriam com CTAs da própria página.
 *
 * Exemplo: na página individual da corretora, há um CTA primário
 * "Falar no WhatsApp" da corretora — o botão flutuante do WhatsApp
 * da loja (Kavita) confundiria o produtor.
 *
 * Match por prefix. O listing `/mercado-do-cafe/corretoras` (sem
 * slug) NÃO entra aqui — mantém os widgets. Só a página individual
 * `/mercado-do-cafe/corretoras/<slug>` (e sub-rotas como cadastro).
 */
const NO_FLOATING_CTA_ROUTES = [
  "/mercado-do-cafe/corretoras/", // inclui [slug] e /cadastro
] as const;

function shouldHideFloating(pathname: string): boolean {
  return NO_FLOATING_CTA_ROUTES.some((p) => pathname.startsWith(p));
}

/**
 * Esconde widgets flutuantes (WhatsApp, ChatAssistant) em áreas privadas,
 * rotas de autenticação e páginas com CTAs próprios que conflitam com
 * os widgets globais.
 *
 * Para adicionar novas rotas sem widgets, registre-as em:
 * - src/utils/isPrivateArea.ts  (áreas privadas)
 * - src/utils/isAuthRoute.ts    (fluxos de autenticação)
 * - NO_FLOATING_CTA_ROUTES (este arquivo) — páginas com CTA próprio
 */
export default function ConditionalFloatingWidgets({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (
    isPrivateArea(pathname) ||
    isAuthRoute(pathname) ||
    shouldHideFloating(pathname)
  ) {
    return null;
  }
  return <>{children}</>;
}
