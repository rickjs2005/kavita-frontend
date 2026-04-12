// src/utils/isAuthRoute.ts
//
// Rotas de autenticação e recuperação de acesso.
//
// Essas telas precisam de foco e limpeza visual — widgets flutuantes
// (WhatsApp, ChatAssistant) NÃO devem ser renderizados nelas.

const AUTH_ROUTES = ["/login", "/register", "/forgot-password"] as const;

export function isAuthRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return AUTH_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
}
