import { CheckoutFormChangeHandler, CheckoutFormData } from "@/hooks/useCheckoutForm";

type PersonalFieldName = "nome" | "cpf" | "email" | "telefone";

const PERSONAL_FIELDS: Array<{
  name: PersonalFieldName;
  label: string;
  type: "text" | "email" | "tel";
  autoComplete?: string;
  placeholder?: string;
}> = [
  {
    name: "nome",
    label: "Nome completo",
    type: "text",
    autoComplete: "name",
    placeholder: "Digite seu nome",
  },
  {
    name: "cpf",
    label: "CPF",
    type: "text",
    autoComplete: "off",
    placeholder: "000.000.000-00",
  },
  {
    name: "email",
    label: "E-mail",
    type: "email",
    autoComplete: "email",
    placeholder: "voce@empresa.com",
  },
  {
    name: "telefone",
    label: "Telefone",
    type: "tel",
    autoComplete: "tel",
    placeholder: "(00) 00000-0000",
  },
];

type PersonalInfoFormProps = {
  formData: CheckoutFormData;
  onChange: CheckoutFormChangeHandler;
};

export function PersonalInfoForm({ formData, onChange }: PersonalInfoFormProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {PERSONAL_FIELDS.map(field => {
        const inputId = `checkout-${field.name}`;
        const value =
          field.name === "telefone"
            ? formData.telefone ?? ""
            : formData[field.name] ?? "";

        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700" htmlFor={inputId}>
              {field.label}
            </label>
            <input
              id={inputId}
              name={field.name}
              value={value}
              onChange={onChange}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
              aria-describedby={field.placeholder ? `${inputId}-hint` : undefined}
              required={field.name !== "telefone"}
            />
            {field.placeholder && (
              <span id={`${inputId}-hint`} className="text-xs text-gray-500">
                {field.placeholder}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PersonalInfoForm;
