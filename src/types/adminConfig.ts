// src/types/adminConfig.ts

export type FooterLink = {
  label: string;
  href: string;
  highlight?: boolean;
};

export type AdminConfig = {
  id?: number;

  /* ======================================================
   * Identidade da loja
   * ====================================================== */
  store_name: string;
  store_slug: string;
  cnpj?: string | null;

  main_email?: string | null;
  main_whatsapp?: string | null;
  logo_url?: string | null;

  /* ======================================================
   * FOOTER (configurações públicas)
   * ====================================================== */
  footer_tagline?: string | null;

  contact_whatsapp?: string | null;
  contact_email?: string | null;

  social_instagram_url?: string | null;
  social_whatsapp_url?: string | null;

  footer_partner_cta_enabled?: boolean;
  footer_partner_cta_title?: string | null;
  footer_partner_cta_text?: string | null;
  footer_partner_cta_href?: string | null;

  footer_links?: FooterLink[] | null;

  /* ======================================================
   * CHECKOUT
   * ====================================================== */
  checkout_require_cpf?: boolean;
  checkout_require_address?: boolean;
  checkout_allow_pickup?: boolean;
  checkout_enable_coupons?: boolean;
  checkout_enable_abandoned_cart?: boolean;

  /* ======================================================
   * PAGAMENTOS (ADMIN ONLY)
   * ⚠️ nunca expostos no endpoint público
   * ====================================================== */
  payment_pix_enabled?: boolean;
  payment_card_enabled?: boolean;
  payment_boleto_enabled?: boolean;

  mp_public_key?: string | null;
  mp_access_token?: string | null;
  mp_auto_return?: string | null;
  mp_sandbox_mode?: boolean;

  /* ======================================================
   * FRETE
   * ====================================================== */
  shipping_flat_enabled?: boolean;
  shipping_flat_value?: number;
  shipping_free_over?: number;
  shipping_region_text?: string | null;
  shipping_deadline_text?: string | null;

  /* ======================================================
   * COMUNICAÇÃO
   * ====================================================== */
  comm_email_enabled?: boolean;
  comm_whatsapp_enabled?: boolean;

  /* ======================================================
   * SEO / TRACKING
   * ====================================================== */
  seo_title?: string | null;
  seo_description?: string | null;
  google_analytics_id?: string | null;
  facebook_pixel_id?: string | null;
};
