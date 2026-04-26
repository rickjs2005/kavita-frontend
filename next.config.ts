import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import withSerwistInit from "@serwist/next";

// Fase 5 — PWA via Serwist. OPT-IN via NEXT_ENABLE_PWA=true.
//
// Por que opt-in (Fase 5 hotfix):
//   - SW de build antigo cacheia HTML referenciando chunks com hash que
//     nao existem mais apos rebuild. Browser recebe 404 servido como
//     text/plain → "Algo deu errado" / chunks 404.
//   - SW pode interceptar /api/csrf-token e cachear sem propagar
//     Set-Cookie → 403 em mutacoes admin (e.g., enviar-link).
//   - Quando disable=true, Serwist GERA UM SW QUE SE AUTO-DESREGISTRA
//     no proximo carregamento, limpando clients que tinham SW antigo.
//
// Ativar PWA em prod: setar NEXT_ENABLE_PWA=true no env do deploy.
// Default off + dev off → npm start / build local funcionam sem SW.
const PWA_ENABLED = process.env.NEXT_ENABLE_PWA === "true";
const withSerwist = withSerwistInit({
  swSrc: "src/app/motorista-sw.ts",
  swDest: "public/sw.js",
  disable: !PWA_ENABLED || process.env.NODE_ENV === "development",
  cacheOnNavigation: true,
});

// output: standalone tambem e' OPT-IN via NEXT_OUTPUT_STANDALONE=true.
//
// Por que opt-in:
//   - standalone gera .next/standalone/server.js mas NAO copia
//     .next/static nem public/. Sem copia manual, chunks viram 404
//     servidos com Content-Type: text/plain.
//   - "next start" emite warning e nao roda corretamente quando
//     output=standalone esta ativo.
//
// Default off → "next start" funciona normal.
// Em Docker/deploy: setar NEXT_OUTPUT_STANDALONE=true + Dockerfile copia
// .next/static + public pra .next/standalone/. Rodar com:
//   node .next/standalone/server.js  (ou npm run start:standalone)
const STANDALONE_ENABLED = process.env.NEXT_OUTPUT_STANDALONE === "true";

// Deriva hostname e protocol diretamente de NEXT_PUBLIC_API_URL para que
// next/image aceite imagens do backend em qualquer ambiente (dev, staging, prod).
function apiRemotePattern(): import("next/dist/shared/lib/image-config").RemotePattern | null {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/uploads/**",
    };
  } catch {
    return null;
  }
}

const envPattern = apiRemotePattern();

const nextConfig: NextConfig = {
  // Standalone output e' opt-in via NEXT_OUTPUT_STANDALONE=true (ver acima).
  // Default undefined -> "next start" funciona normalmente.
  ...(STANDALONE_ENABLED ? { output: "standalone" as const } : {}),

  eslint: {
    // Impede que o ESLint quebre o build
    // ESLint continua funcionando via `npm run lint`
    ignoreDuringBuilds: true,
  },

  // ---------------------------------------------------------------------------
  // Reverse proxy interno — evita cross-origin cookies em dev e permite testar
  // o painel em qualquer host (localhost, IP local, ngrok) sem mexer em .env.
  //
  // Como funciona:
  //   - O browser chama sempre `/api/*` e `/uploads/*` relativos ao host que
  //     ele está acessando (ex: `http://192.168.0.100:3000/api/...`).
  //   - O Next recebe a request e reescreve internamente para
  //     `http://localhost:5000/api/...`, batendo no Express.
  //   - O cookie `adminToken` é setado no domínio que o browser acessou
  //     (localhost ou IP), não no backend — portanto viaja em requests
  //     subsequentes sem depender de `SameSite=None` / cross-origin.
  //
  // O target do proxy (`BACKEND_URL_INTERNAL`) é resolvido só no servidor
  // Next — nunca vai pro bundle client. Fallback é `http://localhost:5000`
  // porque o backend sempre roda na mesma máquina do Next em dev.
  // ---------------------------------------------------------------------------
  async rewrites() {
    const backend = (
      process.env.BACKEND_URL_INTERNAL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000"
    ).replace(/\/+$/, "");

    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
    ];
  },

  images: {
    remotePatterns: [
      // Padrões fixos para desenvolvimento local
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "172.20.10.9",
        port: "5000",
        pathname: "/uploads/**",
      },
      // Padrão dinâmico derivado de NEXT_PUBLIC_API_URL (cobre staging e produção)
      ...(envPattern ? [envPattern] : []),
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },

  async headers() {
    const isDev = process.env.NODE_ENV === "development";

    // Hosts do backend permitidos.
    // Em dev: usa "*" para connect-src e img-src — necessário para testes via IP
    // local na rede (ex: celular acessando http://192.168.x.x:3000).
    // Em produção: apenas o host derivado de NEXT_PUBLIC_API_URL (restritivo).
    const envApiHost = envPattern
      ? `${envPattern.protocol}://${envPattern.hostname}${envPattern.port ? `:${envPattern.port}` : ""}`
      : "";
    const apiHosts = isDev ? "*" : envApiHost;

    // ---------------------------------------------------------------------------
    // Por que 'unsafe-inline' ainda é necessário:
    //
    // script-src — Next.js injeta __NEXT_DATA__, manifests de chunk e o payload RSC
    //   como tags <script> inline. Remover requer nonce-based CSP:
    //   1. Criar middleware.ts que gera crypto.randomUUID() por request
    //   2. Setar CSP com 'nonce-{value}' em vez de 'unsafe-inline'
    //   3. Ler o nonce via headers() no root layout (layout.tsx é async RSC — viável)
    //   4. O admin/layout.tsx é "use client" — seria necessário refatorá-lo para RSC
    //      antes de poder usar nonce no admin (bloqueador atual).
    //
    // style-src — react-hot-toast e recharts tooltips aplicam estilos via style=""
    //   diretamente em elementos DOM. Remover 'unsafe-inline' de style-src quebraria
    //   os toasts (posicionamento) e os tooltips dos gráficos de relatórios.
    //   Alternativa futura: 'unsafe-hashes' com SHA256 dos estilos inline estáticos,
    //   mas estilos dinâmicos (toast position) não têm hash previsível.
    //
    // 'unsafe-eval' — necessário apenas no Next.js em modo dev (hot reload / React DevTools).
    //   Removido do build de produção.
    // ---------------------------------------------------------------------------

    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

    // CSP aplicada ao painel admin — mais restritiva (sem CDNs externas, frame-ancestors none).
    const adminCsp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'", // ver nota acima sobre unsafe-inline em style-src
      `img-src 'self' data: blob: ${apiHosts}`,
      `media-src 'self' blob: ${apiHosts}`,
      "font-src 'self' data:",
      `connect-src 'self' ${apiHosts}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      ...(!isDev ? ["upgrade-insecure-requests"] : []),
    ]
      .filter((d) => !d.trim().endsWith(" "))
      .join("; ");

    // CSP aplicada às rotas públicas.
    // Antes desta revisão não havia script-src nas rotas públicas, o que deixava
    // o comportamento do browser sem restrição (pior que ter unsafe-inline explícito).
    // Agora todas as rotas têm um script-src explícito — mesma postura do admin,
    // mas com frame-ancestors 'self' (páginas públicas podem ser embeddadas no próprio site).
    const publicCsp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: blob: ${apiHosts}`,
      `media-src 'self' blob: ${apiHosts}`,
      "font-src 'self' data:",
      `connect-src 'self' ${apiHosts}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      ...(!isDev ? ["upgrade-insecure-requests"] : []),
    ]
      .filter((d) => !d.trim().endsWith(" "))
      .join("; ");

    // Headers básicos aplicados a TODAS as rotas.
    // Protegem contra clickjacking, MIME sniffing e information leakage.
    const baseHeaders = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      // camera/microphone/geolocation não são usados pela loja pública
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: publicCsp },
    ];

    // Em produção, adiciona HSTS (não em dev pois não há HTTPS local).
    if (!isDev) {
      baseHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [
      // Cabeçalhos para todas as rotas públicas
      {
        source: "/:path*",
        headers: baseHeaders,
      },
      // Cabeçalhos endurecidos para o painel admin (sobrescreve os públicos)
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: adminCsp },
          ...(!isDev
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

// Wrapper Sentry — comportamento "no-op friendly":
//   - Sem NEXT_PUBLIC_SENTRY_DSN setado, o wrapper roda mas nao injeta
//     nada (sem upload de source map, sem tracing). Build identico.
//   - Com SENTRY_AUTH_TOKEN setado em CI, faz upload de source map
//     durante build. Sem o token, nao tenta upload e nao falha.
export default withSentryConfig(withSerwist(nextConfig), {
  // Org/project — usados na URL do dashboard e no upload de source map.
  org: process.env.SENTRY_ORG || undefined,
  project: process.env.SENTRY_PROJECT || undefined,
  authToken: process.env.SENTRY_AUTH_TOKEN || undefined,

  // Silencia o logger do plugin durante o build.
  silent: true,
  disableLogger: true,

  // Apaga os .map do bundle servido (mantem upload pra Sentry, mas
  // browser publico nao acessa). Reduz superficie de revelacao de
  // codigo-fonte.
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Nao injeta auto-instrumentation no codigo (mantem bundle leve).
  // O instrumentation.ts cuida do que importa.
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
  autoInstrumentAppDirectory: false,
});
