import { describe, it, expect } from "vitest";
import { ESTADOS_BR } from "@/utils/brasil";

describe("utils/brasil", () => {
  it("tem a lista completa (27 UFs) e estrutura válida", () => {
    // Arrange / Act
    const ufs = ESTADOS_BR;

    // Assert
    expect(Array.isArray(ufs)).toBe(true);
    expect(ufs).toHaveLength(27);

    for (const item of ufs) {
      expect(item).toHaveProperty("sigla");
      expect(item).toHaveProperty("nome");

      expect(typeof item.sigla).toBe("string");
      expect(typeof item.nome).toBe("string");

      expect(item.sigla).toMatch(/^[A-Z]{2}$/); // 2 letras, maiúsculo
      expect(item.nome.length).toBeGreaterThan(0);
    }
  });

  it("não tem siglas duplicadas", () => {
    // Arrange
    const siglas = ESTADOS_BR.map((e) => e.sigla);

    // Act
    const unique = new Set(siglas);

    // Assert
    expect(unique.size).toBe(siglas.length);
  });

  it("contém UFs essenciais (SP e DF)", () => {
    // Act
    const hasSP = ESTADOS_BR.some((e) => e.sigla === "SP" && e.nome.includes("São Paulo"));
    const hasDF = ESTADOS_BR.some((e) => e.sigla === "DF" && e.nome.includes("Distrito Federal"));

    // Assert
    expect(hasSP).toBe(true);
    expect(hasDF).toBe(true);
  });
});
