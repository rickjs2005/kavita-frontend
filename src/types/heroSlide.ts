// src/types/heroSlide.ts
//
// Type for hero carousel slides — used in public carousel and admin CRUD.
//
// CMS fields (Sprint 5 / 2026-05-09):
//   - badge_icon: chave do catálogo de ícones (lib/heroIcons.tsx).
//     Quando null, renderiza ícone default (folha).
//   - features: até 4 mini-features exibidos abaixo do CTA. Quando
//     null/vazio, o componente usa fallback hardcoded de 3 itens.
//   - quick_links: até 5 cards exibidos no rodapé do hero. Quando
//     null/vazio, o rodapé não é renderizado.

export type HeroFeature = {
  icon: string;
  title: string;
  subtitle: string;
};

export type HeroQuickLink = {
  icon: string;
  kicker: string;
  title: string;
  description: string;
  href?: string | null;
};

export type HeroSlide = {
  id: number;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  badge_icon: string | null;
  slide_type: "promotional" | "institutional" | "informational";
  hero_video_url: string | null;
  hero_video_path: string | null;
  hero_image_url: string | null;
  hero_image_path: string | null;
  button_label: string;
  button_href: string;
  button_secondary_label: string | null;
  button_secondary_href: string | null;
  features: HeroFeature[] | null;
  quick_links: HeroQuickLink[] | null;
  sort_order: number;
  is_active: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};
