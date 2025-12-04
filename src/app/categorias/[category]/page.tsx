// src/app/categorias/[category]/page.tsx
import CategoryPage from "@/components/products/CategoryPage";
import { redirect, notFound } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type PageProps = {
  params: Promise<{ category: string }>;
};

type PublicCategoria = {
  id: number;
  name: string;
  slug: string;
  is_active?: boolean | 0 | 1;
};

export default async function CategoryRoute({ params }: PageProps) {
  const { category } = await params;

  // rota especial que você já usa
  if (category === "drones") {
    redirect("/drones");
  }

  // buscar categorias públicas ativas
  const res = await fetch(`${API_BASE}/api/public/categorias`, {
    // evitar cache agressivo
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    // se der erro na API, melhor 404 do que quebrar
    notFound();
  }

  const categorias = (await res.json()) as PublicCategoria[];

  const cat = categorias.find((c) => c.slug === category);

  if (!cat) {
    notFound();
  }

  const title = cat.name;

  return <CategoryPage categoria={cat.slug} title={title} />;
}
