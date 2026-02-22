// src/utils/formatters.ts

/* =========================================================
 *  NÚMEROS / MOEDA / PORCENTAGEM
 * ======================================================= */

type NumericInput = number | string | null | undefined;

/** Converte valor para número seguro (tratando string, null, etc.) */
export function toNumber(value: NumericInput): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number" && !isNaN(value)) return value;

  if (typeof value === "string") {
    // tenta converter "1.234,56" -> 1234.56
    const normalized = value
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.-]/g, "");

    const parsed = Number(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

/** Formata número em moeda BRL (R$ 0,00) */
export function formatCurrency(value: NumericInput): string {
  const num = toNumber(value);

  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/** Formata número como porcentagem (ex: 12.3 -> "12,3%") */
export function formatPercent(value: NumericInput, decimals: number = 1): string {
  const num = toNumber(value);
  return `${num.toFixed(decimals).replace(".", ",")}%`;
}

/* =========================================================
 *  DATAS / HORÁRIOS
 * ======================================================= */

export type DateInput = string | number | Date | null | undefined;

/** Converte qualquer input para Date (ou null se inválido) */
export function toDate(value: DateInput): Date | null {
  if (!value && value !== 0) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  const dt = new Date(value);
  return isNaN(dt.getTime()) ? null : dt;
}

/** Formata data genérica com opções do Intl.DateTimeFormat */
export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }
): string {
  const dt = toDate(value);
  if (!dt) return "";

  return dt.toLocaleDateString("pt-BR", options);
}

/** Data curta: 21/11 */
export function formatDateShort(value: DateInput): string {
  return formatDate(value, {
    day: "2-digit",
    month: "2-digit",
  });
}

/** Data completa: 21/11/2025 */
export function formatDateWithYear(value: DateInput): string {
  return formatDate(value, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Data com ano curto: 21/11/25 */
export function formatDateShortYear(value: DateInput): string {
  return formatDate(value, {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

/** Data + hora: 21/11/2025 14:35 */
export function formatDateTime(value: DateInput): string {
  const dt = toDate(value);
  if (!dt) return "";

  const date = dt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const time = dt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} ${time}`;
}

/* === Aliases usados em algumas páginas (admin) === */
// pode continuar usando esses nomes sem quebrar
export const formatShortDate = formatDateShort;
export const formatFullDate = formatDateWithYear;
export const formatFullDateShortYear = formatDateShortYear;

/* =========================================================
 *  DOCUMENTOS / MASKS (CPF, CNPJ, CEP, TELEFONE)
 * ======================================================= */

/** Remove tudo que não for número */
export function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/** CPF: 000.000.000-00 */
export function formatCpfMask(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;

  if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d{0,3})/, "$1.$2");
  }

  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, "$1.$2.$3-$4");
}

/** CNPJ: 00.000.000/0000-00 */
export function formatCnpjMask(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) {
    return digits.replace(/(\d{2})(\d{0,3})/, "$1.$2");
  }
  if (digits.length <= 8) {
    return digits.replace(/(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
  }
  if (digits.length <= 12) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
  }

  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2}).*/,
    "$1.$2.$3/$4-$5"
  );
}

/** CEP: 00000-000 */
export function formatCepMask(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 5) {
    return digits;
  }

  return digits.replace(/(\d{5})(\d{0,3}).*/, "$1-$2");
}

/** Telefone BR: (00) 00000-0000 ou (00) 0000-0000 */
export function formatPhoneMask(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);

  if (!digits) return "";

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    // fixo: (00) 0000-0000
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  // celular: (00) 00000-0000
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/* =========================================================
 *  CONTATO / TEXTO
 * ======================================================= */

/** Email: tira espaços e deixa tudo minúsculo */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Nome próprio: deixa cada palavra capitalizada */
export function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) =>
      word.length === 0
        ? ""
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}
