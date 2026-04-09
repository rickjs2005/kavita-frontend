"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

export type HeaderVariant = "ecommerce" | "modules" | "minimal" | "hidden";

/**
 * Minimal header — foco total no conteúdo (formulários, checkout, auth).
 * Padrão: prefixo exato ou startsWith para sub-rotas.
 */
const MINIMAL_ROUTES = [
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/mercado-do-cafe/corretoras/cadastro",
] as const;

/**
 * Módulos especiais — header sem segunda linha de categorias.
 */
const MODULE_PREFIXES = [
  "/news",
  "/mercado-do-cafe",
  "/drones",
  "/contato",
  "/trabalhe-conosco",
] as const;

/**
 * Rotas que escondem o header completamente (admin já tratado pelo ConditionalHeader).
 */
const HIDDEN_PREFIXES = ["/admin"] as const;

export function useHeaderVariant(): HeaderVariant {
  const pathname = usePathname();

  return useMemo(() => {
    // Admin routes — hidden (also handled by ConditionalHeader)
    for (const prefix of HIDDEN_PREFIXES) {
      if (pathname.startsWith(prefix)) return "hidden";
    }

    // Minimal — formulários e fluxos de conversão
    for (const route of MINIMAL_ROUTES) {
      if (pathname === route || pathname.startsWith(route + "/")) return "minimal";
    }

    // Módulos especiais — sem categorias
    for (const prefix of MODULE_PREFIXES) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) return "modules";
    }

    // Default — e-commerce completo
    return "ecommerce";
  }, [pathname]);
}
