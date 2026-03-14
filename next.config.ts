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
            // NOTE: 'unsafe-inline' is required by Next.js for CSS-in-JS and style injection.
            // 'unsafe-eval' is required by Next.js dev mode and some React internals.
            // These can be tightened further in production by using nonce-based CSP via middleware
            // once inline scripts are migrated to external modules.
            // This CSP still protects against third-party script injection and clickjacking.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: http://localhost:5000 http://127.0.0.1:5000 http://172.20.10.9:5000 https://via.placeholder.com",
              "font-src 'self' data:",
              "connect-src 'self' http://localhost:5000 http://127.0.0.1:5000 http://172.20.10.9:5000",
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
