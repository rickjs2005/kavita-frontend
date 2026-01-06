import { notFound } from "next/navigation";
import type { Product } from "@/types/product";
import Gallery from "@/components/ui/Gallery";
import ProductBuyBox from "@/components/products/ProductBuyBox";
import ProductReviews from "./ProductReviews";

export const dynamic = "force-dynamic";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/** Normaliza qualquer caminho vindo do backend para uma URL válida */
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
    const res = await fetch(`${API}/api/products/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

type ProductPromotion = {
  id: number;
  product_id: number;
  price?: number | string | null;
  original_price?: number | string | null;
  final_price?: number | string | null;
  discount_percent?: number | string | null;
  promo_price?: number | string | null;
  start_at?: string | null;
  end_at?: string | null;
  ends_at?: string | null;
  is_active?: number | boolean;
};

async function getPromocaoProduto(
  id: string
): Promise<ProductPromotion | null> {
  try {
    const res = await fetch(`${API}/api/public/promocoes/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data)
      ? (data[0] as ProductPromotion) ?? null
      : (data as ProductPromotion);
  } catch {
    return null;
  }
}

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: ProductPageProps) {
  const { id } = await params;

  const [produto, promocao] = await Promise.all([
    getProduto(id),
    getPromocaoProduto(id),
  ]);

  if (!produto) return notFound();

  // ===== FRETE GRÁTIS =====
  const shippingFree = Boolean((produto as any).shipping_free);
  const shippingFreeFromQty =
    (produto as any).shipping_free_from_qty != null
      ? Number((produto as any).shipping_free_from_qty)
      : null;

  // ===== PREÇO / DESCONTO =====
  const precoBase = Number(produto.price ?? 0);

  const originalFromPromo = promocao?.original_price ?? promocao?.price ?? null;
  const finalFromPromo =
    promocao?.final_price ??
    promocao?.promo_price ??
    promocao?.price ??
    null;

  const originalPrice =
    originalFromPromo != null ? Number(originalFromPromo) : precoBase;

  let finalPrice =
    finalFromPromo != null ? Number(finalFromPromo) : originalPrice;

  let discountPercent: number | null = null;

  if (promocao) {
    const explicit =
      promocao.discount_percent != null
        ? Number(promocao.discount_percent)
        : NaN;

    if (!finalFromPromo && !Number.isNaN(explicit) && explicit > 0) {
      finalPrice = originalPrice * (1 - explicit / 100);
    }

    if (originalPrice > 0 && finalPrice < originalPrice) {
      discountPercent =
        ((originalPrice - finalPrice) / originalPrice) * 100;
    } else if (!Number.isNaN(explicit) && explicit > 0) {
      discountPercent = explicit;
    }
  }

  const priceBRL = finalPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const originalPriceBRL = originalPrice.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const promoEndsAt =
    (promocao?.ends_at as string | null) ??
    (promocao?.end_at as string | null) ??
    null;

  // ===== ESTOQUE =====
  const estoque = Number(
    (produto as any).estoque ?? (produto as any).quantity ?? 0
  );
  const disponivel = estoque > 0;

  // ===== IMAGENS =====
  const extras = Array.isArray(produto.images)
    ? (produto.images as unknown as string[])
    : [];
  const images = Array.from(
    new Set([produto.image, ...extras].filter(Boolean) as string[])
  ).map(absUrl);

  const produtoComPrecoFinal: Product = {
    ...produto,
    price: finalPrice,
  };

  return (
    <>
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="md:sticky md:top-24 h-fit">
            <Gallery images={images} alt={produto.name} />
          </div>

          <div className="flex flex-col gap-6">
            <header className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
                {produto.name}
              </h1>

              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    disponivel
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                      : "bg-red-50 text-red-700 ring-1 ring-red-200"
                  }`}
                >
                  {disponivel ? "Em estoque" : "Esgotado"}
                </span>

                {discountPercent && discountPercent > 0 && (
                  <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    -{discountPercent.toFixed(0)}% OFF
                  </span>
                )}

                {shippingFree && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    {shippingFreeFromQty
                      ? `Frete grátis a partir de ${shippingFreeFromQty} un.`
                      : "Frete grátis"}
                  </span>
                )}
              </div>
            </header>

            <div className="space-y-1">
              {discountPercent && discountPercent > 0 && (
                <div className="flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="text-sm text-gray-400 line-through">
                    {originalPriceBRL}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    economia de {discountPercent.toFixed(0)}%
                  </span>
                </div>
              )}

              <p className="text-3xl font-extrabold text-emerald-600">
                {priceBRL}
              </p>

              {promoEndsAt && (
                <p className="text-xs text-amber-700">
                  Promoção válida até{" "}
                  {new Date(promoEndsAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                  , ou enquanto durarem os estoques.
                </p>
              )}
            </div>

            <div className="prose max-w-none text-gray-700">
              <p>{produto.description || "Sem descrição disponível."}</p>
            </div>

            <ProductBuyBox product={produtoComPrecoFinal} stock={estoque} />
          </div>
        </div>
      </section>

      <ProductReviews
        produtoId={produto.id}
        ratingAvg={produto.rating_avg ?? undefined}
        ratingCount={produto.rating_count ?? undefined}
      />
    </>
  );
}
