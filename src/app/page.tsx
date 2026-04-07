import HomeClient from "@/components/home/HomeClient";
import { fetchPublicCategories } from "@/server/data/categories";
import { fetchPublicHero } from "@/server/data/hero";
import { fetchPublicShopSettings } from "@/server/data/shopSettings";

export const revalidate = 300; // 5 minutos

export default async function HomePage() {
  const [categories, shop, hero] = await Promise.all([
    fetchPublicCategories(),
    fetchPublicShopSettings(),
    fetchPublicHero(),
  ]);
  return <HomeClient categories={categories} shop={shop} hero={hero} />;
}
