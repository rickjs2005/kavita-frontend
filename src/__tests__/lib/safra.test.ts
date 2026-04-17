import { describe, it, expect } from "vitest";
import { getSafraTipoForDate } from "@/lib/safra";

// Uso o constructor Date(year, month-0-indexed, day, hour) em vez de
// ISO strings porque getMonth() lê a data no fuso local do runtime;
// ISO "2026-05-01" é interpretado em UTC e pula para 30-04 em fuso
// brasileiro, tornando o teste frágil ao ambiente.
function local(year: number, monthOneIndexed: number, day: number): Date {
  return new Date(year, monthOneIndexed - 1, day, 12, 0, 0);
}

describe("lib/safra", () => {
  describe("getSafraTipoForDate", () => {
    it("retorna 'atual' em maio (início da safra)", () => {
      expect(getSafraTipoForDate(local(2026, 5, 15))).toBe("atual");
    });

    it("retorna 'atual' em junho/julho/agosto (pico)", () => {
      expect(getSafraTipoForDate(local(2026, 6, 20))).toBe("atual");
      expect(getSafraTipoForDate(local(2026, 7, 10))).toBe("atual");
      expect(getSafraTipoForDate(local(2026, 8, 5))).toBe("atual");
    });

    it("retorna 'atual' em setembro (fim da safra)", () => {
      expect(getSafraTipoForDate(local(2026, 9, 28))).toBe("atual");
    });

    it("retorna 'remanescente' em outubro (entressafra)", () => {
      expect(getSafraTipoForDate(local(2026, 10, 1))).toBe("remanescente");
    });

    it("retorna 'remanescente' de novembro a abril", () => {
      expect(getSafraTipoForDate(local(2026, 11, 10))).toBe("remanescente");
      expect(getSafraTipoForDate(local(2026, 1, 15))).toBe("remanescente");
      expect(getSafraTipoForDate(local(2026, 3, 20))).toBe("remanescente");
      expect(getSafraTipoForDate(local(2026, 4, 30))).toBe("remanescente");
    });

    it("é estável no primeiro dia da janela (1 de maio)", () => {
      expect(getSafraTipoForDate(local(2026, 5, 1))).toBe("atual");
    });

    it("é estável no último dia da janela (30 de setembro)", () => {
      expect(getSafraTipoForDate(local(2026, 9, 30))).toBe("atual");
    });
  });
});
