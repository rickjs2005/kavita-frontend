"use client";

import LoadingButton from "@/components/buttons/LoadingButton";
import { formatCurrency } from "@/utils/formatters";
import { computeProductPrice } from "@/utils/pricing";
import type { NormalizedCheckoutItem, ProductPromotion, ShippingQuote } from "../checkoutTypes";
import { ruleLabel, CheckoutIcon } from "../checkoutUtils";

type Props = {
  normalizedCartItems: NormalizedCheckoutItem[];
  promotions: Record<number, ProductPromotion | null>;
  itemsCount: number;
  subtotal: number;
  discount: number;
  frete: number;
  total: number;
  isPickup: boolean;
  shippingQuote: ShippingQuote | null;
  shippingLoading: boolean;
  shippingError: string | null;
  isCepValid: boolean;
  couponCode: string;
  setCouponCode: (v: string) => void;
  couponLoading: boolean;
  couponMessage: string | null;
  couponError: string | null;
  handleApplyCoupon: () => void;
  submitting: boolean;
  canFinalizeCheckout: boolean;
  handleSubmit: () => void;
};

export function OrderSummarySection({
  normalizedCartItems,
  promotions,
  itemsCount,
  subtotal,
  discount,
  frete,
  total,
  isPickup,
  shippingQuote,
  shippingLoading,
  shippingError,
  isCepValid,
  couponCode,
  setCouponCode,
  couponLoading,
  couponMessage,
  couponError,
  handleApplyCoupon,
  submitting,
  canFinalizeCheckout,
  handleSubmit,
}: Props) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Product list */}
      <section className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-5 shadow-sm">
        <header className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckoutIcon.truck />
            <h2 className="text-sm sm:text-base font-semibold text-gray-800">
              Resumo do pedido
            </h2>
          </div>
          <span className="text-xs text-gray-500">
            {itemsCount} {itemsCount === 1 ? "item" : "itens"}
          </span>
        </header>

        <div className="max-h-[260px] space-y-3 overflow-y-auto pr-1">
          {normalizedCartItems.map((item) => {
            const info = computeProductPrice(
              item.price,
              promotions[item.id as number],
            );

            return (
              <div
                key={item.__key}
                className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-none last:pb-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {item.name || `Produto #${item.id}`}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Quantidade: {item.quantity}
                  </p>
                  {info.hasDiscount && (
                    <p className="mt-1 text-[11px] text-emerald-600">
                      Promoção aplicada automaticamente
                    </p>
                  )}
                </div>

                <div className="text-right text-xs sm:text-sm">
                  {info.hasDiscount ? (
                    <>
                      <div className="text-gray-400 line-through">
                        {formatCurrency(info.originalPrice * item.quantity)}
                      </div>
                      <div className="font-semibold text-accent">
                        {formatCurrency(info.finalPrice * item.quantity)}
                      </div>
                    </>
                  ) : (
                    <div className="font-medium text-gray-800">
                      {formatCurrency(info.finalPrice * item.quantity)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {!normalizedCartItems.length && (
            <p className="text-xs text-gray-500">Seu carrinho está vazio.</p>
          )}
        </div>
      </section>

      {/* Coupon + totals */}
      <section className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-5 shadow-sm space-y-4">
        {/* Coupon input */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CheckoutIcon.ticket />
            <span className="text-sm font-semibold text-gray-800">
              Cupom de desconto
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Digite o código do cupom"
              className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/70"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {couponLoading ? "Aplicando..." : "Aplicar"}
            </button>
          </div>

          {couponMessage && (
            <p className="mt-1 text-[11px] text-emerald-600">{couponMessage}</p>
          )}
          {couponError && (
            <p className="mt-1 text-[11px] text-red-500">{couponError}</p>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-1 border-t border-gray-100 pt-3 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Desconto</span>
              <span>- {formatCurrency(discount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 text-sm text-gray-700">
            <span className="flex items-center gap-2">
              <span>{isPickup ? "Retirada" : "Frete"}</span>
              {!isPickup && shippingLoading && isCepValid && (
                <span className="text-[11px] text-gray-500">Calculando...</span>
              )}
              {!isPickup && !shippingLoading && shippingQuote?.prazo_dias ? (
                <span className="text-[11px] text-gray-500">
                  ({shippingQuote.prazo_dias}{" "}
                  {shippingQuote.prazo_dias === 1 ? "dia" : "dias"})
                </span>
              ) : null}
            </span>

            <span>
              {isPickup ? (
                <span className="text-[11px] text-emerald-700">Sem frete</span>
              ) : shippingError ? (
                <span className="text-[11px] text-red-500">{shippingError}</span>
              ) : !isCepValid ? (
                "Informe o CEP"
              ) : shippingLoading ? (
                <span className="text-[11px] text-gray-600">Calculando...</span>
              ) : shippingQuote === null ? (
                <span className="text-[11px] text-gray-600">
                  Aguardando cotação
                </span>
              ) : shippingQuote.price === 0 ? (
                "Grátis"
              ) : (
                formatCurrency(frete)
              )}
            </span>
          </div>

          {!isPickup && shippingQuote?.ruleApplied && (
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>Regra do frete</span>
              <span>{ruleLabel(shippingQuote.ruleApplied)}</span>
            </div>
          )}

          <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-2">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-lg font-extrabold text-accent">
              {formatCurrency(total)}
            </span>
          </div>

          {!isPickup && shippingQuote !== null && (
            <p className="text-[10px] text-gray-400">
              O frete é confirmado pelo servidor no momento do pedido.
            </p>
          )}

          <p className="mt-2 text-[11px] text-gray-600">
            Nota fiscal será entregue junto com o produto.
          </p>

          <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
            <CheckoutIcon.shield />
            Pagamento processado com segurança. Nenhum dado sensível fica salvo
            no navegador.
          </p>
        </div>
      </section>

      {/* Submit */}
      <div className="mt-2">
        <LoadingButton
          onClick={handleSubmit}
          isLoading={submitting}
          disabled={!canFinalizeCheckout || submitting}
          className="w-full justify-center rounded-2xl bg-accent py-3 text-sm sm:text-base font-semibold text-white shadow-md shadow-accent/30 transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Confirmar pedido
        </LoadingButton>

        {!canFinalizeCheckout && (
          <p className="mt-2 text-center text-[11px] text-gray-500">
            {isPickup
              ? "Preencha os dados do cliente para continuar."
              : shippingError
                ? "Corrija o erro de frete para continuar."
                : !isCepValid
                  ? "Informe um CEP válido (8 dígitos) para calcular o frete."
                  : shippingLoading
                    ? "Calculando frete…"
                    : shippingQuote === null
                      ? "Aguardando cotação do frete…"
                      : "Preencha os dados para continuar."}
          </p>
        )}

        <p className="mt-2 text-center text-[11px] text-gray-500">
          Ao continuar, você concorda com os{" "}
          <span className="underline underline-offset-2">termos de uso</span> e{" "}
          <span className="underline underline-offset-2">
            política de privacidade
          </span>
          .
        </p>
      </div>
    </div>
  );
}
