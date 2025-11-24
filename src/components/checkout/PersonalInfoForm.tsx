import { CheckoutFormChangeHandler, CheckoutFormData } from "@/hooks/useCheckoutForm";
import FormattedInput from "@/components/layout/FormattedInput";

type PersonalFieldName = "nome" | "cpf" | "email" | "telefone";

const PERSONAL_FIELDS: Array<{
  name: PersonalFieldName;
  label: string;
  type: "text" | "email" | "tel";
  autoComplete?: string;
  placeholder?: string;
  mask?: "cpf" | "telefone" | "email" | "none";
  optional?: boolean;
}> = [
  {
    name: "nome",
    label: "Nome completo",
    type: "text",
    autoComplete: "name",
    placeholder: "Digite seu nome",
    mask: "none",
  },
  {
    name: "cpf",
    label: "CPF",
    type: "text",
    autoComplete: "off",
    placeholder: "000.000.000-00",
    mask: "cpf",
  },
  {
    name: "email",
    label: "E-mail",
    type: "email",
    autoComplete: "email",
    placeholder: "voce@gmail.com",
    mask: "email",
  },
  {
    // continua usando o campo "telefone" para o backend,
    // mas no rótulo mostramos WhatsApp
    name: "telefone",
    label: "WhatsApp",
    type: "tel",
    autoComplete: "tel",
    placeholder: "(00) 00000-0000",
    mask: "telefone",
    optional: true,
  },
];

type PersonalInfoFormProps = {
  formData: CheckoutFormData;
  onChange: CheckoutFormChangeHandler;
};

export function PersonalInfoForm({ formData, onChange }: PersonalInfoFormProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      {PERSONAL_FIELDS.map((field) => {
        const value =
          (formData as any)[field.name] !== undefined
            ? (formData as any)[field.name]
            : "";

        return (
          <FormattedInput
            key={field.name}
            label={field.label}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            placeholder={field.placeholder}
            value={value ?? ""}
            onChange={onChange}
            mask={field.mask}
            helperText={field.placeholder}
            required={!field.optional}
          />
        );
      })}
    </div>
  );
}

export default PersonalInfoForm;
