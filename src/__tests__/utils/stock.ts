import { describe, it, expect } from "vitest";
import { parseStockValue, resolveStockValue } from "@/utils/stock";

describe("utils/stock", () => {
  describe("parseStockValue", () => {
    it("retorna número quando entrada já é número válido", () => {
      expect(parseStockValue("1234")).toBe(1234);
      expect(parseStockValue("12.34")).toBe(12.34);
    });

    it('converte string pt-BR "1.234,56" para 1234.56', () => {
      expect(parseStockValue("1.234,56")).toBe(1234.56);
    });

    it('remove símbolos e converte "R$ 2,50" para 2.5', () => {
      expect(parseStockValue("R$ 2,50")).toBe(2.5);
    });

    it("aceita sinal negativo", () => {
      expect(parseStockValue("-10,5")).toBe(-10.5);
    });

    it("retorna null para inválidos", () => {
      expect(parseStockValue("")).toBe(null);
      expect(parseStockValue("   ")).toBe(null);
      expect(parseStockValue("abc")).toBe(null);
      expect(parseStockValue("12,34,56")).toBe(null); // vírgula inválida após normalização
    });
  });

  describe("resolveStockValue", () => {
    it("retorna o número quando input é número válido", () => {
      expect(resolveStockValue(10)).toBe(10);
      expect(resolveStockValue(0)).toBe(0);
      expect(resolveStockValue(-2.5)).toBe(-2.5);
    });

    it("faz parse quando input é string válida", () => {
      expect(resolveStockValue("1.234,56")).toBe(1234.56);
      expect(resolveStockValue("R$ 2,50")).toBe(2.5);
      expect(resolveStockValue("  3,00  ")).toBe(3);
    });

    it("retorna fallback quando input é inválido", () => {
      expect(resolveStockValue(null, 0)).toBe(0);
      expect(resolveStockValue(undefined, 99)).toBe(99);
      expect(resolveStockValue("abc", 7)).toBe(7);
      expect(resolveStockValue(NaN, 5)).toBe(5);
      expect(resolveStockValue(Infinity, 5)).toBe(5);
      expect(resolveStockValue({} as any, 123)).toBe(123);
    });

    it("usa fallback padrão (0) quando não informado", () => {
      expect(resolveStockValue("abc")).toBe(0);
      expect(resolveStockValue(null)).toBe(0);
    });
  });
});
