// src/lib/handleApiError.ts

export type HandleApiErrorOptions = {
  silent?: boolean;   // não loga nada (ideal para UX pública)
  fallback?: string;  // mensagem default
  debug?: boolean;    // se true, pode logar (sem overlay no client)
} & Record<string, any>;

type NormalizedErr = {
  status?: number;
  code?: string;
  message?: string;
  url?: string;
  details?: any;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeError(err: any): NormalizedErr {
  // Erro já normalizado (padrão que você usa no backend/front)
  if (err && typeof err === "object") {
    const status = err.status ?? err.response?.status;
    const code = err.code ?? err.response?.data?.code;
    const message =
      err.message ??
      err.response?.data?.message ??
      err.response?.data?.mensagem ??
      err.response?.data?.error;

    const url = err.url ?? err.config?.url;
    const details = err.details ?? err.response?.data;

    return { status, code, message, url, details };
  }

  // string
  if (typeof err === "string") return { message: err };

  return {};
}

export function handleApiError(
  err: unknown,
  options: HandleApiErrorOptions = {}
): string {
  const { silent = false, fallback = "Ocorreu um erro. Tente novamente.", debug = false } = options;

  const n = normalizeError(err);

  // mensagem amigável final
  const msg = (n.message && String(n.message).trim()) ? String(n.message) : fallback;

  // IMPORTANTE:
  // - silent = true => NÃO loga nada
  // - no browser, evitar console.error (abre overlay no Next dev)
  if (!silent) {
    const payload = {
      status: n.status,
      code: n.code,
      message: n.message,
      url: n.url,
      // details geralmente ajuda a debugar, mas pode ser grande:
      details: n.details,
    };

    if (isBrowser()) {
      // No client, use warn/log para não disparar overlay.
      // Se quiser menos ruído, deixe só quando debug=true:
      if (debug) console.warn("API warning:", payload);
    } else {
      // No server pode usar error sem problema
      console.error("API error:", payload);
    }
  }

  return msg;
}
