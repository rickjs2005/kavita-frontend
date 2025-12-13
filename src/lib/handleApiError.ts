// src/lib/handleApiError.ts
import { toast } from "react-hot-toast";
import { isApiError } from "./errors";

type HandleApiErrorOptions = {
  fallback?: string;
  silent?: boolean; // não mostrar toast
  onAuthError?: () => void; // opcional: logout/redirect
};

function mapMessage(code?: string, status?: number, rawMessage?: string) {
  // Normaliza "undefined" para um número seguro
  const s = typeof status === "number" ? status : 0;

  // Preferir mensagens previsíveis para o usuário final
  if (code === "AUTH_ERROR" || s === 401) return "Sessão expirada. Faça login novamente.";
  if (s === 403) return "Você não tem permissão para executar esta ação.";
  if (s === 404) return "Não encontramos o recurso solicitado.";
  if (s === 409) return "Conflito ao salvar. Tente novamente.";
  if (s === 422) return rawMessage || "Dados inválidos. Verifique os campos e tente novamente.";
  if (s >= 500) return "Instabilidade no servidor. Tente novamente em instantes.";

  // Se o backend já manda message padronizada e segura, use-a
  return rawMessage || "Não foi possível concluir a operação.";
}

export function handleApiError(err: unknown, opts?: HandleApiErrorOptions) {
  const fallback = opts?.fallback || "Não foi possível concluir a operação.";
  const silent = opts?.silent ?? false;

  let message = fallback;

  if (isApiError(err)) {
    message = mapMessage(err.code, err.status, err.message);

    if ((err.code === "AUTH_ERROR" || err.status === 401) && opts?.onAuthError) {
      opts.onAuthError();
    }

    if (!silent) toast.error(message);

    // Log técnico (sem vazar para UI)
    console.error("API error:", {
      status: err.status,
      code: err.code,
      message: err.message,
      requestId: err.requestId,
      details: err.details,
    });

    return message;
  }

  // Qualquer outro erro inesperado
  if (err instanceof Error) {
    message = err.message || fallback;
  }

  if (!silent) toast.error(message);
  console.error("Unknown error:", err);

  return message;
}
