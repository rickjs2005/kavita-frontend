"use client";

// app/global-error.tsx
//
// Boundary global de erro do App Router. Recomendado pelo Sentry pra
// capturar render errors de Server Components que escapem dos error
// boundaries específicos (sem ele, erros de RSC viram 500 sem entry
// no dashboard).
//
// Sem NEXT_PUBLIC_SENTRY_DSN setado, captureException é no-op.

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-error-bg)",
            color: "var(--color-error-text)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: "2rem",
          }}
        >
          <div style={{ maxWidth: "32rem", textAlign: "center" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
              Algo deu errado
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--color-error-muted)", marginBottom: "1.5rem" }}>
              Já registramos o erro e vamos investigar. Tente recarregar a página.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "0.625rem 1.25rem",
                background: "var(--color-error-action)",
                color: "white",
                fontWeight: 700,
                borderRadius: "0.75rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Recarregar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
