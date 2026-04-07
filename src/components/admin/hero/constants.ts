// src/components/admin/hero/constants.ts
// Limites de validação compartilhados (alinhados com o backend).

export const LIMITS = {
  title: 255,
  subtitle: 500,
  button_label: 80,
  button_href: 255,
  badge_text: 100,
  videoMaxBytes: 50 * 1024 * 1024, // 50 MB
  imageMaxBytes: 5 * 1024 * 1024,  // 5 MB
} as const;
