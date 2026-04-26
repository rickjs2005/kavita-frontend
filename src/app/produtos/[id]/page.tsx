import { notFound } from "next/navigation";
import type { Product, ProductPromotion } from "@/types/product";
import Gallery from "@/components/ui/Gallery";
import ProductBuyBox from "@/components/products/ProductBuyBox";
import ProductReviews from "./ProductReviews";
import { absUrl } from "@/utils/absUrl";
import { computeProductPrice } from "@/utils/pricing";
import { formatCurrency, formatDateShort } from "@/utils/formatters";

// Revalidate every 60 seconds — balances freshness with performance.
// Product data changes infrequently; promotions are cached server-side.
export const revalidate = 60;

// Server Component: fetch roda no Node.js, precisa de URL absoluta.
// @/utils/absUrl exporta API_BASE="" (vazio, funciona via rewrite do Next
// apenas no browser). Aqui usamos o mesmo padrão da page /servicos/[id]
// e dos fetchers em src/server/data/*.ts — URL absoluta com fallback
// pra dev local. Sem isso, fetch("/api/products/130") lanca
// "Failed to parse URL from /api/products/130" em SSR, getProduto
// retorna null silenciosamente, notFound() dispara — mas o usuario
// via skeleton sem fim em vez do 404 por causa de cache RSC stale.
const SERVER_API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "http://localhost:5000"
).replace(/\/$/, "");

async function getProduto(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/api/products/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`[produto/${id}] backend respondeu ${res.status}`);
      return null;
    }
    const raw = await res.json();
    // Unwrap envelope { ok: true, data: ... } from lib/response.js
    const data = raw?.ok === true && raw?.data !== undefined ? raw.data : raw;
    return data as Product;
  } catch (err) {
    console.error(`[produto/${id}] fetch falhou:`, err);
    return null;
  }
}


async function getPromocaoProduto(
  id: string,
): Promise<ProductPromotion | null> {
  try {
    const res = await fetch(`${SERVER_API_BASE}/api/public/promocoes/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const raw = await res.json();
    // Unwrap envelope { ok: true, data: ... } from lib/response.js.
    // Backend retorna 200 + { data: null } quando produto nao tem promo
    // (ver controllers/promocoesPublicController.js).
    const data = raw?.ok === true && raw?.data !== undefined ? raw.data : raw;
    if (data == null) return null;
    return Array.isArray(data)
      ? ((data[0] as ProductPromotion) ?? null)
      : (data as ProductPromotion);
  } catch {
    // Sem promo nao bloqueia render do produto
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
  const shippingFree = Boolean(produto.shipping_free);
  const shippingFreeFromQty =
    produto.shipping_free_from_qty != null
      ? Number(produto.shipping_free_from_qty)
      : null;

  // ===== PREÇO / DESCONTO =====
  const { originalPrice, finalPrice, discountPercent } = computeProductPrice(
    produto.price,
    promocao,
  );

  const priceBRL = formatCurrency(finalPrice);
  const originalPriceBRL = formatCurrency(originalPrice);

  const promoEndsAt =
    (promocao?.ends_at as string | null) ??
    (promocao?.end_at as string | null) ??
    null;

  // ===== ESTOQUE =====
  const estoque = Number(
    produto.estoque ?? produto.quantity ?? 0,
  );
  const disponivel = estoque > 0;

  // ===== IMAGENS =====
  const extras = Array.isArray(produto.images)
    ? (produto.images as unknown as string[])
    : [];
  const images = Array.from(
    new Set([produto.image, ...extras].filter(Boolean) as string[]),
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
                  Promoção válida até {formatDateShort(promoEndsAt)}, ou
                  enquanto durarem os estoques.
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
