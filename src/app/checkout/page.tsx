"use client";

import Link from "next/link";
import CloseButton from "@/components/buttons/CloseButton";
import { useCheckoutState } from "./useCheckoutState";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { ShippingSection } from "./sections/ShippingSection";
import { PaymentSection } from "./sections/PaymentSection";
import { OrderSummarySection } from "./sections/OrderSummarySection";
import { CheckoutIcon } from "./checkoutUtils";

export default function CheckoutPage() {
  const state = useCheckoutState();

  // -------------------------------------------------------------------------
  // Not logged in
  // -------------------------------------------------------------------------
  if (!state.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-gradient-start via-white to-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
          <div className="flex items-center justify-between">
            <CloseButton className="text-2xl sm:text-3xl text-gray-600 hover:text-accent" />
            <h1 className="text-lg sm:text-2xl font-extrabold uppercase tracking-wide text-accent">
              Checkout
            </h1>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/95 p-6 sm:p-8 shadow-sm text-center">
            <h2 className="mb-3 text-xl sm:text-2xl font-semibold text-gray-800">
              Faça login para finalizar sua compra
            </h2>
            <p className="mb-6 text-sm sm:text-base text-gray-600">
              Para garantir sua segurança e vincular o pedido à sua conta, é
              necessário estar logado antes de concluir o checkout.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-accent-hover"
              >
                Ir para login
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-black/10 px-6 py-3 text-sm sm:text-base font-medium text-gray-700 transition hover:bg-black/5"
              >
                Voltar para a página inicial
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Checkout (logged in)
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-gradient-start via-white to-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <CloseButton className="text-2xl sm:text-3xl text-gray-600 hover:text-accent" />
          <div className="flex flex-1 flex-col items-center sm:items-start">
            <h1 className="text-lg sm:text-2xl font-extrabold uppercase tracking-wide text-accent">
              Finalizar compra
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Revise seus dados e confirme o pedido com segurança.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs sm:flex sm:text-sm text-gray-500">
            <CheckoutIcon.shield />
            <span>Compra protegida</span>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)] lg:gap-8">
          {/* Left column — forms */}
          <div className="flex flex-col gap-4 sm:gap-6">
            <PersonalInfoSection
              formData={state.formData}
              updateForm={state.updateForm}
            />

            <ShippingSection
              entregaTipo={state.entregaTipo}
              setEntregaTipo={state.setEntregaTipo}
              isPickup={state.isPickup}
              savedAddresses={state.savedAddresses}
              addressesLoading={state.addressesLoading}
              addressesError={state.addressesError}
              selectedAddressId={state.selectedAddressId}
              showNewAddressForm={state.showNewAddressForm}
              setShowNewAddressForm={state.setShowNewAddressForm}
              handleSelectAddress={state.handleSelectAddress}
              handleBackToSavedAddresses={state.handleBackToSavedAddresses}
              formData={state.formData}
              updateForm={state.updateForm}
            />

            <PaymentSection
              formaPagamento={state.formData?.formaPagamento ?? ""}
              updateForm={state.updateForm}
            />
          </div>

          {/* Right column — order summary (sticky on desktop) */}
          <div className="lg:sticky lg:top-6">
          <OrderSummarySection
            normalizedCartItems={state.normalizedCartItems}
            promotions={state.promotions}
            itemsCount={state.itemsCount}
            subtotal={state.subtotal}
            discount={state.discount}
            frete={state.frete}
            total={state.total}
            isPickup={state.isPickup}
            shippingQuote={state.shippingQuote}
            shippingLoading={state.shippingLoading}
            shippingError={state.shippingError}
            isCepValid={state.isCepValid}
            couponCode={state.couponCode}
            setCouponCode={state.setCouponCode}
            couponLoading={state.couponLoading}
            couponMessage={state.couponMessage}
            couponError={state.couponError}
            handleApplyCoupon={state.handleApplyCoupon}
            submitting={state.submitting}
            canFinalizeCheckout={state.canFinalizeCheckout}
            handleSubmit={state.handleSubmit}
          />
          </div>
        </div>
      </div>
    </div>
  );
}
