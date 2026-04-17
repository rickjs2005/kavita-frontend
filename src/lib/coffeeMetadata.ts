// src/lib/coffeeMetadata.ts
//
// Helper compartilhado pelas rotas do módulo Mercado do Café para
// montar metadata de SEO + social em um formato único. Centraliza:
//
//   - OpenGraph (og:title, og:description, og:image, og:url, og:type)
//   - Twitter Card (summary_large_image)
//   - canonical URL
//   - robots (delegado — rotas específicas podem sobrescrever)
//
// Mantém o retorno no formato Metadata do Next.js App Router, então
// pode ser consumido direto em `export const metadata = ...` ou
// dentro de `generateMetadata()`.

import type { Metadata } from "next";

// SITE_URL é a origin pública do frontend. Fallback pragmático para
// localhost em dev — em produção a env var é obrigatória (Dockerfile
// e .github/workflows/cd.yml já passam). Tira trailing slash para
// permitir concatenação limpa com paths.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");

const DEFAULT_IMAGE = `${SITE_URL}/og/mercado-do-cafe.jpg`;

export type CoffeeMetadataInput = {
  /** Path relativo (começa com "/"). Não codifica query string. */
  path: string;
  title: string;
  description: string;
  /** URL absoluta ou relativa para imagem social. Default: OG genérica do módulo. */
  image?: string | null;
  /**
   * Quando definido, substitui a canonical da página. Útil para rotas
   * com filtros onde queremos apontar canonical para a URL não-filtrada.
   */
  canonical?: string;
  /** Desabilita indexação (ex.: páginas de sucesso/token). */
  noIndex?: boolean;
};

/** Garante URL absoluta — aceita path relativo ou URL completa. */
function abs(url: string | null | undefined): string {
  if (!url) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function buildCoffeeMetadata(input: CoffeeMetadataInput): Metadata {
  const url = `${SITE_URL}${input.path.startsWith("/") ? "" : "/"}${input.path}`;
  const image = abs(input.image ?? DEFAULT_IMAGE);
  const canonical = input.canonical
    ? `${SITE_URL}${input.canonical.startsWith("/") ? "" : "/"}${input.canonical}`
    : url;

  const metadata: Metadata = {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url,
      title: input.title,
      description: input.description,
      siteName: "Kavita · Mercado do Café",
      locale: "pt_BR",
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };

  if (input.noIndex) {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}

export { SITE_URL };
