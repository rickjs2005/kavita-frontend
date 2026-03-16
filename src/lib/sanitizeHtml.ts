// src/lib/sanitizeHtml.ts
// XSS-hardening helpers (P1).
// Provides safe text escaping and URL validation without external dependencies.

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;",
};

/**
 * Escapes all HTML-special characters so that a string can be inserted
 * into the DOM as text without being interpreted as markup.
 *
 * Use this whenever you display data that comes from user input or the backend.
 */
export function sanitizeAsText(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return str.replace(/[&<>"'`]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Same as `sanitizeAsText` but preserves newline characters by converting
 * them to `<br>` tags (safe — newlines are escaped first, then converted).
 */
export function sanitizeAsTextWithLineBreaks(value: unknown): string {
  return sanitizeAsText(value).replace(/\n/g, "<br>");
}

/**
 * Verifies that a URL belongs to a legitimate MercadoPago / MercadoLibre hostname
 * and uses the https protocol.
 *
 * Accepts:
 *   - mercadopago.<tld>   (e.g. mercadopago.com, mercadopago.com.br)
 *   - *.mercadopago.<tld> (e.g. www.mercadopago.com.br, sandbox.mercadopago.com.br)
 *   - mercadolibre.<tld>  and its subdomains (same rules)
 *
 * Rejects:
 *   - http:// URLs (only https allowed)
 *   - Anything where the brand name isn't immediately before the TLD
 *     (e.g. evil.com/mercadopago, mercadopago.evil.com)
 */
export function isMercadoPagoUrl(url: string): boolean {
  if (!url) return false;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:") return false;
    // TLD aceito: .com  |  .com.XX (país 2 letras)  |  .XX (ccTLD 2 letras, ex: .cl)
    // Isso previne aceitar hostnames como mercadopago.evil.com onde "evil.com" não é TLD
    const TLD = "(com(\\.[a-z]{2})?|[a-z]{2})";
    const MP = new RegExp(`^([a-z0-9-]+\\.)*mercadopago\\.${TLD}$`).test(hostname);
    const ML = new RegExp(`^([a-z0-9-]+\\.)*mercadolibre\\.${TLD}$`).test(hostname);
    return MP || ML;
  } catch {
    return false;
  }
}

/**
 * Validates and sanitizes a URL for use in `href` / `src` attributes.
 *
 * - Blocks `javascript:`, `data:`, and `vbscript:` URIs.
 * - Returns an empty string for values that do not pass validation.
 * - Relative URLs (starting with `/` or `./`) pass through unchanged.
 */
export function sanitizeUrl(url: unknown): string {
  if (url === null || url === undefined) return "";
  const str = String(url).trim();
  if (!str) return "";

  // Relative URLs are always safe
  if (str.startsWith("/") || str.startsWith("./") || str.startsWith("../")) {
    return str;
  }

  try {
    const parsed = new URL(str);
    const proto = parsed.protocol.toLowerCase();

    const BLOCKED_PROTOCOLS = ["javascript:", "data:", "vbscript:"];
    if (BLOCKED_PROTOCOLS.includes(proto)) {
      return "";
    }

    return str;
  } catch {
    // Not a valid absolute URL and not a recognised relative form — reject it
    return "";
  }
}
