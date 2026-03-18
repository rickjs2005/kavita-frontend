// src/__tests__/utils/stock.test.ts
//
// Risco: lógica de normalização de estoque incorreta pode causar overselling
// (mostrar produto disponível quando está zerado) ou UX quebrada (NaN/undefined
// chegando em componentes de badge de disponibilidade).
//
// O que está sendo coberto:
//   - parseStockValue: números, strings pt-BR, valores inválidos, edge cases numéricos
//   - resolveStockValue: seleção do primeiro candidato válido entre N entradas
//
// Nota: o arquivo src/__tests__/utils/stock.ts existia mas não era executado
// (sem extensão .test.ts) e continha asserções incorretas sobre o contrato
// de retorno. Este arquivo substitui com o comportamento real.

import { describe, it, expect } from "vitest";
import { parseStockValue, resolveStockValue } from "@/utils/stock";

describe("parseStockValue", () => {
  describe("entradas numéricas diretas", () => {
    it("aceita inteiro positivo", () => {
      expect(parseStockValue(10)).toBe(10);
    });

    it("aceita zero (sem estoque ainda é um número válido)", () => {
      expect(parseStockValue(0)).toBe(0);
    });

    it("aceita negativo (devolução/reserva)", () => {
      expect(parseStockValue(-5)).toBe(-5);
    });

    it("aceita número com casas decimais", () => {
      expect(parseStockValue(1.5)).toBe(1.5);
    });

    it("rejeita NaN — não é finito", () => {
      expect(parseStockValue(NaN)).toBeNull();
    });

    it("rejeita Infinity positivo — não é finito", () => {
      expect(parseStockValue(Infinity)).toBeNull();
    });

    it("rejeita -Infinity — não é finito", () => {
      expect(parseStockValue(-Infinity)).toBeNull();
    });
  });

  describe("strings numéricas simples", () => {
    it("converte '10' para 10", () => {
      expect(parseStockValue("10")).toBe(10);
    });

    it("converte '0' para 0", () => {
      expect(parseStockValue("0")).toBe(0);
    });

    it("converte '1234' para 1234", () => {
      expect(parseStockValue("1234")).toBe(1234);
    });

    it("trata ponto como separador de milhar (pt-BR): '12.34' → 1234", () => {
      // O sanitizador remove tudo que não for dígito/vírgula/menos.
      // Em pt-BR o ponto é separador de milhar, portanto "12.34" → "1234".
      expect(parseStockValue("12.34")).toBe(1234);
    });
  });

  describe("strings pt-BR com vírgula decimal", () => {
    it("converte '10,5' para 10.5", () => {
      expect(parseStockValue("10,5")).toBe(10.5);
    });

    it("converte '1,99' para 1.99", () => {
      expect(parseStockValue("1,99")).toBe(1.99);
    });

    it("converte '-10,5' para -10.5", () => {
      expect(parseStockValue("-10,5")).toBe(-10.5);
    });
  });

  describe("strings com símbolos monetários e separadores de milhar", () => {
    it("remove 'R$ ' e converte '2,50' para 2.5", () => {
      expect(parseStockValue("R$ 2,50")).toBe(2.5);
    });

    it("remove ponto de milhar e converte '1.234,56' para 1234.56", () => {
      // "1.234,56" → remove non[digit,comma,minus] → "1234,56" → "1234.56" → 1234.56
      expect(parseStockValue("1.234,56")).toBe(1234.56);
    });

    it("converte ' R$ 1.250,50' para 1250.5", () => {
      expect(parseStockValue(" R$ 1.250,50")).toBe(1250.5);
    });
  });

  describe("strings inválidas → null", () => {
    it("retorna null para string vazia", () => {
      expect(parseStockValue("")).toBeNull();
    });

    it("retorna null para string só de espaços", () => {
      expect(parseStockValue("   ")).toBeNull();
    });

    it("retorna null para texto puro sem dígitos", () => {
      expect(parseStockValue("abc")).toBeNull();
    });

    it("retorna null para '--' (placeholder de campo vazio)", () => {
      // "--" → cleaned = "--" → replace(",","."): "--" → Number("--") = NaN → null
      expect(parseStockValue("--")).toBeNull();
    });

    it("retorna null para múltiplas vírgulas ('12,34,56')", () => {
      // "12,34,56" → replace only first comma → "12.34,56" → Number("12.34,56") = NaN → null
      expect(parseStockValue("12,34,56")).toBeNull();
    });
  });

  describe("tipos não suportados → null", () => {
    it("retorna null para null", () => {
      expect(parseStockValue(null)).toBeNull();
    });

    it("retorna null para undefined", () => {
      expect(parseStockValue(undefined)).toBeNull();
    });

    it("retorna null para boolean true", () => {
      expect(parseStockValue(true)).toBeNull();
    });

    it("retorna null para boolean false", () => {
      expect(parseStockValue(false)).toBeNull();
    });

    it("retorna null para objeto", () => {
      expect(parseStockValue({})).toBeNull();
    });

    it("retorna null para array", () => {
      expect(parseStockValue([])).toBeNull();
    });
  });
});

describe("resolveStockValue", () => {
  it("retorna o único candidato quando é válido", () => {
    expect(resolveStockValue(10)).toBe(10);
    expect(resolveStockValue(0)).toBe(0);
    expect(resolveStockValue("10,5")).toBe(10.5);
  });

  it("pula null/undefined e retorna o primeiro válido", () => {
    expect(resolveStockValue(null, 99)).toBe(99);
    expect(resolveStockValue(undefined, 42)).toBe(42);
  });

  it("pula NaN/Infinity e retorna o primeiro válido", () => {
    expect(resolveStockValue(NaN, 5)).toBe(5);
    expect(resolveStockValue(Infinity, 3)).toBe(3);
  });

  it("pula strings inválidas e retorna o primeiro válido", () => {
    expect(resolveStockValue("abc", 7)).toBe(7);
    expect(resolveStockValue("", "10")).toBe(10);
  });

  it("processa múltiplos candidatos em ordem e retorna o primeiro válido", () => {
    expect(resolveStockValue(null, undefined, "abc", "10,5")).toBe(10.5);
  });

  it("retorna null quando TODOS os candidatos são inválidos", () => {
    expect(resolveStockValue("abc")).toBeNull();
    expect(resolveStockValue(null)).toBeNull();
    expect(resolveStockValue(null, undefined, "")).toBeNull();
    expect(resolveStockValue(NaN, Infinity)).toBeNull();
  });

  it("retorna null quando chamado sem argumentos", () => {
    expect(resolveStockValue()).toBeNull();
  });

  it("aceita 0 como valor válido (estoque zerado ≠ inválido)", () => {
    // 0 é um número finito — deve ser retornado, não pulado
    expect(resolveStockValue(0)).toBe(0);
    expect(resolveStockValue(null, 0)).toBe(0);
  });

  it("retorna o PRIMEIRO candidato válido, não o melhor", () => {
    // Se o primeiro é 5, retorna 5 mesmo que haja 100 depois
    expect(resolveStockValue(5, 100)).toBe(5);
    expect(resolveStockValue(null, 5, 100)).toBe(5);
  });
});
