// src/app/categorias/[category]/page.tsx
import CategoryPage from "@/components/products/CategoryPage";
import { redirect, notFound } from "next/navigation";
import { fetchPublicCategories } from "@/server/data/categories";
export const revalidate = 300; // 5 minutos

type PageProps = {
  params: Promise<{ category: string }>;
};

export default async function CategoryRoute({ params }: PageProps) {
  const { category } = await params;

  // rota especial que você já usa
  if (category === "drones") {
    redirect("/drones");
  }

  // buscar categorias públicas ativas (reutiliza o fetcher da home, que já
  // trata o envelope { ok, data } e filtra/ordena corretamente)
  const categorias = await fetchPublicCategories();

  const cat = categorias.find((c) => c.slug === category);

  if (!cat) {
    notFound();
  }

  return <CategoryPage categoria={cat.slug} title={cat.name} />;
}
