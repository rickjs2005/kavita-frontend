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
    placeholder: "voce@gmail.com",
  },
  {
    // continua usando o campo "telefone" para o backend,
    // mas no rótulo mostramos WhatsApp
    name: "telefone",
    label: "WhatsApp",
    type: "tel",
    autoComplete: "tel",
    placeholder: "(00) 00000-0000",
  },
];

type PersonalInfoFormProps = {
  formData: CheckoutFormData;
  onChange: CheckoutFormChangeHandler;
};

/** Aplica máscara no CPF: 000.000.000-00 */
const maskCPF = (value: string): string => {
  let v = value.replace(/\D/g, "").slice(0, 11);

  if (v.length <= 3) return v;
  if (v.length <= 6) return v.replace(/(\d{3})(\d+)/, "$1.$2");
  if (v.length <= 9) return v.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");

  return v.replace(
    /(\d{3})(\d{3})(\d{3})(\d{1,2})/,
    "$1.$2.$3-$4"
  );
};

/** Aplica máscara no WhatsApp: (00) 00000-0000 */
const maskWhatsApp = (value: string): string => {
  let v = value.replace(/\D/g, "").slice(0, 11);

  if (v.length === 0) return "";
  if (v.length <= 2) return `(${v}`;
  if (v.length <= 7)
    return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
};

export function PersonalInfoForm({ formData, onChange }: PersonalInfoFormProps) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const { name } = event.target;
    let { value } = event.target;

    if (name === "cpf") {
      value = maskCPF(value);
    } else if (name === "telefone") {
      value = maskWhatsApp(value);
    }

    // Criamos um "evento" com o valor já mascarado
    const maskedEvent = {
      ...event,
      target: {
        ...event.target,
        name,
        value,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(maskedEvent);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {PERSONAL_FIELDS.map((field) => {
        const inputId = `checkout-${field.name}`;
        const value =
          field.name === "telefone"
            ? formData.telefone ?? ""
            : formData[field.name] ?? "";

        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor={inputId}
            >
              {field.label}
            </label>
            <input
              id={inputId}
              name={field.name}
              value={value}
              onChange={handleChange}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
              aria-describedby={
                field.placeholder ? `${inputId}-hint` : undefined
              }
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
