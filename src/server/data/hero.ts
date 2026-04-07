// src/server/data/hero.ts
import "server-only";

export type { HeroData } from "@/types/hero";
import type { HeroData } from "@/types/hero";

function defaultHeroData(): HeroData {
  return {
    hero_video_url: "",
    hero_video_path: "",
    hero_image_url: "",
    hero_image_path: "",
    title: "",
    subtitle: "",
    button_label: "Saiba Mais",
    button_href: "/drones",
  };
}

export async function fetchPublicHero(): Promise<HeroData> {
  const base = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const fallback = defaultHeroData();

  try {
    const res = await fetch(`${base}/api/public/site-hero`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return fallback;

    const json = await res.json();
    const raw =
      json?.ok === true && json?.data !== undefined ? json.data : json;

    return {
      hero_video_url: raw?.hero_video_url || "",
      hero_video_path: raw?.hero_video_path || "",
      hero_image_url: raw?.hero_image_url || "",
      hero_image_path: raw?.hero_image_path || "",
      title: raw?.title || "",
      subtitle: raw?.subtitle || "",
      button_label: raw?.button_label || "Saiba Mais",
      button_href: raw?.button_href || "/drones",
    };
  } catch {
    return fallback;
  }
}
