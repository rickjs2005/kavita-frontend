import { describe, it, expect } from "vitest";
import { parseStockValue, resolveStockValue } from "@/utils/stock";

describe("utils/stock", () => {
  describe("parseStockValue", () => {
    it("retorna o número quando já é number finito", () => {
      expect(parseStockValue(10)).toBe(10);
      expect(parseStockValue(10.5)).toBe(10.5);
    });

    it('converte string "10,5" para 10.5', () => {
      const result = parseStockValue("10,5");
      expect(result).toBeCloseTo(10.5, 2);
    });

    it('remove caracteres inválidos e converte " R$ 1.250,50 " para 1250.5', () => {
      const result = parseStockValue(" R$ 1.250,50 ");
      expect(result).toBeCloseTo(1250.5, 2);
    });

    it("aceita número negativo em string", () => {
      expect(parseStockValue("-10")).toBe(-10);
    });

    it("retorna null para vazios e inválidos", () => {
      expect(parseStockValue("")).toBeNull();
      expect(parseStockValue("   ")).toBeNull();
      expect(parseStockValue("--")).toBeNull();
      expect(parseStockValue("abc")).toBeNull();
      expect(parseStockValue(null)).toBeNull();
      expect(parseStockValue(undefined)).toBeNull();
      expect(parseStockValue(NaN)).toBeNull();
      expect(parseStockValue({})).toBeNull();
    });

    it("retorna null para string com formato impossível", () => {
      // exemplo com várias vírgulas vira algo não numérico depois do replace parcial
      expect(parseStockValue("1,2,3")).toBeNull();
    });
  });

  describe("resolveStockValue", () => {
    it("retorna o primeiro valor parseável (prioridade por ordem)", () => {
      const result = resolveStockValue(null, "--", "10,5", 99);
      // deve parar em "10,5" (primeiro parseável)
      expect(result).toBeCloseTo(10.5, 2);
    });

    it("retorna number imediatamente se vier number válido antes", () => {
      const result = resolveStockValue("--", 7, "10,5");
      expect(result).toBe(7);
    });

    it("retorna null se nada for parseável", () => {
      const result = resolveStockValue(null, undefined, "--", "abc", "");
      expect(result).toBeNull();
    });
  });
});
