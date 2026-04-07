// src/types/hero.ts
//
// Tipo canônico da Hero Section — usado tanto na área pública quanto no admin.
// Reflete o shape retornado por GET /api/public/site-hero e GET /api/admin/site-hero.

export type HeroData = {
  hero_video_url: string;
  hero_video_path: string;
  hero_image_url: string;
  hero_image_path: string;
  title: string;
  subtitle: string;
  button_label: string;
  button_href: string;
};
