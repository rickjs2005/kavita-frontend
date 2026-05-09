// src/components/admin/hero/constants.ts
// Limites de validação compartilhados (alinhados com o backend).
// CMS fields (Sprint 5): features e quick_links também têm limites
// próprios — espelhe schemas/heroSlidesSchemas.js no backend ao mudar.

export const LIMITS = {
  title: 255,
  subtitle: 500,
  button_label: 80,
  button_href: 255,
  badge_text: 100,
  videoMaxBytes: 50 * 1024 * 1024, // 50 MB
  imageMaxBytes: 5 * 1024 * 1024,  // 5 MB

  // CMS — mini-features
  maxFeatures: 4,
  feature_title: 60,
  feature_subtitle: 80,

  // CMS — quick links no rodapé
  maxQuickLinks: 5,
  quicklink_kicker: 40,
  quicklink_title: 80,
  quicklink_description: 160,
  quicklink_href: 255,
} as const;
