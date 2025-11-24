"use client";

import React from "react";

type MaskType = "cpf" | "telefone" | "email" | "none";

/** Só dígitos */
function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** Máscara CPF: 000.000.000-00 */
function maskCPF(value: string): string {
  let v = onlyDigits(value).slice(0, 11);

  if (v.length <= 3) return v;
  if (v.length <= 6) return v.replace(/(\d{3})(\d+)/, "$1.$2");
  if (v.length <= 9) return v.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");

  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
}

/** Máscara telefone/WhatsApp: (00) 00000-0000 */
function maskTelefone(value: string): string {
  let v = onlyDigits(value).slice(0, 11);

  if (v.length === 0) return "";
  if (v.length <= 2) return `(${v}`;
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

/** Normalização de e-mail (trim + minúsculo) */
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export interface FormattedInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value" | "name"
  > {
  label: string;
  name: string;
  value: string;
  mask?: MaskType;
  helperText?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormattedInput: React.FC<FormattedInputProps> = ({
  label,
  name,
  value,
  mask = "none",
  helperText,
  id,
  onChange,
  ...rest
}) => {
  const inputId = id ?? `field-${name}`;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    let newValue = event.target.value;

    if (mask === "cpf") newValue = maskCPF(newValue);
    else if (mask === "telefone") newValue = maskTelefone(newValue);
    else if (mask === "email") newValue = normalizeEmail(newValue);

    // mantém a API de onChange igual a de um <input> normal
    const syntheticEvent = {
      ...event,
      target: {
        ...event.target,
        name,
        value: newValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-sm font-medium text-gray-700"
        htmlFor={inputId}
      >
        {label}
      </label>

      <input
        id={inputId}
        name={name}
        value={value}
        onChange={handleChange}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition"
        {...rest}
      />

      {helperText && (
        <span className="text-xs text-gray-500">{helperText}</span>
      )}
    </div>
  );
};

export default FormattedInput;
