// src/types/adminConfig.ts

export interface AdminConfig {
  id: number;

  // Dados básicos da loja
  store_name: string;
  store_slug: string | null;
  cnpj: string | null;
  main_email: string | null;
  main_whatsapp: string | null;
  logo_url: string | null;

  // Regras de checkout
  checkout_require_cpf: boolean;
  checkout_require_address: boolean;
  checkout_allow_pickup: boolean;
  checkout_enable_coupons: boolean;
  checkout_enable_abandoned_cart: boolean;

  // Pagamentos
  payment_pix_enabled: boolean;
  payment_card_enabled: boolean;
  payment_boleto_enabled: boolean;

  mp_public_key: string | null;
  mp_access_token: string | null;
  mp_auto_return: string | null; // ex: "approved"
  mp_sandbox_mode: boolean;

  // Frete
  shipping_flat_enabled: boolean;
  shipping_flat_value: number;
  shipping_free_over: number;
  shipping_region_text: string | null;
  shipping_deadline_text: string | null;

  // Comunicação
  comm_email_enabled: boolean;
  comm_whatsapp_enabled: boolean;

  // SEO / Analytics
  seo_title: string | null;
  seo_description: string | null;
  google_analytics_id: string | null;
  facebook_pixel_id: string | null;

  created_at?: string;
  updated_at?: string;
}
