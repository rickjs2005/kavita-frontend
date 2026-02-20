// src/lib/handleApiError.ts
import { formatApiError } from "./formatApiError";

export type HandleApiErrorOptions = {
  silent?: boolean;
  fallback?: string;
  fallbackMessage?: string; // compat
  debug?: boolean;
};

export function handleApiError(err: unknown, opts: HandleApiErrorOptions = {}) {
  const fallback = opts.fallback ?? opts.fallbackMessage ?? "Ocorreu um erro.";
  const ui = formatApiError(err, fallback);

  // Aqui você pode centralizar logs se quiser
  if (opts.debug) {
     
    console.error("[handleApiError]", { ui, err });
  }

  return ui; // {message, code, requestId, status}
}
