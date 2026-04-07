import HomeClient from "@/components/home/HomeClient";
import { fetchPublicCategories } from "@/server/data/categories";
import { fetchPublicHeroSlides } from "@/server/data/heroSlides";
import { fetchPublicShopSettings } from "@/server/data/shopSettings";

export const revalidate = 300; // 5 minutos

export default async function HomePage() {
  const [categories, shop, heroSlides] = await Promise.all([
    fetchPublicCategories(),
    fetchPublicShopSettings(),
    fetchPublicHeroSlides(),
  ]);
  return (
    <HomeClient
      categories={categories}
      shop={shop}
      heroSlides={heroSlides}
    />
  );
}
