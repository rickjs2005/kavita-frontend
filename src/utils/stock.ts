// src/utils/stock.ts

/**
 * Remove caracteres inválidos de uma string de estoque
 * e normaliza vírgula como separador decimal.
 *
 * Exemplos:
 *  - "10"           -> "10"
 *  - "10,5"         -> "10.5"
 *  - " R$ 1.250,50" -> "1250.50"
 *  - "--" ou ""     -> ""
 */
const sanitizeStockString = (value: string): string => {
  // remove tudo que não for dígito, vírgula ou sinal de menos
  const cleaned = value.replace(/[^\d,-]/g, "").trim();

  if (!cleaned) return "";

  // troca a vírgula por ponto para virar número JS
  return cleaned.replace(",", ".");
};

/**
 * Tenta converter um valor qualquer (number ou string)
 * para um número de estoque. Se não for possível, retorna null.
 */
export function parseStockValue(value: unknown): number | null {
  // já é um número válido
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  // trata strings
  if (typeof value === "string") {
    const sanitized = sanitizeStockString(value);

    if (!sanitized) {
      return null;
    }

    const parsed = Number(sanitized);

    return Number.isFinite(parsed) ? parsed : null;
  }

  // outros tipos (boolean, objeto, undefined, null, etc.)
  return null;
}

/**
 * Recebe vários valores de estoque em potencial (string/number/etc)
 * e devolve o primeiro que conseguir converter para número.
 *
 * Útil quando você tem várias fontes, por exemplo:
 * resolveStockValue(prod.estoque, prod.qtd, "10,5")
 */
export function resolveStockValue(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = parseStockValue(value);

    if (typeof parsed === "number") {
      return parsed;
    }
  }

  return null;
}
