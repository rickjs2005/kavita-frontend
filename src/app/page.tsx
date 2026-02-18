import HomeClient from "@/components/home/HomeClient";
import { fetchPublicCategories } from "@/server/data/categories";

export const revalidate = 300; // 5 minutos

export default async function HomePage() {
  const categories = await fetchPublicCategories();
  return <HomeClient categories={categories} />;
}
