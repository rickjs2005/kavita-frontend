// src/lib/formatApiError.ts
import { isApiError } from "./errors";

export type UiError = {
  message: string;      // humano (sempre)
  code?: string;        // suporte (opcional)
  requestId?: string;   // depuração (opcional)
  status?: number;      // opcional
};

export function formatApiError(
  err: unknown,
  fallback = "Ocorreu um erro. Tente novamente."
): UiError {
  if (isApiError(err)) {
    const message = err.message || fallback;
    return {
      message,
      code: err.code,
      requestId: err.requestId,
      status: err.status,
    };
  }

  // Error padrão
  if (err instanceof Error) {
    return { message: err.message || fallback };
  }

  // string/unknown
  if (typeof err === "string") return { message: err || fallback };

  return { message: fallback };
}

export function toUserMessage(
  err: unknown,
  fallback = "Ocorreu um erro. Tente novamente."
) {
  const e = formatApiError(err, fallback);
  // inclui requestId quando existir, como você pediu
  if (e.requestId) return `${e.message} (ref: ${e.requestId})`;
  return e.message;
}
