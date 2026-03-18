// src/__tests__/utils/safeInternalRedirect.test.ts
//
// Risco: open-redirect — se a guarda falhar, um atacante pode injetar uma URL
// externa no parâmetro `from` e redirecionar o usuário para um site malicioso
// após o login. Esta função é a última linha de defesa do lado do cliente.
//
// O que está sendo coberto:
//   - Entradas falsy (null, undefined, "") → fallback seguro
//   - Caminhos internos relativos válidos → aceitos
//   - URLs absolutas externas → rejeitadas
//   - Protocol-relative "//evil.com" → rejeitadas
//   - Protocolos perigosos (javascript:, data:) → rejeitados
//   - Whitespace → normalizado antes da validação
//   - Fallback customizado é respeitado

import { describe, it, expect } from "vitest";
import { safeInternalRedirect } from "@/utils/safeInternalRedirect";

describe("safeInternalRedirect", () => {
  describe("entradas falsy → fallback padrão '/'", () => {
    it("retorna '/' para null", () => {
      expect(safeInternalRedirect(null)).toBe("/");
    });

    it("retorna '/' para undefined", () => {
      expect(safeInternalRedirect(undefined)).toBe("/");
    });

    it("retorna '/' para string vazia", () => {
      expect(safeInternalRedirect("")).toBe("/");
    });

    it("retorna '/' para string só de espaços (falsy após trim)", () => {
      // "   " → trim → "" → falsy na check !raw NÃO (raw tem valor), mas trim
      // Nota: o código faz `if (!raw)` ANTES do trim; "   " é truthy → passa
      // depois trim → "   ".trim() = "" → mas startsWith("/") ainda é false
      // Então cai no fallback. Comportamento correto.
      expect(safeInternalRedirect("   ")).toBe("/");
    });
  });

  describe("fallback customizado", () => {
    it("usa fallback customizado para null", () => {
      expect(safeInternalRedirect(null, "/admin")).toBe("/admin");
    });

    it("usa fallback customizado para string vazia", () => {
      expect(safeInternalRedirect("", "/dashboard")).toBe("/dashboard");
    });

    it("usa fallback customizado para URL externa", () => {
      expect(safeInternalRedirect("https://evil.com", "/login")).toBe("/login");
    });
  });

  describe("caminhos internos válidos → aceitos", () => {
    it("aceita a raiz '/'", () => {
      expect(safeInternalRedirect("/")).toBe("/");
    });

    it("aceita caminho de rota simples", () => {
      expect(safeInternalRedirect("/produtos")).toBe("/produtos");
    });

    it("aceita caminho com sub-rotas aninhadas", () => {
      expect(safeInternalRedirect("/admin/produtos/42")).toBe("/admin/produtos/42");
    });

    it("aceita caminho com query string", () => {
      expect(safeInternalRedirect("/busca?q=drone&categoria=agricola")).toBe(
        "/busca?q=drone&categoria=agricola",
      );
    });

    it("aceita caminho com hash fragment", () => {
      expect(safeInternalRedirect("/produtos#detalhes")).toBe("/produtos#detalhes");
    });

    it("faz trim de espaços antes de validar e aceita o resultado", () => {
      expect(safeInternalRedirect("  /dashboard  ")).toBe("/dashboard");
    });
  });

  describe("URLs externas absolutas → rejeitadas", () => {
    it("rejeita URL com protocolo http://", () => {
      expect(safeInternalRedirect("http://evil.com")).toBe("/");
    });

    it("rejeita URL com protocolo https://", () => {
      expect(safeInternalRedirect("https://evil.com/steal?token=abc")).toBe("/");
    });

    it("rejeita URL com protocolo https:// e fallback customizado", () => {
      expect(safeInternalRedirect("https://evil.com", "/login")).toBe("/login");
    });
  });

  describe("protocol-relative '//...' → rejeitado (open-redirect via protocolo implícito)", () => {
    it("rejeita '//evil.com'", () => {
      expect(safeInternalRedirect("//evil.com")).toBe("/");
    });

    it("rejeita '//evil.com/path'", () => {
      expect(safeInternalRedirect("//evil.com/steal")).toBe("/");
    });
  });

  describe("protocolos perigosos → rejeitados", () => {
    it("rejeita 'javascript:alert(1)' (XSS via redirect)", () => {
      expect(safeInternalRedirect("javascript:alert(1)")).toBe("/");
    });

    it("rejeita 'data:text/html,...' (payload embutido)", () => {
      expect(safeInternalRedirect("data:text/html,<script>alert(1)</script>")).toBe("/");
    });

    it("rejeita 'vbscript:...'", () => {
      expect(safeInternalRedirect("vbscript:msgbox(1)")).toBe("/");
    });
  });

  describe("caminhos sem barra inicial → rejeitados", () => {
    it("rejeita caminho relativo sem barra", () => {
      expect(safeInternalRedirect("admin/dashboard")).toBe("/");
    });

    it("rejeita caminho que parece interno mas começa sem barra", () => {
      expect(safeInternalRedirect("produtos/42")).toBe("/");
    });
  });
});
