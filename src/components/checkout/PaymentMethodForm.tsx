import { CheckoutFormChangeHandler, CheckoutFormData } from "@/hooks/useCheckoutForm";

const OPTIONS: Array<{ value: CheckoutFormData["formaPagamento"]; label: string }> = [
  { value: "Pix", label: "Pix" },
  { value: "Boleto", label: "Boleto" },
  { value: "Cartão (Mercado Pago)", label: "Cartão (Mercado Pago)" },
  { value: "Prazo", label: "Prazo" },
];

type PaymentMethodFormProps = {
  formaPagamento: CheckoutFormData["formaPagamento"];
  onChange: CheckoutFormChangeHandler;
};

export function PaymentMethodForm({ formaPagamento, onChange }: PaymentMethodFormProps) {
  const selectId = "checkout-payment-method";

  return (
    <div className="mt-6 sm:mt-8">
      <label className="text-base sm:text-lg font-semibold mb-2 block" htmlFor={selectId}>
        Forma de Pagamento
      </label>

      <select
        id={selectId}
        name="formaPagamento"
        value={formaPagamento}
        onChange={onChange}
        aria-describedby="checkout-payment-hint"
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 mt-1 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
      >
        {OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <p className="text-xs sm:text-sm text-gray-600 mt-2" id="checkout-payment-hint">
        💳 Cartão processado com segurança pelo Mercado Pago.
      </p>
    </div>
  );
}

export default PaymentMethodForm;
