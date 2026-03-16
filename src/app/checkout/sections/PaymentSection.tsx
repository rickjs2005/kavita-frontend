"use client";

import { PaymentMethodForm } from "@/components/checkout/PaymentMethodForm";
import { CheckoutIcon } from "../checkoutUtils";

type Props = {
  formaPagamento: string;
  updateForm: (field: string, value: any) => void;
};

export function PaymentSection({ formaPagamento, updateForm }: Props) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0EA5E9]/10 text-[#0284C7] text-xs font-bold">
          3
        </div>
        <div>
          <h2 className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-800">
            <CheckoutIcon.card />
            Pagamento
          </h2>
          <p className="text-xs text-gray-500">
            Escolha a melhor forma de pagamento para você.
          </p>
        </div>
      </div>

      <PaymentMethodForm formaPagamento={formaPagamento} onChange={updateForm} />
    </section>
  );
}
