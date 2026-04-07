// src/types/heroSlide.ts
//
// Type for hero carousel slides — used in public carousel and admin CRUD.

export type HeroSlide = {
  id: number;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  slide_type: "promotional" | "institutional" | "informational";
  hero_video_url: string | null;
  hero_video_path: string | null;
  hero_image_url: string | null;
  hero_image_path: string | null;
  button_label: string;
  button_href: string;
  button_secondary_label: string | null;
  button_secondary_href: string | null;
  sort_order: number;
  is_active: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};
