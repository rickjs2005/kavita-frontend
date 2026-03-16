/**
 * Sanitiza um caminho de redirect para prevenir open redirect attacks.
 * Aceita apenas caminhos internos relativos: deve começar com "/" mas não com "//".
 * Retorna o fallback se o caminho for externo, vazio ou inválido.
 *
 * Uso: router.replace(safeInternalRedirect(search.get("from"), "/admin"))
 */
export function safeInternalRedirect(
  raw: string | null | undefined,
  fallback = "/",
): string {
  if (!raw) return fallback;
  const path = String(raw).trim();
  // deve começar com "/" mas não com "//" (protocol-relative: //evil.com)
  if (path.startsWith("/") && !path.startsWith("//")) return path;
  return fallback;
}
