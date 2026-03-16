/**
 * src/utils/pricing.ts
 *
 * Lógica central de precificação de produtos.
 * Fonte única de verdade para ProductCard, página de detalhe e checkout.
 *
 * Antes existiam 3 cópias com pequenas inconsistências entre si:
 *   - ProductCard.tsx
 *   - src/app/produtos/[id]/page.tsx
 *   - src/app/checkout/page.tsx
 */

/** Campos de promoção relevantes para cálculo de preço */
export type PricingPromotion = {
  /** Preço legado (fallback de original_price e final_price quando ausentes) */
  price?: number | string | null;
  /** Preço de lista antes da promoção */
  original_price?: number | string | null;
  /** Preço final já calculado pelo backend (tem prioridade sobre discount_percent) */
  final_price?: number | string | null;
  /** Percentual de desconto (ex: 15 = 15%) */
  discount_percent?: number | string | null;
  /** Alias legado de final_price */
  promo_price?: number | string | null;
};

export type PricingResult = {
  /** Preço sem desconto (preço de lista ou preço base do produto) */
  originalPrice: number;
  /** Preço final a cobrar do cliente */
  finalPrice: number;
  /** Percentual de desconto (null quando não há promoção) */
  discountPercent: number | null;
  /** Valor absoluto de desconto em R$ */
  discountValue: number;
  /** true quando há desconto real aplicado (finalPrice < originalPrice) */
  hasDiscount: boolean;
};

/**
 * Calcula os preços de um produto considerando a promoção ativa.
 *
 * Prioridade para preço original:
 *   1. promotion.original_price
 *   2. promotion.price  (fallback legado)
 *   3. basePrice        (preço cadastrado no produto)
 *
 * Prioridade para preço final:
 *   1. promotion.final_price
 *   2. promotion.promo_price
 *   3. promotion.price         (fallback legado)
 *   4. Se só discount_percent: calcula baseado em originalPrice
 *   5. originalPrice           (sem desconto)
 */
export function computeProductPrice(
  basePrice: number | string,
  promotion: PricingPromotion | null | undefined,
): PricingResult {
  const base = Number(basePrice ?? 0);

  if (!promotion) {
    return {
      originalPrice: base,
      finalPrice: base,
      discountPercent: null,
      discountValue: 0,
      hasDiscount: false,
    };
  }

  // Preço original: campo explícito → price legado → base
  const rawOriginal =
    promotion.original_price != null
      ? promotion.original_price
      : promotion.price != null
        ? promotion.price
        : null;
  const originalPrice = rawOriginal !== null ? Number(rawOriginal) : base || 0;

  // Preço final: final_price → promo_price → price legado
  const rawFinal =
    promotion.final_price != null
      ? promotion.final_price
      : promotion.promo_price != null
        ? promotion.promo_price
        : promotion.price != null
          ? promotion.price
          : null;
  let finalPrice = rawFinal !== null ? Number(rawFinal) : originalPrice;

  // Se só veio discount_percent (sem preço final explícito), aplica o percentual
  const explicitDiscount =
    promotion.discount_percent != null
      ? Number(promotion.discount_percent)
      : NaN;

  if (
    rawFinal === null &&
    !Number.isNaN(explicitDiscount) &&
    explicitDiscount > 0 &&
    originalPrice > 0
  ) {
    finalPrice = originalPrice * (1 - explicitDiscount / 100);
  }

  // Percentual real de desconto
  let discountPercent: number | null = null;
  if (originalPrice > 0 && finalPrice < originalPrice) {
    discountPercent = ((originalPrice - finalPrice) / originalPrice) * 100;
  } else if (!Number.isNaN(explicitDiscount) && explicitDiscount > 0) {
    discountPercent = explicitDiscount;
  }

  const hasDiscount =
    discountPercent !== null &&
    discountPercent > 0 &&
    finalPrice < originalPrice;
  const discountValue = hasDiscount ? originalPrice - finalPrice : 0;

  return { originalPrice, finalPrice, discountPercent, discountValue, hasDiscount };
}
