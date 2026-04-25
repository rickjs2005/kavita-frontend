// sentry.client.config.ts
//
// Inicialização do Sentry no BROWSER (todo Client Component, hooks,
// event handlers).
//
// Comportamento:
//   - Sem NEXT_PUBLIC_SENTRY_DSN setado → no-op silencioso. Build segue
//     normal, sem network calls.
//   - Com DSN → captura erros não tratados, promise rejections e erros
//     manualmente via Sentry.captureException(err) onde fizer sentido.
//   - Replay/profiling DESLIGADOS (sem custo extra de bundle/CPU).
//   - beforeSend mascara CPF, email e telefone em mensagens livres.

import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Padrões para mascarar PII brasileira em strings livres (breadcrumbs,
// mensagens de erro). Strip só do valor, mantém o contexto da mensagem.
const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /\b\(?\d{2}\)?\s?9?\s?\d{4}-?\d{4}\b/g;

function scrubPII(s: string): string {
  return s
    .replace(CPF_RE, "[cpf-redacted]")
    .replace(EMAIL_RE, "[email-redacted]")
    .replace(PHONE_RE, "[phone-redacted]");
}

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,

    // 100% dos erros, 10% das transactions (tracing).
    sampleRate: 1.0,
    tracesSampleRate: parseFloat(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE || "0.1",
    ),

    // Replay/profiling explicitamente desligados — sem custo de bundle.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    // Ignora erros conhecidos que poluem o dashboard sem agregar valor.
    ignoreErrors: [
      // Cancelamento de fetch quando usuário muda de página
      "AbortError",
      "The operation was aborted",
      // Erros de rede pontuais (offline, captcha, ad blocker)
      "Failed to fetch",
      "NetworkError",
      "Load failed",
      // Erros conhecidos de extensions/scripts injetados em browser
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // CSRF / auth — não são bugs, são fluxo esperado
      "CSRF",
      "Não autorizado",
    ],

    beforeSend(event, hint) {
      // Mascara PII em mensagem da exception
      if (event.exception?.values) {
        for (const v of event.exception.values) {
          if (typeof v.value === "string") v.value = scrubPII(v.value);
        }
      }
      if (typeof event.message === "string") {
        event.message = scrubPII(event.message);
      }

      // Mascara PII em breadcrumbs (UI events com valores digitados)
      if (Array.isArray(event.breadcrumbs)) {
        for (const bc of event.breadcrumbs) {
          if (typeof bc.message === "string") bc.message = scrubPII(bc.message);
        }
      }

      // Mascara token/recovery em URLs (magic-link produtor, reset senha)
      if (event.request?.url) {
        event.request.url = event.request.url.replace(
          /(token|secret|key)=[^&]+/gi,
          "$1=[redacted]",
        );
      }

      return event;
    },
  });
}
