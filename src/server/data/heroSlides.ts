// src/server/data/heroSlides.ts
import "server-only";

export type { HeroSlide } from "@/types/heroSlide";
import type { HeroSlide } from "@/types/heroSlide";

export async function fetchPublicHeroSlides(): Promise<HeroSlide[]> {
  const base = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  try {
    const res = await fetch(`${base}/api/public/hero-slides`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const json = await res.json();
    const raw =
      json?.ok === true && json?.data !== undefined ? json.data : json;

    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}
