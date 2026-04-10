// src/utils/isPrivateArea.ts
//
// Fonte única de verdade para decidir se uma rota pertence a uma área
// privada do Kavita (admin ou painel da corretora).
//
// Áreas privadas têm seu próprio layout com header, auth guard e
// tratamento de sessão. O chrome público do site (Header do e-commerce,
// WhatsApp flutuante, ChatAssistant, AuthExpiredHandler global, sync
// de carrinho) NÃO deve vazar para dentro delas.
//
// Qualquer código de layout ou contexto global que hoje faz
// `pathname.startsWith("/admin")` deve migrar para este helper.

const PRIVATE_PREFIXES = ["/admin", "/painel/corretora"] as const;

export function isPrivateArea(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PRIVATE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
