// src/lib/corretoraJsonLd.ts
//
// Monta payload JSON-LD (schema.org) para a página individual de uma
// corretora. Dois blocos em um único array (suportado pelo Google):
//
//   1. LocalBusiness — para rich results da corretora (endereço,
//      contato, rating agregado, redes sociais).
//   2. BreadcrumbList — trilha "Mercado do Café > Corretoras > X" para
//      exibição de breadcrumbs no SERP.
//
// Retornamos objeto (não string) — o consumer serializa com
// JSON.stringify dentro de <script type="application/ld+json">.

import type { PublicCorretora } from "@/types/corretora";
import { SITE_URL } from "./coffeeMetadata";
import { absUrl } from "@/utils/absUrl";

type JsonLdGraph = Record<string, unknown>[];

function cleanWebsite(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function cleanSocial(value: string | null | undefined, platform: "instagram" | "facebook"): string | null {
  if (!value) return null;
  const raw = value.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const handle = raw.replace(/^@/, "");
  return platform === "instagram"
    ? `https://instagram.com/${handle}`
    : `https://facebook.com/${handle}`;
}

function digitsOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function buildCorretoraJsonLd(corretora: PublicCorretora): JsonLdGraph {
  const pageUrl = `${SITE_URL}/mercado-do-cafe/corretoras/${corretora.slug}`;
  const logoUrl = corretora.logo_path ? absUrl(corretora.logo_path) : null;

  const sameAs: string[] = [];
  const website = cleanWebsite(corretora.website);
  if (website) sameAs.push(website);
  const instagram = cleanSocial(corretora.instagram, "instagram");
  if (instagram) sameAs.push(instagram);
  const facebook = cleanSocial(corretora.facebook, "facebook");
  if (facebook) sameAs.push(facebook);

  const contactPoints: Record<string, unknown>[] = [];
  const whatsappDigits = digitsOnly(corretora.whatsapp);
  if (whatsappDigits) {
    contactPoints.push({
      "@type": "ContactPoint",
      contactType: "sales",
      telephone: `+55${whatsappDigits}`,
      name: "WhatsApp",
      availableLanguage: "pt-BR",
    });
  }
  const phoneDigits = digitsOnly(corretora.phone);
  if (phoneDigits) {
    contactPoints.push({
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: `+55${phoneDigits}`,
      availableLanguage: "pt-BR",
    });
  }
  if (corretora.email) {
    contactPoints.push({
      "@type": "ContactPoint",
      contactType: "customer service",
      email: corretora.email,
      availableLanguage: "pt-BR",
    });
  }

  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": pageUrl,
    name: corretora.name,
    url: pageUrl,
    description:
      corretora.description ||
      `${corretora.name} — corretora de café em ${corretora.city}, ${corretora.state}.`,
    address: {
      "@type": "PostalAddress",
      addressLocality: corretora.city,
      addressRegion: corretora.state,
      addressCountry: "BR",
    },
    areaServed: corretora.region || "Zona da Mata Mineira",
  };

  if (logoUrl) {
    localBusiness.logo = logoUrl;
    localBusiness.image = logoUrl;
  }
  if (sameAs.length) localBusiness.sameAs = sameAs;
  if (contactPoints.length) localBusiness.contactPoint = contactPoints;

  // Rating agregado entra só quando há reviews aprovadas — Google
  // penaliza AggregateRating sem reviewCount real.
  if (
    corretora.reviews_count != null &&
    corretora.reviews_count > 0 &&
    corretora.reviews_avg != null
  ) {
    localBusiness.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(corretora.reviews_avg).toFixed(1),
      reviewCount: corretora.reviews_count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Mercado do Café",
        item: `${SITE_URL}/mercado-do-cafe`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Corretoras",
        item: `${SITE_URL}/mercado-do-cafe/corretoras`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: corretora.name,
        item: pageUrl,
      },
    ],
  };

  return [localBusiness, breadcrumb];
}
