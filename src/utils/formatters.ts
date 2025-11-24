// src/utils/formatters.ts

/** Remove tudo que não for número */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** CPF: 000.000.000-00 */
export function formatCpfMask(value: string): string {
  let digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;

  if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d{0,3})/, "$1.$2");
  }

  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
  }

  return digits.replace(
    /(\d{3})(\d{3})(\d{3})(\d{0,2})/,
    "$1.$2.$3-$4"
  );
}

/** Telefone/WhatsApp: (00) 00000-0000 */
export function formatTelefoneMask(value: string): string {
  let digits = onlyDigits(value).slice(0, 11);

  if (!digits) return "";

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Email: tira espaços e deixa tudo minúsculo */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
