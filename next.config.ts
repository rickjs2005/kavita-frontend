import type { NextConfig } from "next";

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
  eslint: {
    // Impede que o ESLint quebre o build
    // ESLint continua funcionando via `npm run lint`
    ignoreDuringBuilds: true,
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

    // Hosts do backend permitidos. Em produção, apenas o host derivado de NEXT_PUBLIC_API_URL.
    // Em dev, inclui localhost e IPs locais para facilitar desenvolvimento.
    const apiHosts = isDev
      ? "http://localhost:5000 http://127.0.0.1:5000 http://172.20.10.9:5000"
      : (envPattern
          ? `${envPattern.protocol}://${envPattern.hostname}${envPattern.port ? `:${envPattern.port}` : ""}`
          : "");

    // NOTE: 'unsafe-inline' é exigido pelo Next.js para CSS-in-JS e injeção de styles.
    // 'unsafe-eval' é exigido pelo Next.js em dev mode e alguns internals do React.
    // Em produção, 'unsafe-eval' é removido — não é necessário para o bundle de produção.
    // Migração futura: nonce-based CSP via middleware para eliminar 'unsafe-inline'.
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";

    const adminCsp = [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      // Removido https://via.placeholder.com — usar placeholder local em /public/
      `img-src 'self' data: blob: ${apiHosts}`,
      "font-src 'self' data:",
      `connect-src 'self' ${apiHosts}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      // Força upgrade de recursos HTTP para HTTPS em produção
      ...(!isDev ? ["upgrade-insecure-requests"] : []),
    ]
      .filter((d) => !d.trim().endsWith(" ")) // remove diretivas com hosts vazios
      .join("; ");

    // CSP parcial para rotas públicas.
    // Não inclui script-src/style-src completos para não bloquear recursos de terceiros.
    // Inclui apenas as diretivas que protegem sem causar falsos positivos:
    //   - form-action: impede que formulários enviem dados para domínios externos (phishing)
    //   - object-src: bloqueia Flash/Java/plugins legados
    //   - frame-ancestors: reforça X-Frame-Options via CSP (melhor suporte em browsers modernos)
    const publicCspHeaders = [
      { key: "Content-Security-Policy", value: "form-action 'self'; object-src 'none'; frame-ancestors 'self'" },
    ];

    // Headers básicos aplicados a TODAS as rotas (incluindo públicas).
    // Protegem contra clickjacking, MIME sniffing e information leakage.
    const baseHeaders = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      ...publicCspHeaders,
    ];

    // Em produção, adiciona HSTS (não em dev pois não há HTTPS local).
    if (!isDev) {
      baseHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [
      // Cabeçalhos básicos para todas as rotas
      {
        source: "/:path*",
        headers: baseHeaders,
      },
      // Cabeçalhos endurecidos para o painel admin (inclui CSP completa)
      {
        source: "/admin/:path*",
        headers: [
          // X-Frame-Options mais restritivo para o admin
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "Content-Security-Policy", value: adminCsp },
          { key: "X-DNS-Prefetch-Control", value: "off" },
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

export default nextConfig;
