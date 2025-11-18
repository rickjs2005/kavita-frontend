// src/app/categorias/[category]/page.tsx
import CategoryPage from "@/components/products/CategoryPage";
import { redirect, notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ category: string }>;
};

const CATEGORY_SLUG_MAP: Record<string, string> = {
  medicamentos: "medicamentos",
  pets: "pets",
  fazenda: "fazenda",
  "pragas-e-insetos": "pragas-e-insetos",
  outros: "outros",
};

export default async function CategoryRoute({ params }: PageProps) {
  const { category } = await params;

  // 🔁 se alguém tentar /categorias/drones, manda pra página especial
  if (category === "drones") {
    redirect("/drones");
  }

  const backendCategory = CATEGORY_SLUG_MAP[category];

  // se não estiver no mapa, mostra 404 bonitinho em vez de chamar a API
  if (!backendCategory) {
    notFound();
  }

  const title =
    category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, " ");

  return <CategoryPage categoria={backendCategory} title={title} />;
}
