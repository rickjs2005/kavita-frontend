import { describe, it, expect } from "vitest";
import {
  clamp,
  parseIntList,
  toNum,
  toNumberParam,
  buildQueryString,
} from "@/utils/search";

describe("utils/search", () => {
  describe("clamp", () => {
    it("mantém o número dentro do intervalo", () => {
      // Arrange
      const min = 1;
      const max = 10;

      // Act
      const a = clamp(5, min, max);
      const b = clamp(0, min, max);
      const c = clamp(99, min, max);

      // Assert
      expect(a).toBe(5);
      expect(b).toBe(1);
      expect(c).toBe(10);
    });
  });

  describe("parseIntList", () => {
    it('parseia "1,2,3" em [1,2,3]', () => {
      // Act
      const result = parseIntList("1,2,3");

      // Assert
      expect(result).toEqual([1, 2, 3]);
    });

    it("ignora valores inválidos, zero e negativos", () => {
      // Arrange
      const csv = "1, 0, -2, abc, 10, 3.5, 7";

      // Act
      const result = parseIntList(csv);

      // Assert
      // 3.5 vira 3 via parseInt, abc some, 0 e negativos somem
      expect(result).toEqual([1, 10, 3, 7]);
    });

    it("retorna [] para null/empty", () => {
      expect(parseIntList(null)).toEqual([]);
      expect(parseIntList("")).toEqual([]);
    });
  });

  describe("toNum", () => {
    it("retorna number quando entrada já é number finito", () => {
      expect(toNum(10)).toBe(10);
      expect(toNum(10.5)).toBe(10.5);
    });

    it('converte string decimal com vírgula "12,34" -> 12.34', () => {
      const result = toNum("12,34");
      expect(result).toBeCloseTo(12.34, 2);
    });

    it("converte string com ponto e espaços", () => {
      const result = toNum("  99.9 ");
      expect(result).toBeCloseTo(99.9, 2);
    });

    it("retorna null para inválidos", () => {
      expect(toNum(null)).toBeNull();
      expect(toNum(undefined)).toBeNull();
      expect(toNum(NaN)).toBeNull();
      expect(toNum("abc")).toBeNull();
      expect(toNum({})).toBeNull();
    });
  });

  describe("toNumberParam", () => {
    it("retorna null para param vazio", () => {
      expect(toNumberParam(null)).toBeNull();
      expect(toNumberParam("")).toBeNull();
    });

    it("converte string numérica em number", () => {
      expect(toNumberParam("10")).toBe(10);
      expect(toNumberParam("10.5")).toBe(10.5);
    });

    it("retorna null para NaN", () => {
      expect(toNumberParam("abc")).toBeNull();
    });
  });

  describe("buildQueryString", () => {
    it("inclui q, page e limit (defaults) quando fornecido", () => {
      // Arrange
      const qs = buildQueryString({ q: "milho" });

      // Assert
      expect(qs).toContain("q=milho");
      expect(qs).toContain("page=1");
      expect(qs).toContain("limit=12");
    });

    it("inclui categories e compat (category/category_id) quando houver 1 categoria", () => {
      // Arrange
      const qs = buildQueryString({ categories: [7] });

      // Assert
      expect(qs).toContain("categories=7");
      expect(qs).toContain("category=7");
      expect(qs).toContain("category_id=7");
    });

    it("quando houver múltiplas categorias, não adiciona compat category/category_id", () => {
      // Arrange
      const qs = buildQueryString({ categories: [1, 2] });

      // Assert
      expect(qs).toContain("categories=1%2C2"); // URLSearchParams codifica a vírgula
      expect(qs).not.toContain("category=");
      expect(qs).not.toContain("category_id=");
    });

    it("inclui minPrice/maxPrice apenas se forem numbers", () => {
      // Arrange
      const qs1 = buildQueryString({ minPrice: 10, maxPrice: 99 });
      const qs2 = buildQueryString({ minPrice: null, maxPrice: null });

      // Assert
      expect(qs1).toContain("minPrice=10");
      expect(qs1).toContain("maxPrice=99");
      expect(qs2).not.toContain("minPrice=");
      expect(qs2).not.toContain("maxPrice=");
    });

    it("inclui promo e sort quando fornecidos", () => {
      // Arrange
      const qs = buildQueryString({ promo: true, sort: "price_asc", page: 2, limit: 24 });

      // Assert
      expect(qs).toContain("promo=true");
      expect(qs).toContain("sort=price_asc");
      expect(qs).toContain("page=2");
      expect(qs).toContain("limit=24");
    });
  });
});
