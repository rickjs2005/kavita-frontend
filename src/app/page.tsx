import HomeClient from "@/components/home/HomeClient";
import { fetchPublicCategories } from "@/server/data/categories";
import { fetchPublicShopSettings } from "@/server/data/shopSettings";

export const revalidate = 300; // 5 minutos

export default async function HomePage() {
  const [categories, shop] = await Promise.all([
    fetchPublicCategories(),
    fetchPublicShopSettings(),
  ]);
  return <HomeClient categories={categories} shop={shop} />;
}
