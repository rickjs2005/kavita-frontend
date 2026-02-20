// src/__tests__/utils/kavita-news/clima.test.ts
import { describe, it, expect } from "vitest";

import {
  normalizeSlug,
  toNumberOrNull,
  formatDateTimeBR,
  parseIbgeId,
  parseStationCode,
} from "../../../utils/kavita-news/clima";

describe("utils/kavita-news/clima", () => {
  describe("normalizeSlug", () => {
    it("gera slug básico (trim, lower, espaços -> hífen)", () => {
      expect(normalizeSlug("  Minha Cidade Legal  ")).toBe("minha-cidade-legal");
    });

    it("remove caracteres inválidos e colapsa hífens", () => {
      expect(normalizeSlug("A--B  C___D!!")).toBe("a-b-cd");
    });

    it("remove hífens no começo e no fim", () => {
      expect(normalizeSlug("-Teste-")).toBe("teste");
      expect(normalizeSlug("----teste----")).toBe("teste");
    });

    it("lida com string vazia", () => {
      expect(normalizeSlug("")).toBe("");
      // @ts-expect-error teste defensivo: função não aceita null no tipo
      expect(normalizeSlug(null)).toBe("");
      // @ts-expect-error teste defensivo: função não aceita undefined no tipo
      expect(normalizeSlug(undefined)).toBe("");
    });

    it("remove acentos por efeito da regex (não translitera)", () => {
      expect(normalizeSlug("Café com Leite")).toBe("caf-com-leite");
    });
  });

  describe("toNumberOrNull", () => {
    it("converte número simples", () => {
      expect(toNumberOrNull("10")).toBe(10);
      expect(toNumberOrNull("  10  ")).toBe(10);
    });

    it("converte decimal com vírgula", () => {
      expect(toNumberOrNull("10,5")).toBe(10.5);
      expect(toNumberOrNull("  0,25 ")).toBe(0.25);
    });

    it("retorna null para vazio e inválido", () => {
      expect(toNumberOrNull("")).toBeNull();
      expect(toNumberOrNull("   ")).toBeNull();
      expect(toNumberOrNull("abc")).toBeNull();
      expect(toNumberOrNull("10,5,2")).toBeNull();
    });

    it("não aceita Infinity/NaN", () => {
      expect(toNumberOrNull("Infinity")).toBeNull();
      expect(toNumberOrNull("NaN")).toBeNull();
    });

    it("lida com null/undefined defensivamente", () => {
      // @ts-expect-error teste defensivo: função tipada para string
      expect(toNumberOrNull(null)).toBeNull();
      // @ts-expect-error teste defensivo: função tipada para string
      expect(toNumberOrNull(undefined)).toBeNull();
    });
  });

  describe("formatDateTimeBR", () => {
    it('retorna "—" quando não há iso', () => {
      expect(formatDateTimeBR()).toBe("—");
      expect(formatDateTimeBR(null)).toBe("—");
      expect(formatDateTimeBR("")).toBe("—");
    });

    it("retorna o próprio input se a data for inválida", () => {
      expect(formatDateTimeBR("data-invalida")).toBe("data-invalida");
      expect(formatDateTimeBR("2025-99-99")).toBe("2025-99-99");
    });

    it("formata ISO válida (pt-BR / America/Sao_Paulo)", () => {
      const out = formatDateTimeBR("2025-01-01T03:00:00.000Z");
      expect(out).toContain("01/01/2025");
      expect(out).toMatch(/\b00:00\b/);
    });
  });

  describe("parseIbgeId", () => {
    it("retorna number para inteiro positivo", () => {
      expect(parseIbgeId("1")).toBe(1);
      expect(parseIbgeId("  3304557 ")).toBe(3304557);
    });

    it("retorna null para vazio, não-numérico e zero/negativo", () => {
      expect(parseIbgeId("")).toBeNull();
      expect(parseIbgeId("   ")).toBeNull();
      expect(parseIbgeId("abc")).toBeNull();
      expect(parseIbgeId("12a")).toBeNull();
      expect(parseIbgeId("0")).toBeNull();
      expect(parseIbgeId("-1")).toBeNull();
    });

    it("lida com null/undefined defensivamente", () => {
      // @ts-expect-error teste defensivo: função tipada para string
      expect(parseIbgeId(null)).toBeNull();
      // @ts-expect-error teste defensivo: função tipada para string
      expect(parseIbgeId(undefined)).toBeNull();
    });
  });

  describe("parseStationCode", () => {
    it("normaliza para uppercase e valida padrão A999", () => {
      expect(parseStationCode("a827")).toBe("A827");
      expect(parseStationCode(" B123 ")).toBe("B123");
    });

    it("retorna null para vazio ou padrão inválido", () => {
      expect(parseStationCode("")).toBeNull();
      expect(parseStationCode("   ")).toBeNull();
      expect(parseStationCode("AA27")).toBeNull();
      expect(parseStationCode("A82")).toBeNull();
      expect(parseStationCode("A8277")).toBeNull();
      expect(parseStationCode("1827")).toBeNull();
      expect(parseStationCode("A8B7")).toBeNull();
    });

    it("lida com null/undefined defensivamente", () => {
      // @ts-expect-error teste defensivo: função tipada para string
      expect(parseStationCode(null)).toBeNull();
      // @ts-expect-error teste defensivo: função tipada para string
      expect(parseStationCode(undefined)).toBeNull();
    });
  });
});