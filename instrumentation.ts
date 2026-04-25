// instrumentation.ts
//
// Entrypoint Next.js 15 — chamado uma vez por runtime (Node ou Edge).
// Quem dispara: Next.js, automaticamente após o servidor subir.
//
// Padrão oficial do Sentry pra Next 15+ (substitui sentry.server.config
// importado direto, embora o config ainda exista pra customização).

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Re-export do hook de erro de RSC (Next 15.0+). Permite que erros
// disparados durante render de Server Components/Actions apareçam no
// Sentry. Em @sentry/nextjs ^10 o helper se chama `captureRequestError`
// — Next.js procura especificamente pelo nome `onRequestError` neste
// arquivo, então fazemos o alias aqui.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
