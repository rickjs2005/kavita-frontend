"use client";

import React from "react";

type MaskType = "cpf" | "cnpj" | "telefone" | "email" | "none";
type Variant = "light" | "dark";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** CPF: 000.000.000-00 */
function maskCPF(value: string): string {
  let v = onlyDigits(value).slice(0, 11);

  if (v.length <= 3) return v;
  if (v.length <= 6) return v.replace(/(\d{3})(\d+)/, "$1.$2");
  if (v.length <= 9) return v.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");

  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
}

/** CNPJ: 00.000.000/0000-00 */
function maskCNPJ(value: string): string {
  let v = onlyDigits(value).slice(0, 14);

  if (v.length <= 2) return v;
  if (v.length <= 5) return v.replace(/(\d{2})(\d+)/, "$1.$2");
  if (v.length <= 8) return v.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
  if (v.length <= 12)
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");

  return v.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/,
    "$1.$2.$3/$4-$5"
  );
}

/** Telefone/WhatsApp: (00) 00000-0000 */
function maskTelefone(value: string): string {
  let v = onlyDigits(value).slice(0, 11);

  if (v.length === 0) return "";
  if (v.length <= 2) return `(${v}`;
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

/** E-mail em minúsculo */
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
  variant?: Variant;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormattedInput: React.FC<FormattedInputProps> = ({
  label,
  name,
  value,
  mask = "none",
  helperText,
  id,
  variant = "light",
  onChange,
  ...rest
}) => {
  const inputId = id ?? `field-${name}`;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    let newValue = event.target.value;

    if (mask === "cpf") newValue = maskCPF(newValue);
    else if (mask === "cnpj") newValue = maskCNPJ(newValue);
    else if (mask === "telefone") newValue = maskTelefone(newValue);
    else if (mask === "email") newValue = normalizeEmail(newValue);

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

  const labelClass =
    variant === "dark"
      ? "text-xs font-medium text-slate-200"
      : "text-sm font-medium text-gray-700";

  const inputClass =
    variant === "dark"
      ? "w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2.5 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      : "w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 border border-gray-300 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#EC5B20] transition";

  const helperClass =
    variant === "dark" ? "text-[11px] text-slate-500" : "text-xs text-gray-500";

  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelClass} htmlFor={inputId}>
        {label}
      </label>

      <input
        id={inputId}
        name={name}
        value={value}
        onChange={handleChange}
        className={inputClass}
        {...rest}
      />

      {helperText && <span className={helperClass}>{helperText}</span>}
    </div>
  );
};

export default FormattedInput;
