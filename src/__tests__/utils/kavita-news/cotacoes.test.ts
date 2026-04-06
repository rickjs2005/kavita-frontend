import { describe, it, expect } from "vitest";
import {
  ALLOWED_SLUGS,
  formatDateTimeBR,
  formatDatePtBR,
  fmtNum,
  safeNum,
  formatPrice,
  formatPct,
  hasPrice,
  getMarketEmoji,
  describeTrend,
  convertToLocalUnit,
  simplifySource,
} from "@/utils/kavita-news/cotacoes";

describe("utils/kavita-news/cotacoes", () => {
  describe("ALLOWED_SLUGS", () => {
    it("contém slugs esperados", () => {
      expect(ALLOWED_SLUGS).toContain("dolar");
      expect(ALLOWED_SLUGS).toContain("cafe-arabica");
      expect(ALLOWED_SLUGS).toContain("cafe-robusta");
      expect(ALLOWED_SLUGS).toContain("soja");
      expect(ALLOWED_SLUGS).toContain("milho");
      expect(ALLOWED_SLUGS).toContain("boi-gordo");
    });

    it("não contém slugs fantasma sem provider", () => {
      expect(ALLOWED_SLUGS).not.toContain("boi-gordo-futuro");
      expect(ALLOWED_SLUGS).not.toContain("milho-futuro");
      expect(ALLOWED_SLUGS).not.toContain("soja-futuro");
      expect(ALLOWED_SLUGS).not.toContain("cafe-arabica-futuro");
    });
  });

  describe("safeNum", () => {
    it("retorna null para null/undefined/vazio", () => {
      expect(safeNum(null)).toBeNull();
      expect(safeNum(undefined)).toBeNull();
      expect(safeNum("")).toBeNull();
    });

    it("converte string numérica", () => {
      expect(safeNum("123")).toBe(123);
      expect(safeNum("1.5")).toBe(1.5);
    });

    it("retorna null para não-numérico", () => {
      expect(safeNum("abc")).toBeNull();
      expect(safeNum(NaN)).toBeNull();
    });

    it("converte number diretamente", () => {
      expect(safeNum(0)).toBe(0);
      expect(safeNum(42)).toBe(42);
    });
  });

  describe("formatPrice", () => {
    it('retorna "-" para null/undefined/vazio', () => {
      expect(formatPrice(null)).toBe("-");
      expect(formatPrice(undefined)).toBe("-");
      expect(formatPrice("")).toBe("-");
    });

    it("formata em pt-BR com 2 casas", () => {
      const result = formatPrice(1234.5);
      expect(result).toContain("1.234");
      expect(result).toContain("50");
    });

    it("retorna string original para não-numérico", () => {
      expect(formatPrice("abc")).toBe("abc");
    });
  });

  describe("hasPrice", () => {
    it("retorna false para null/undefined/vazio", () => {
      expect(hasPrice(null)).toBe(false);
      expect(hasPrice(undefined)).toBe(false);
      expect(hasPrice("")).toBe(false);
    });

    it("retorna true para número válido", () => {
      expect(hasPrice(0)).toBe(true);
      expect(hasPrice(123)).toBe(true);
      expect(hasPrice("5.70")).toBe(true);
    });

    it("retorna false para não-numérico", () => {
      expect(hasPrice("abc")).toBe(false);
    });
  });

  describe("formatPct", () => {
    it('retorna "-" para null', () => {
      expect(formatPct(null)).toBe("-");
    });

    it("formata com sinal + para positivo", () => {
      expect(formatPct(2.5)).toBe("+2.50%");
    });

    it("formata negativo sem +", () => {
      expect(formatPct(-1.3)).toBe("-1.30%");
    });

    it("formata zero sem sinal", () => {
      expect(formatPct(0)).toBe("0.00%");
    });
  });

  describe("formatDatePtBR", () => {
    it('retorna "—" quando vazio', () => {
      expect(formatDatePtBR()).toBe("—");
      expect(formatDatePtBR(null)).toBe("—");
      expect(formatDatePtBR("")).toBe("—");
    });

    it("retorna o próprio input se data inválida", () => {
      expect(formatDatePtBR("data-invalida")).toBe("data-invalida");
    });

    it("formata ISO válida em pt-BR", () => {
      const out = formatDatePtBR("2025-01-01T03:00:00.000Z");
      expect(typeof out).toBe("string");
      expect(out).not.toBe("—");
      expect(out).toContain("01/01/2025");
    });

    it("aceita timeDetail medium", () => {
      const out = formatDatePtBR("2025-06-15T14:30:45.000Z", "medium");
      expect(typeof out).toBe("string");
      expect(out).not.toBe("—");
    });
  });

  describe("formatDateTimeBR (deprecated alias)", () => {
    it('retorna "—" quando vazio', () => {
      expect(formatDateTimeBR()).toBe("—");
      expect(formatDateTimeBR(null)).toBe("—");
    });

    it("formata ISO válida", () => {
      const out = formatDateTimeBR("2025-01-01T03:00:00.000Z");
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
    });
  });

  describe("getMarketEmoji", () => {
    it("retorna emoji correto por slug", () => {
      expect(getMarketEmoji({ slug: "cafe-arabica" })).toBe("☕");
      expect(getMarketEmoji({ slug: "soja" })).toBe("🫘");
      expect(getMarketEmoji({ slug: "milho" })).toBe("🌽");
      expect(getMarketEmoji({ slug: "boi-gordo" })).toBe("🐂");
      expect(getMarketEmoji({ slug: "dolar" })).toBe("💵");
    });

    it("retorna emoji padrão para desconhecido", () => {
      expect(getMarketEmoji({ slug: "xyz" })).toBe("🏷");
    });

    it("funciona com name em vez de slug", () => {
      expect(getMarketEmoji({ name: "Café Robusta" })).toBe("☕");
    });
  });

  describe("describeTrend", () => {
    it("retorna frase para alta expressiva", () => {
      expect(describeTrend(5)).toBe("Alta expressiva no dia");
    });

    it("retorna frase para alta moderada", () => {
      expect(describeTrend(2)).toBe("Alta moderada no dia");
    });

    it("retorna frase para leve alta", () => {
      expect(describeTrend(0.5)).toBe("Leve alta no dia");
    });

    it("retorna estável para variação próxima de zero", () => {
      expect(describeTrend(0)).toBe("Estável no dia");
      expect(describeTrend(0.1)).toBe("Estável no dia");
      expect(describeTrend(-0.2)).toBe("Estável no dia");
    });

    it("retorna frase para queda", () => {
      expect(describeTrend(-0.5)).toBe("Leve queda no dia");
      expect(describeTrend(-2)).toBe("Queda moderada no dia");
      expect(describeTrend(-5)).toBe("Queda expressiva no dia");
    });

    it("retorna mensagem para null", () => {
      expect(describeTrend(null)).toBe("Sem variação disponível");
    });
  });

  describe("convertToLocalUnit", () => {
    it("converte café arábica R$/lb para R$/saca", () => {
      const result = convertToLocalUnit(14.25, "cafe-arabica");
      expect(result).not.toBeNull();
      expect(result!.label).toBe("saca 60kg");
      // 14.25 * 132.277 ≈ 1884.95
      expect(result!.value).toBeGreaterThan(1800);
      expect(result!.value).toBeLessThan(1950);
    });

    it("converte soja R$/bu para R$/saca", () => {
      const result = convertToLocalUnit(59.85, "soja");
      expect(result).not.toBeNull();
      expect(result!.label).toBe("saca 60kg");
      // 59.85 * 2.2046 ≈ 131.95
      expect(result!.value).toBeGreaterThan(125);
      expect(result!.value).toBeLessThan(140);
    });

    it("converte boi gordo R$/cwt para R$/@", () => {
      const result = convertToLocalUnit(1083, "boi-gordo");
      expect(result).not.toBeNull();
      expect(result!.label).toBe("@");
      // 1083 / 3.024 ≈ 358.13
      expect(result!.value).toBeGreaterThan(350);
      expect(result!.value).toBeLessThan(370);
    });

    it("retorna null para dolar (sem conversão local)", () => {
      expect(convertToLocalUnit(5.70, "dolar")).toBeNull();
    });

    it("retorna null para slug desconhecido", () => {
      expect(convertToLocalUnit(100, "xyz")).toBeNull();
    });
  });

  describe("simplifySource", () => {
    it("retorna fonte simplificada por slug", () => {
      expect(simplifySource("cafe-arabica")).toBe("ICE/Nova York");
      expect(simplifySource("soja")).toBe("CME/Chicago");
      expect(simplifySource("dolar")).toBe("BCB");
    });

    it("retorna fonte raw como fallback", () => {
      expect(simplifySource("xyz", "Stooq raw")).toBe("Stooq raw");
    });

    it("retorna - quando sem dados", () => {
      expect(simplifySource(null, null)).toBe("-");
    });
  });
});
