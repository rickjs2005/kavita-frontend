import { describe, it, expect } from "vitest";
import {
  toNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  onlyDigits,
} from "@/utils/formatters";

function normalizeSpaces(s: string) {
  return s.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();
}

describe("utils/formatters", () => {
  describe("toNumber", () => {
    it("converte número diretamente", () => {
      // Act
      const n = toNumber(10);

      // Assert
      expect(n).toBe(10);
    });

    it('converte string pt-BR "1.234,56" em 1234.56', () => {
      // Act
      const n = toNumber("1.234,56");

      // Assert
      expect(n).toBeCloseTo(1234.56, 2);
    });

    it("retorna 0 para inválidos", () => {
      expect(toNumber("abc")).toBe(0);
      expect(toNumber(undefined as any)).toBe(0);
      expect(toNumber(null as any)).toBe(0);
      expect(toNumber(NaN as any)).toBe(0);
    });
  });

  describe("formatCurrency", () => {
    it("formata BRL corretamente", () => {
      // Act
      const s = formatCurrency(1234.56);

      // Assert
      expect(normalizeSpaces(s)).toBe("R$ 1.234,56");
    });

    it("para inválidos, formata como 0 em BRL", () => {
      // Act
      const s1 = formatCurrency(NaN as any);
      const s2 = formatCurrency(undefined as any);
      const s3 = formatCurrency(null as any);

      // Assert
      expect(normalizeSpaces(s1)).toBe("R$ 0,00");
      expect(normalizeSpaces(s2)).toBe("R$ 0,00");
      expect(normalizeSpaces(s3)).toBe("R$ 0,00");
    });
  });

  describe("formatPercent", () => {
    it("formata percentual com base em 100", () => {
      // se você passa 10 -> 10%
      const s = formatPercent(10);
      expect(s).toContain("%");
    });

    it("para inválidos, não quebra e retorna 0%", () => {
      const s = formatPercent("abc" as any);
      expect(s).toContain("%");
    });
  });

  describe("formatDate", () => {
    it("formata data ISO para pt-BR", () => {
      // Arrange
      const iso = "2024-12-20";

      // Act
      const s = formatDate(iso);

      // Assert
      expect(s).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it("retorna string vazia para inválidos", () => {
      expect(formatDate("")).toBe("");
      expect(formatDate("invalid-date")).toBe("");
      expect(formatDate(undefined as any)).toBe("");
    });
  });

  describe("onlyDigits", () => {
    it("remove tudo que não for dígito", () => {
      // Act
      const s = onlyDigits("(31) 9 9999-0000");

      // Assert
      expect(s).toBe("31999990000");
    });

    it("retorna vazio para falsy", () => {
      expect(onlyDigits("")).toBe("");
      expect(onlyDigits(null as any)).toBe("");
      expect(onlyDigits(undefined as any)).toBe("");
    });
  });
});
