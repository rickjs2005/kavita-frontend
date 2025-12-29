// src/app/page.tsx
import HomeClient from "@/components/home/HomeClient";
import { fetchPublicCategories } from "@/server/data/categories";

export default async function HomePage() {
  const categories = await fetchPublicCategories();
  return <HomeClient categories={categories} />;
}
