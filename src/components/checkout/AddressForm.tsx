import { CheckoutFormChangeHandler, Endereco } from "@/hooks/useCheckoutForm";

const ADDRESS_FIELDS: Array<{
  name: keyof Endereco;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric";
  colSpan?: "full";
}> = [
  {
    name: "cep",
    label: "CEP",
    autoComplete: "postal-code",
    placeholder: "00000-000",
    inputMode: "numeric",
  },
  {
    name: "estado",
    label: "Estado",
    autoComplete: "address-level1",
  },
  {
    name: "cidade",
    label: "Cidade",
    autoComplete: "address-level2",
  },
  {
    name: "bairro",
    label: "Bairro",
  },
  {
    name: "logradouro",
    label: "Logradouro",
    autoComplete: "street-address",
    colSpan: "full",
  },
  {
    name: "numero",
    label: "Número",
    inputMode: "text",
  },
  {
    name: "referencia",
    label: "Complemento / Referência",
    colSpan: "full",
  },
];

type AddressFormProps = {
  endereco: Endereco;
  onChange: CheckoutFormChangeHandler;
};

export function AddressForm({ endereco, onChange }: AddressFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {ADDRESS_FIELDS.map(field => {
        const inputId = `checkout-address-${field.name}`;
        const spanClass = field.colSpan === "full" ? "sm:col-span-2" : "";

        return (
          <div key={field.name} className={spanClass}>
            <label className="block text-sm font-medium text-gray-700" htmlFor={inputId}>
              {field.label}
            </label>
            <input
              id={inputId}
              name={field.name}
              value={endereco[field.name] ?? ""}
              onChange={event => onChange(`endereco.${event.target.name}`, event.target.value)}
              autoComplete={field.autoComplete}
              inputMode={field.inputMode}
              placeholder={field.placeholder}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 mt-1 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
            />
          </div>
        );
      })}
    </div>
  );
}

export default AddressForm;
