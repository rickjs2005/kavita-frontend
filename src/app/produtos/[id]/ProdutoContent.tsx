import { useEffect, useState } from "react";
import type { Product, ProductPromotion } from "@/types/product";
import Gallery from "@/components/ui/Gallery";
import ProductBuyBox from "@/components/products/ProductBuyBox";
import ProductReviews from "./ProductReviews";
import { absUrl } from "@/utils/absUrl";
import apiClient from "@/lib/apiClient";
import { computeProductPrice } from "@/utils/pricing";
import { formatCurrency } from "@/utils/formatters";

interface Props {
  produto: Product;
}

export default function ProdutoContent({ produto }: Props) {
  // ===== IMAGENS =====
  const extras = Array.isArray(produto.images)
    ? (produto.images as unknown as string[])
    : [];
  const allRaw = [produto.image, ...extras].filter(Boolean);
  const images = Array.from(
    new Set(
      allRaw
        .map((img) => absUrl(img as string | null))
        .filter(Boolean) as string[],
    ),
  );

  const estoque = Number(
    produto.estoque ?? produto.quantity ?? 0,
  );
  const disponivel = estoque > 0;

  // ===== PROMOÇÃO / DESCONTO =====
  const [promocao, setPromocao] = useState<ProductPromotion | null>(null);

  useEffect(() => {
    async function carregarPromocao() {
      try {
        if (!produto?.id) return;

        const data = await apiClient.get(
          `/api/public/promocoes/${produto.id}`,
        );
        const promo = Array.isArray(data)
          ? ((data[0] as ProductPromotion) ?? null)
          : (data as ProductPromotion);

        setPromocao(promo);
      } catch {
        // sem promoção para este produto — ignora silenciosamente
      }
    }

    carregarPromocao();
  }, [produto?.id]);

  // ===== LÓGICA DE PREÇO / DESCONTO =====
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

  // Esse é o produto que vai para o carrinho já com o preço final
  const produtoComPrecoFinal: Product = {
    ...produto,
    price: finalPrice,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 md:py-12 space-y-8 sm:space-y-10">
      {/* ===== BLOCO PRINCIPAL: GALERIA + INFO + COMPRA ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* Galeria (lado esquerdo) */}
        <div className="md:sticky md:top-24 h-fit">
          <Gallery images={images} alt={produto.name} />
        </div>

        {/* Conteúdo + caixa de compra (lado direito) */}
        <div className="flex flex-col gap-6">
          <header className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
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
              <span className="text-xs text-gray-500">ID #{produto.id}</span>

              {discountPercent && discountPercent > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
                  -{discountPercent.toFixed(0)}% OFF
                </span>
              )}
            </div>
          </header>

          {/* PREÇO + DESCONTO */}
          <div className="space-y-1">
            {discountPercent &&
              discountPercent > 0 &&
              originalPrice > finalPrice && (
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

          {/* Descrição */}
          <div className="prose max-w-none text-gray-700">
            <p>{produto.description || "Sem descrição disponível."}</p>
          </div>

          {/* Caixa de compra usando PREÇO FINAL */}
          <ProductBuyBox product={produtoComPrecoFinal} stock={estoque} />
        </div>
      </div>

      {/* ===== AVALIAÇÕES — delegado ao componente consolidado ===== */}
      <ProductReviews
        produtoId={produto.id}
        ratingAvg={produto.rating_avg ?? undefined}
        ratingCount={produto.rating_count ?? undefined}
      />
    </div>
  );
}
