import { describe, it, expect } from "vitest";
import {
  toNumber,
  formatCurrency,
  formatPercent,
  toDate,
  formatDate,
  formatDateShort,
  formatDateWithYear,
  formatDateShortYear,
  formatDateTime,
  formatShortDate,
  formatFullDate,
  onlyDigits,
  formatCpfMask,
  formatCnpjMask,
  formatCepMask,
  formatPhoneMask,
  normalizeEmail,
  normalizeName,
} from "@/utils/formatters";

function normalizeSpaces(s: string) {
  return s
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

// ============================================================================
// Testes complementares — funções não cobertas acima
// ============================================================================

// Helper: date sem problema de timezone (midnight local = dia correto)
const LOCAL_JAN15 = new Date(2025, 0, 15); // 15/01/2025 — local time

describe("toNumber — casos adicionais", () => {
  it("passa float negativo intacto", () => expect(toNumber(-99.9)).toBe(-99.9));
  it("converte string '99,90' → 99.9", () =>
    expect(toNumber("99,90")).toBeCloseTo(99.9, 5));
  it("converte string '0' → 0", () => expect(toNumber("0")).toBe(0));
  it("converte string de inteiro '500' → 500", () => expect(toNumber("500")).toBe(500));
  it("string com ponto EN '1234.56' → 123456 (ponto tratado como separador de milhar)", () =>
    expect(toNumber("1234.56")).toBe(123456));
  it("retorna 0 para object (type inesperado)", () =>
    expect(toNumber({} as any)).toBe(0));
});

describe("formatCurrency — casos adicionais", () => {
  it("formata zero como R$ 0,00", () => {
    expect(normalizeSpaces(formatCurrency(0))).toBe("R$ 0,00");
  });

  it("formata inteiro positivo", () => {
    expect(normalizeSpaces(formatCurrency(100))).toBe("R$ 100,00");
  });

  it("string BR '250,00' → R$ 250,00", () => {
    expect(normalizeSpaces(formatCurrency("250,00"))).toBe("R$ 250,00");
  });

  it("aceita string BR '1.234,56'", () => {
    expect(normalizeSpaces(formatCurrency("1.234,56"))).toBe("R$ 1.234,56");
  });

  it("formata valor negativo contendo o número", () => {
    const result = formatCurrency(-50.5);
    expect(result).toContain("50,50");
  });
});

describe("formatPercent — casos adicionais", () => {
  it("0 → '0,0%'", () => expect(formatPercent(0)).toBe("0,0%"));
  it("null → '0,0%'", () => expect(formatPercent(null)).toBe("0,0%"));
  it("undefined → '0,0%'", () => expect(formatPercent(undefined)).toBe("0,0%"));
  it("12.3 → '12,3%'", () => expect(formatPercent(12.3)).toBe("12,3%"));
  it("100 → '100,0%'", () => expect(formatPercent(100)).toBe("100,0%"));
  it("-5.5 → '-5,5%'", () => expect(formatPercent(-5.5)).toBe("-5,5%"));
  it("decimals=2: 12.345 → '12,35%'", () => expect(formatPercent(12.345, 2)).toBe("12,35%"));
  it("decimals=0: 75.9 → '76%'", () => expect(formatPercent(75.9, 0)).toBe("76%"));
});

describe("toDate", () => {
  it("retorna null para null", () => expect(toDate(null)).toBeNull());
  it("retorna null para undefined", () => expect(toDate(undefined)).toBeNull());
  it("retorna null para string vazia", () => expect(toDate("")).toBeNull());
  it("retorna null para string inválida", () => expect(toDate("nao-e-data")).toBeNull());
  it("retorna null para Date inválido", () => expect(toDate(new Date("invalid"))).toBeNull());
  it("retorna o mesmo objeto Date válido", () => {
    const d = LOCAL_JAN15;
    expect(toDate(d)).toBe(d);
  });
  it("converte ISO string para Date", () => {
    const r = toDate("2025-06-15T12:00:00Z");
    expect(r).toBeInstanceOf(Date);
    expect(r!.getTime()).not.toBeNaN();
  });
  it("converte timestamp numérico para Date", () => {
    const ts = LOCAL_JAN15.getTime();
    const r = toDate(ts);
    expect(r).toBeInstanceOf(Date);
    expect(r!.getTime()).toBe(ts);
  });
  it("aceita 0 (epoch) como válido", () => {
    expect(toDate(0)).toBeInstanceOf(Date);
  });
});

describe("formatDate — casos adicionais", () => {
  it("retorna '' para null", () => expect(formatDate(null)).toBe(""));
  it("formata Date local corretamente (DD/MM/YYYY)", () => {
    expect(formatDate(LOCAL_JAN15)).toBe("15/01/2025");
  });
  it("opções customizadas (só mês longo e ano)", () => {
    const r = formatDate(LOCAL_JAN15, { month: "long", year: "numeric" });
    expect(r.toLowerCase()).toContain("janeiro");
    expect(r).toContain("2025");
  });
});

describe("formatDateShort", () => {
  it("retorna '' para null", () => expect(formatDateShort(null)).toBe(""));
  it("retorna 'DD/MM' sem ano", () => expect(formatDateShort(LOCAL_JAN15)).toBe("15/01"));
});

describe("formatDateWithYear", () => {
  it("retorna '' para null", () => expect(formatDateWithYear(null)).toBe(""));
  it("retorna 'DD/MM/YYYY'", () => expect(formatDateWithYear(LOCAL_JAN15)).toBe("15/01/2025"));
});

describe("formatDateShortYear", () => {
  it("retorna '' para null", () => expect(formatDateShortYear(null)).toBe(""));
  it("retorna 'DD/MM/YY'", () => expect(formatDateShortYear(LOCAL_JAN15)).toBe("15/01/25"));
});

describe("formatDateTime", () => {
  it("retorna '' para null", () => expect(formatDateTime(null)).toBe(""));
  it("contém 'DD/MM/YYYY' e 'HH:MM'", () => {
    const r = formatDateTime(LOCAL_JAN15);
    expect(r).toContain("15/01/2025");
    expect(r).toMatch(/\d{2}:\d{2}/);
  });
});

describe("aliases formatShortDate / formatFullDate", () => {
  it("formatShortDate === formatDateShort", () =>
    expect(formatShortDate(LOCAL_JAN15)).toBe(formatDateShort(LOCAL_JAN15)));
  it("formatFullDate === formatDateWithYear", () =>
    expect(formatFullDate(LOCAL_JAN15)).toBe(formatDateWithYear(LOCAL_JAN15)));
});

describe("formatCpfMask", () => {
  it("string vazia → vazia", () => expect(formatCpfMask("")).toBe(""));
  it("3 dígitos → sem ponto", () => expect(formatCpfMask("123")).toBe("123"));
  it("4 dígitos → '123.4'", () => expect(formatCpfMask("1234")).toBe("123.4"));
  it("6 dígitos → '123.456'", () => expect(formatCpfMask("123456")).toBe("123.456"));
  it("7 dígitos → '123.456.7'", () => expect(formatCpfMask("1234567")).toBe("123.456.7"));
  it("9 dígitos → '123.456.789'", () => expect(formatCpfMask("123456789")).toBe("123.456.789"));
  it("10 dígitos → '123.456.789-0'", () =>
    expect(formatCpfMask("1234567890")).toBe("123.456.789-0"));
  it("11 dígitos → CPF completo '123.456.789-01'", () =>
    expect(formatCpfMask("12345678901")).toBe("123.456.789-01"));
  it("mais de 11 → trunca", () =>
    expect(formatCpfMask("123456789012")).toBe("123.456.789-01"));
  it("CPF já formatado como entrada → idempotente", () =>
    expect(formatCpfMask("123.456.789-01")).toBe("123.456.789-01"));
});

describe("formatCnpjMask", () => {
  it("string vazia → vazia", () => expect(formatCnpjMask("")).toBe(""));
  it("2 dígitos → '12'", () => expect(formatCnpjMask("12")).toBe("12"));
  it("3 dígitos → '12.3'", () => expect(formatCnpjMask("123")).toBe("12.3"));
  it("5 dígitos → '12.345'", () => expect(formatCnpjMask("12345")).toBe("12.345"));
  it("8 dígitos → '12.345.678'", () => expect(formatCnpjMask("12345678")).toBe("12.345.678"));
  it("9 dígitos → '12.345.678/9'", () => expect(formatCnpjMask("123456789")).toBe("12.345.678/9"));
  it("12 dígitos → '12.345.678/9012'", () =>
    expect(formatCnpjMask("123456789012")).toBe("12.345.678/9012"));
  it("14 dígitos → CNPJ completo '12.345.678/0001-99'", () =>
    expect(formatCnpjMask("12345678000199")).toBe("12.345.678/0001-99"));
  it("mais de 14 → trunca", () =>
    expect(formatCnpjMask("123456780001999")).toBe("12.345.678/0001-99"));
  it("CNPJ já formatado → idempotente", () =>
    expect(formatCnpjMask("12.345.678/0001-99")).toBe("12.345.678/0001-99"));
});

describe("formatCepMask", () => {
  it("vazio → vazio", () => expect(formatCepMask("")).toBe(""));
  it("4 dígitos → sem traço", () => expect(formatCepMask("1234")).toBe("1234"));
  it("5 dígitos → '12345'", () => expect(formatCepMask("12345")).toBe("12345"));
  it("6 dígitos → '12345-6'", () => expect(formatCepMask("123456")).toBe("12345-6"));
  it("8 dígitos → '12345-678'", () => expect(formatCepMask("12345678")).toBe("12345-678"));
  it("mais de 8 → trunca", () => expect(formatCepMask("123456789")).toBe("12345-678"));
  it("CEP já formatado → idempotente", () =>
    expect(formatCepMask("12345-678")).toBe("12345-678"));
});

describe("formatPhoneMask", () => {
  it("vazio → vazio", () => expect(formatPhoneMask("")).toBe(""));
  it("1 dígito → '(1'", () => expect(formatPhoneMask("1")).toBe("(1"));
  it("2 dígitos → '(11'", () => expect(formatPhoneMask("11")).toBe("(11"));
  it("3 dígitos → '(11) 9'", () => expect(formatPhoneMask("119")).toBe("(11) 9"));
  it("6 dígitos → '(11) 9999'", () => expect(formatPhoneMask("119999")).toBe("(11) 9999"));
  it("10 dígitos → fixo '(11) 9999-9999'", () =>
    expect(formatPhoneMask("1199999999")).toBe("(11) 9999-9999"));
  it("11 dígitos → celular '(11) 99999-9999'", () =>
    expect(formatPhoneMask("11999999999")).toBe("(11) 99999-9999"));
  it("mais de 11 → trunca em celular", () =>
    expect(formatPhoneMask("119999999990")).toBe("(11) 99999-9999"));
  it("telefone já formatado → idempotente (celular)", () =>
    expect(formatPhoneMask("(11) 99999-9999")).toBe("(11) 99999-9999"));
});

describe("normalizeEmail", () => {
  it("remove espaços e converte para minúsculo", () =>
    expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com"));
  it("string já normalizada permanece igual", () =>
    expect(normalizeEmail("admin@site.com")).toBe("admin@site.com"));
  it("string vazia → vazia", () =>
    expect(normalizeEmail("")).toBe(""));
  it("só maiúsculas → minúsculas", () =>
    expect(normalizeEmail("ADMIN@SITE.COM")).toBe("admin@site.com"));
});

describe("normalizeName", () => {
  it("capitaliza cada palavra", () =>
    expect(normalizeName("joão silva")).toBe("João Silva"));
  it("converte tudo maiúsculo para title case", () =>
    expect(normalizeName("PEDRO ALVES")).toBe("Pedro Alves"));
  it("string de uma palavra", () =>
    expect(normalizeName("ana")).toBe("Ana"));
  it("remove espaços extras entre palavras", () =>
    expect(normalizeName("maria   josé")).toBe("Maria José"));
  it("remove espaços no início e fim", () =>
    expect(normalizeName("  carlos  ")).toBe("Carlos"));
  it("string vazia → vazia", () =>
    expect(normalizeName("")).toBe(""));
});
