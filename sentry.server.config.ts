// sentry.server.config.ts
//
// Inicialização do Sentry no SERVIDOR Next.js (Server Components, Server
// Actions, RSC fetch, route handlers).
//
// Diferença importante: aqui é Node, não browser. Erros que acontecem
// durante render de RSC ou em handlers `app/**/route.ts` são capturados.
//
// Padrão de scrubbing igual ao client — strings com PII são mascaradas.
// Headers sensíveis nunca chegam aqui via Sentry default (sendDefaultPii
// false), mas reforçamos via beforeSend.

import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /\b\(?\d{2}\)?\s?9?\s?\d{4}-?\d{4}\b/g;

const REDACT_KEYS = new Set([
  "senha", "password", "password_confirmation",
  "token", "refresh_token", "access_token", "jwt", "secret", "api_key",
  "cpf", "cnpj", "rg", "telefone", "whatsapp", "phone",
  "card_number", "cvv", "totp_secret",
]);

function scrubPII(s: string): string {
  return s
    .replace(CPF_RE, "[cpf-redacted]")
    .replace(EMAIL_RE, "[email-redacted]")
    .replace(PHONE_RE, "[phone-redacted]");
}

function scrubObject(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  const o = obj as Record<string, unknown>;
  for (const k of Object.keys(o)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      o[k] = "[redacted]";
    } else if (typeof o[k] === "string") {
      o[k] = scrubPII(o[k] as string);
    } else if (typeof o[k] === "object") {
      scrubObject(o[k]);
    }
  }
  return o;
}

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,

    sampleRate: 1.0,
    tracesSampleRate: parseFloat(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE || "0.1",
    ),

    sendDefaultPii: false,

    beforeSend(event) {
      if (event.exception?.values) {
        for (const v of event.exception.values) {
          if (typeof v.value === "string") v.value = scrubPII(v.value);
        }
      }
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        delete h.cookie;
        delete h.authorization;
        delete h["x-csrf-token"];
        delete h["x-signature"];
      }
      if (event.request?.data) scrubObject(event.request.data);
      if (event.extra) scrubObject(event.extra);
      if (Array.isArray(event.breadcrumbs)) {
        for (const bc of event.breadcrumbs) {
          if (typeof bc.message === "string") bc.message = scrubPII(bc.message);
          if (bc.data) scrubObject(bc.data);
        }
      }
      return event;
    },
  });
}
