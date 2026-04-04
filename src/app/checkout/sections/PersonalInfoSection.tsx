"use client";

import { PersonalInfoForm } from "@/components/checkout/PersonalInfoForm";
import type { CheckoutFormChangeHandler } from "@/hooks/useCheckoutForm";
import { CheckoutIcon } from "../checkoutUtils";

type Props = {
  formData: any;
  updateForm: CheckoutFormChangeHandler;
};

export function PersonalInfoSection({ formData, updateForm }: Props) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent text-xs font-bold">
          1
        </div>
        <div>
          <h2 className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-800">
            <CheckoutIcon.user />
            Dados do cliente
          </h2>
          <p className="text-xs text-gray-500">
            Nome, CPF, e contato para confirmação do pedido.
          </p>
        </div>
      </div>

      <PersonalInfoForm formData={formData} onChange={updateForm} />
    </section>
  );
}
