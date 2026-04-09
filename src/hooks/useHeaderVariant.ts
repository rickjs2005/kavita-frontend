"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

export type HeaderVariant = "ecommerce" | "modules" | "minimal" | "hidden";

/**
 * Rotas sem header nenhum — foco total no conteúdo.
 * Inclui auth, checkout (e sub-rotas) e admin.
 */
const HIDDEN_PREFIXES = [
  "/admin",
  "/checkout",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

/**
 * Minimal header — apenas logo + voltar (formulários de conversão).
 */
const MINIMAL_ROUTES = [
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

export function useHeaderVariant(): HeaderVariant {
  const pathname = usePathname();

  return useMemo(() => {
    // Hidden — sem header (auth, checkout, admin)
    for (const prefix of HIDDEN_PREFIXES) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) return "hidden";
    }

    // Minimal — header compacto (formulários de conversão)
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
