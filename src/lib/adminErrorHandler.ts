// src/lib/adminErrorHandler.ts
// Centralized auth error handler for admin pages.
// Converts raw API errors (401, 403, "Token não fornecido", etc.)
// into user-friendly messages. Prevents technical text from leaking to UI.

import toast from "react-hot-toast";
import { isApiError } from "./errors";

const AUTH_STATUS = new Set([401, 403]);

const TECHNICAL_PATTERNS = [
  /token/i,
  /unauthorized/i,
  /não autenticado/i,
  /não fornecido/i,
  /jwt/i,
  /sessão inválida/i,
  /credenciais/i,
];

/**
 * Returns true if the error is an auth/session error (401, 403 or matching pattern).
 */
export function isAuthError(err: unknown): boolean {
  if (isApiError(err) && AUTH_STATUS.has(err.status)) return true;
  if (err && typeof err === "object" && AUTH_STATUS.has((err as any).status)) return true;
  const msg = (err as any)?.message || "";
  return TECHNICAL_PATTERNS.some((p) => p.test(msg));
}

/**
 * Friendly message for auth errors. Never exposes technical text.
 */
export const AUTH_MESSAGE = "Sessão expirada. Faça login novamente.";

type HandleOptions = {
  /** Fallback message for non-auth errors. Default: "Erro ao carregar dados." */
  fallbackMessage?: string;
  /** If provided, called to set an error string in state (for inline display). */
  setError?: (msg: string | null) => void;
  /** If true, shows toast. Default: true */
  showToast?: boolean;
};

/**
 * Handles any error thrown in an admin page catch block.
 * - Auth errors → friendly "Sessão expirada" message (never technical)
 * - Other errors → shows the API message or fallback
 *
 * Returns the user-friendly message string.
 *
 * Usage:
 * ```ts
 * } catch (e) {
 *   handleAdminError(e, { setError, fallbackMessage: "Falha ao carregar promoções." });
 * }
 * ```
 */
export function handleAdminError(err: unknown, options: HandleOptions = {}): string {
  const {
    fallbackMessage = "Erro ao carregar dados.",
    setError,
    showToast = true,
  } = options;

  let userMessage: string;

  if (isAuthError(err)) {
    userMessage = AUTH_MESSAGE;
  } else {
    const raw = (err as any)?.message || "";
    // Don't show technical-looking messages to users
    userMessage = raw && raw.length < 200 && !raw.includes("Error:") ? raw : fallbackMessage;
  }

  if (showToast) toast.error(userMessage);
  if (setError) setError(userMessage);

  return userMessage;
}
