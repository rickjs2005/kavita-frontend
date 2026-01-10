// src/server/data/shopSettings.ts

export type FooterLink = {
  label: string;
  href: string;
  highlight?: boolean;
};

export type PublicShopSettings = {
  // Identidade
  store_name: string;
  logo_url: string;

  // Campos "flat"
  footer_tagline?: string;

  contact_whatsapp?: string;
  contact_email?: string;

  cnpj?: string;

  social_instagram_url?: string;
  social_whatsapp_url?: string;

  footer_partner_cta_enabled?: boolean;
  footer_partner_cta_title?: string;
  footer_partner_cta_text?: string;
  footer_partner_cta_href?: string;

  footer_links?: FooterLink[];

  // ✅ Endereço (Sede) - flat
  address_city?: string;
  address_state?: string;
  address_street?: string;
  address_neighborhood?: string;
  address_zip?: string;

  // Compat (para Footer/Header que ainda leem shop.footer.*)
  footer?: {
    tagline?: string;
    contact_whatsapp?: string;
    contact_email?: string;
    social_instagram_url?: string;
    social_whatsapp_url?: string;

    // ✅ Endereço (Sede) - compat
    address_city?: string;
    address_state?: string;
    address_street?: string;
    address_neighborhood?: string;
    address_zip?: string;

    partner_cta?: {
      enabled?: boolean;
      title?: string;
      text?: string;
      href?: string;
    };
    links?: FooterLink[];
  };
};

function toStr(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s ? s : undefined;
}

function toBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0") return false;
  }
  return undefined;
}

function normalizeFooterLinks(input: unknown): FooterLink[] | undefined {
  if (input == null) return undefined;

  let raw: unknown = input;

  // Se vier como string JSON
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      // string inválida -> não quebra, apenas ignora
      return [];
    }
  }

  if (!Array.isArray(raw)) return [];

  const cleaned: FooterLink[] = raw
    .map((item: any) => {
      if (!item || typeof item !== "object") return null;

      const label = toStr(item.label);
      const href = toStr(item.href);
      if (!label || !href) return null;

      const highlight =
        typeof item.highlight === "boolean" ? item.highlight : undefined;

      return {
        label: label.slice(0, 60),
        href: href.slice(0, 200),
        ...(typeof highlight === "boolean" ? { highlight } : {}),
      } as FooterLink;
    })
    .filter(Boolean) as FooterLink[];

  return cleaned;
}

function defaultPublicSettings(): PublicShopSettings {
  // Default “seguro”: não inventa contatos/links sociais.
  return {
    store_name: "Kavita",
    logo_url: "",
    footer_tagline: "Conectando você ao melhor da agropecuária com qualidade e tradição.",
    footer_links: [
      { label: "Home", href: "/" },
      { label: "Serviços", href: "/servicos" },
      { label: "Contato", href: "/contato" },
    ],
    footer: {
      tagline: "Conectando você ao melhor da agropecuária com qualidade e tradição.",
      links: [
        { label: "Home", href: "/" },
        { label: "Serviços", href: "/servicos" },
        { label: "Contato", href: "/contato" },
      ],
    },
  };
}

type AnyObj = Record<string, any>;

function buildFooterFromFlat(
  flat: AnyObj,
  legacyFooter: AnyObj,
  footerLinks?: FooterLink[]
): PublicShopSettings["footer"] {
  // Regra: prioriza flat -> depois legacyFooter
  const tagline = toStr(flat.footer_tagline) ?? toStr(legacyFooter.tagline);
  const contact_whatsapp =
    toStr(flat.contact_whatsapp) ?? toStr(legacyFooter.contact_whatsapp);
  const contact_email =
    toStr(flat.contact_email) ?? toStr(legacyFooter.contact_email);

  const social_instagram_url =
    toStr(flat.social_instagram_url) ?? toStr(legacyFooter.social_instagram_url);
  const social_whatsapp_url =
    toStr(flat.social_whatsapp_url) ?? toStr(legacyFooter.social_whatsapp_url);

  // ✅ Endereço: prioriza flat -> depois legacyFooter
  const address_city =
    toStr(flat.address_city) ?? toStr(legacyFooter.address_city);
  const address_state =
    toStr(flat.address_state) ?? toStr(legacyFooter.address_state);
  const address_street =
    toStr(flat.address_street) ?? toStr(legacyFooter.address_street);
  const address_neighborhood =
    toStr(flat.address_neighborhood) ?? toStr(legacyFooter.address_neighborhood);
  const address_zip =
    toStr(flat.address_zip) ?? toStr(legacyFooter.address_zip);

  const enabled =
    toBool(flat.footer_partner_cta_enabled) ??
    toBool(legacyFooter?.partner_cta?.enabled);

  const title =
    toStr(flat.footer_partner_cta_title) ?? toStr(legacyFooter?.partner_cta?.title);
  const text =
    toStr(flat.footer_partner_cta_text) ?? toStr(legacyFooter?.partner_cta?.text);
  const href =
    toStr(flat.footer_partner_cta_href) ?? toStr(legacyFooter?.partner_cta?.href);

  const footer: PublicShopSettings["footer"] = {
    ...(tagline ? { tagline } : {}),
    ...(contact_whatsapp ? { contact_whatsapp } : {}),
    ...(contact_email ? { contact_email } : {}),
    ...(social_instagram_url ? { social_instagram_url } : {}),
    ...(social_whatsapp_url ? { social_whatsapp_url } : {}),

    ...(address_city ? { address_city } : {}),
    ...(address_state ? { address_state } : {}),
    ...(address_street ? { address_street } : {}),
    ...(address_neighborhood ? { address_neighborhood } : {}),
    ...(address_zip ? { address_zip } : {}),

    ...(footerLinks ? { links: footerLinks } : {}),
  };

  // Só inclui partner_cta se tiver algo útil (evita “bloco fantasma”)
  const hasCta = typeof enabled === "boolean" || !!title || !!text || !!href;

  if (hasCta) {
    footer.partner_cta = {
      ...(typeof enabled === "boolean" ? { enabled } : {}),
      ...(title ? { title } : {}),
      ...(text ? { text } : {}),
      ...(href ? { href } : {}),
    };
  }

  return footer;
}

/**
 * Busca config pública no backend.
 * CRÍTICO: sem cache (no-store) para refletir mudanças do Admin imediatamente.
 */
export async function fetchPublicShopSettings(): Promise<PublicShopSettings> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const fallback = defaultPublicSettings();

  try {
    const res = await fetch(`${base}/api/config`, {
      cache: "no-store",
    });

    if (!res.ok) return fallback;

    const raw = (await res.json()) as AnyObj;

    const legacyFooter: AnyObj =
      raw?.footer && typeof raw.footer === "object" ? raw.footer : {};

    const footerLinks =
      normalizeFooterLinks(raw?.footer_links) ??
      normalizeFooterLinks(legacyFooter?.links) ??
      fallback.footer_links;

    // Flat normalizado (sem inventar valores)
    const normalizedFlat: PublicShopSettings = {
      store_name: toStr(raw?.store_name) ?? fallback.store_name,
      logo_url: toStr(raw?.logo_url) ?? fallback.logo_url,

      footer_tagline:
        toStr(raw?.footer_tagline) ??
        toStr(legacyFooter?.tagline) ??
        fallback.footer_tagline,

      contact_whatsapp:
        toStr(raw?.contact_whatsapp) ?? toStr(legacyFooter?.contact_whatsapp),

      contact_email: toStr(raw?.contact_email) ?? toStr(legacyFooter?.contact_email),

      cnpj: toStr(raw?.cnpj),

      social_instagram_url:
        toStr(raw?.social_instagram_url) ?? toStr(legacyFooter?.social_instagram_url),

      social_whatsapp_url:
        toStr(raw?.social_whatsapp_url) ?? toStr(legacyFooter?.social_whatsapp_url),

      footer_partner_cta_enabled:
        toBool(raw?.footer_partner_cta_enabled) ?? toBool(legacyFooter?.partner_cta?.enabled),

      footer_partner_cta_title:
        toStr(raw?.footer_partner_cta_title) ?? toStr(legacyFooter?.partner_cta?.title),

      footer_partner_cta_text:
        toStr(raw?.footer_partner_cta_text) ?? toStr(legacyFooter?.partner_cta?.text),

      footer_partner_cta_href:
        toStr(raw?.footer_partner_cta_href) ?? toStr(legacyFooter?.partner_cta?.href),

      footer_links: footerLinks,

      // ✅ Endereço (flat)
      address_city: toStr(raw?.address_city) ?? toStr(legacyFooter?.address_city),
      address_state: toStr(raw?.address_state) ?? toStr(legacyFooter?.address_state),
      address_street: toStr(raw?.address_street) ?? toStr(legacyFooter?.address_street),
      address_neighborhood:
        toStr(raw?.address_neighborhood) ?? toStr(legacyFooter?.address_neighborhood),
      address_zip: toStr(raw?.address_zip) ?? toStr(legacyFooter?.address_zip),
    };

    // ✅ Monta SEMPRE o objeto footer a partir dos flat/legacy
    const builtFooter = buildFooterFromFlat(raw, legacyFooter, footerLinks);

    // Se a API não mandar nada mesmo, mantém um footer mínimo (tagline + links)
    const footerFinal: PublicShopSettings["footer"] = {
      ...fallback.footer,
      ...builtFooter,
      links:
        builtFooter?.links && builtFooter.links.length
          ? builtFooter.links
          : fallback.footer?.links,
    };

    return {
      ...fallback,
      ...normalizedFlat,
      footer: footerFinal,
      footer_links:
        normalizedFlat.footer_links && normalizedFlat.footer_links.length
          ? normalizedFlat.footer_links
          : fallback.footer_links,
    };
  } catch {
    return fallback;
  }
}
