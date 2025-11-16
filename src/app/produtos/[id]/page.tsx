// src/app/produto/[id]/page.tsx
import { notFound } from "next/navigation";
import type { Product } from "@/types/product";
import Gallery from "@/components/ui/Gallery";
import ProductBuyBox from "@/components/products/ProductBuyBox";

export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Normaliza qualquer caminho vindo do backend para uma URL válida do <Image> */
function absUrl(raw?: string | null): string {
  if (!raw) return "/placeholder.png";
  const s = String(raw).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/uploads")) return `${API}${s}`;
  if (s.startsWith("uploads")) return `${API}/${s}`;
  if (!s.startsWith("/")) return `${API}/uploads/${s}`;
  return `${API}${s}`;
}

async function getProduto(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API}/api/products/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: ProductPageProps) {
  const { id } = await params;
  const produto = await getProduto(id);
  if (!produto) return notFound();

  // imagens (image + images[]), únicas e absolutas
  const extras = Array.isArray(produto.images) ? (produto.images as unknown as string[]) : [];
  const images = Array.from(new Set([produto.image, ...extras].filter(Boolean) as string[])).map(absUrl);

  const priceBRL = Number(produto.price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const estoque = Number((produto as any).estoque ?? (produto as any).quantity ?? 0);
  const disponivel = estoque > 0;

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Galeria fixa (desktop) */}
        <div className="md:sticky md:top-24 h-fit">
          <Gallery images={images} alt={produto.name} />
        </div>

        {/* Conteúdo */}
        <div className="flex flex-col gap-6">
          <header className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              {produto.name}
            </h1>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                  disponivel
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-red-50 text-red-700 ring-1 ring-red-200"
                }`}
              >
                {disponivel ? "Em estoque" : "Esgotado"}
              </span>
              <span className="text-xs text-gray-500">ID #{produto.id}</span>
            </div>
          </header>

          {/* Preço */}
          <div>
            <p className="text-3xl font-extrabold text-emerald-600">{priceBRL}</p>
          </div>

          {/* Descrição */}
          <div className="prose max-w-none text-gray-700">
            <p>{produto.description || "Sem descrição disponível."}</p>
          </div>

          {/* Caixa de compra (client) */}
          <ProductBuyBox product={produto} stock={estoque} />
        </div>
      </div>
    </section>
  );
}
