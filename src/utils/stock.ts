const sanitizeStockString = (value: string): string => {
  return value.replace(/[^\d,-]/g, "").replace(",", ".");
};

export function parseStockValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const sanitized = sanitizeStockString(value);
    if (!sanitized) {
      return null;
    }
    const parsed = Number(sanitized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function resolveStockValue(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = parseStockValue(value);
    if (typeof parsed === "number") {
      return parsed;
    }
  }
  return null;
}
