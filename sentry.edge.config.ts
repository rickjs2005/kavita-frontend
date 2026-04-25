// sentry.edge.config.ts
//
// Inicialização do Sentry no EDGE runtime do Next.js (middleware.ts).
// O Edge Runtime é mais restrito que Node — sem APIs nativas como fs.
// O SDK do Sentry detecta automaticamente.
//
// O middleware do Kavita (`middleware.ts`) hoje só protege rotas /admin
// cosmeticamente (checagem de cookie). Erros aqui são raros mas valem
// monitorar — auth falhar em massa pode indicar token revogado/atacante.

import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

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
      // Edge é simples — mesmo scrub básico de headers
      if (event.request?.headers) {
        const h = event.request.headers as Record<string, string>;
        delete h.cookie;
        delete h.authorization;
        delete h["x-csrf-token"];
      }
      return event;
    },
  });
}
