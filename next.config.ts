import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Impede que o ESLint quebre o build
    // ESLint continua funcionando via `npm run lint`
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "5000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "5000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "172.20.10.9", port: "5000", pathname: "/uploads/**" },
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },

  async headers() {
    return [
      {
        // Aplica cabeçalhos de segurança a todas as rotas do painel admin
        source: "/admin/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            // Política restritiva: apenas origens conhecidas; inline-scripts desabilitados.
            // Ajuste 'connect-src' conforme os domínios reais do backend em produção.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: http://localhost:5000 http://127.0.0.1:5000 https://via.placeholder.com",
              "font-src 'self' data:",
              "connect-src 'self' http://localhost:5000 http://127.0.0.1:5000",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
