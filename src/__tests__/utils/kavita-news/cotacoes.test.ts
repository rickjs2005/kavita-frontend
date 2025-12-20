import { describe, it, expect } from "vitest";
import { ALLOWED_SLUGS, formatDateTimeBR, fmtNum } from "@/utils/kavita-news/cotacoes";

describe("utils/kavita-news/cotacoes", () => {
  describe("ALLOWED_SLUGS", () => {
    it("contém slugs esperados", () => {
      expect(ALLOWED_SLUGS).toContain("dolar");
      expect(ALLOWED_SLUGS).toContain("soja");
      expect(ALLOWED_SLUGS).toContain("milho");
      expect(ALLOWED_SLUGS).toContain("boi-gordo");
      expect(ALLOWED_SLUGS).toContain("cafe-arabica-futuro");
    });
  });

  describe("formatDateTimeBR", () => {
    it('retorna "—" quando vazio', () => {
      expect(formatDateTimeBR()).toBe("—");
      expect(formatDateTimeBR(null)).toBe("—");
      expect(formatDateTimeBR("")).toBe("—");
    });

    it("retorna o próprio input se inválido", () => {
      expect(formatDateTimeBR("data-invalida")).toBe("data-invalida");
      expect(formatDateTimeBR("2025-99-99")).toBe("2025-99-99");
    });

    it("formata ISO válida em pt-BR (sem exigir string exata)", () => {
      const out = formatDateTimeBR("2025-01-01T03:00:00.000Z");
      expect(typeof out).toBe("string");
      expect(out).not.toBe("—");
      // geralmente vai conter 01/01/2025 em pt-BR
      expect(out).toContain("01/01/2025");
    });
  });

  describe("fmtNum", () => {
    it('retorna "—" para null/undefined/""', () => {
      expect(fmtNum(null)).toBe("—");
      expect(fmtNum(undefined)).toBe("—");
      expect(fmtNum("")).toBe("—");
    });

    it("formata número com 4 casas por padrão", () => {
      expect(fmtNum(1)).toBe("1.0000");
      expect(fmtNum("2")).toBe("2.0000");
    });

    it("aceita vírgula e troca por ponto", () => {
      expect(fmtNum("10,5")).toBe("10.5000");
    });

    it("permite customizar dígitos", () => {
      expect(fmtNum("10,5", 2)).toBe("10.50");
      expect(fmtNum(3.14159, 3)).toBe("3.142");
    });

    it("se não for finito, retorna string original", () => {
      expect(fmtNum("abc")).toBe("abc");
      expect(fmtNum("Infinity")).toBe("Infinity");
    });
  });
});
