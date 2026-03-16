// src/__tests__/lib/sanitizeHtml.test.ts
// Unit tests for XSS-hardening helpers in sanitizeHtml.ts

import { describe, it, expect } from "vitest";
import {
  sanitizeAsText,
  sanitizeAsTextWithLineBreaks,
  sanitizeUrl,
  isMercadoPagoUrl,
} from "../../lib/sanitizeHtml";

describe("sanitizeAsText", () => {
  it("deve escapar o caractere &", () => {
    expect(sanitizeAsText("Café & Co.")).toBe("Café &amp; Co.");
  });

  it("deve escapar < e >", () => {
    expect(sanitizeAsText("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });

  it("deve escapar aspas duplas", () => {
    expect(sanitizeAsText('Say "hi"')).toBe("Say &quot;hi&quot;");
  });

  it("deve escapar aspas simples", () => {
    expect(sanitizeAsText("it's")).toBe("it&#x27;s");
  });

  it("deve escapar backtick", () => {
    expect(sanitizeAsText("let x = `foo`")).toBe("let x = &#x60;foo&#x60;");
  });

  it("deve retornar string vazia para null e undefined", () => {
    expect(sanitizeAsText(null)).toBe("");
    expect(sanitizeAsText(undefined)).toBe("");
  });

  it("deve converter valores não-string via String()", () => {
    expect(sanitizeAsText(42)).toBe("42");
    expect(sanitizeAsText(true)).toBe("true");
  });

  it("deve manter texto sem caracteres especiais intacto", () => {
    expect(sanitizeAsText("Olá, mundo!")).toBe("Olá, mundo!");
  });
});

describe("sanitizeAsTextWithLineBreaks", () => {
  it("deve converter \\n em <br>", () => {
    expect(sanitizeAsTextWithLineBreaks("linha1\nlinha2")).toBe(
      "linha1<br>linha2",
    );
  });

  it("deve escapar HTML antes de converter \\n", () => {
    expect(sanitizeAsTextWithLineBreaks("<b>negrito</b>\nnova linha")).toBe(
      "&lt;b&gt;negrito&lt;/b&gt;<br>nova linha",
    );
  });

  it("deve retornar string vazia para null e undefined", () => {
    expect(sanitizeAsTextWithLineBreaks(null)).toBe("");
    expect(sanitizeAsTextWithLineBreaks(undefined)).toBe("");
  });
});

describe("sanitizeUrl", () => {
  it("deve permitir URLs https normais", () => {
    expect(sanitizeUrl("https://example.com/path?q=1")).toBe(
      "https://example.com/path?q=1",
    );
  });

  it("deve permitir URLs http normais", () => {
    expect(sanitizeUrl("http://localhost:5000/api/ping")).toBe(
      "http://localhost:5000/api/ping",
    );
  });

  it("deve permitir caminhos relativos com /", () => {
    expect(sanitizeUrl("/admin/pedidos")).toBe("/admin/pedidos");
  });

  it("deve permitir caminhos relativos com ./", () => {
    expect(sanitizeUrl("./page")).toBe("./page");
  });

  it("deve permitir caminhos relativos com ../", () => {
    expect(sanitizeUrl("../parent")).toBe("../parent");
  });

  it("deve bloquear javascript: URIs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
  });

  it("deve bloquear javascript: com maiúsculas e espaços", () => {
    expect(sanitizeUrl("  JAVASCRIPT:void(0)  ")).toBe("");
  });

  it("deve bloquear data: URIs", () => {
    expect(sanitizeUrl("data:text/html,<h1>xss</h1>")).toBe("");
  });

  it("deve bloquear vbscript: URIs", () => {
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBe("");
  });

  it("deve retornar string vazia para null e undefined", () => {
    expect(sanitizeUrl(null)).toBe("");
    expect(sanitizeUrl(undefined)).toBe("");
  });

  it("deve retornar string vazia para URL inválida não-relativa", () => {
    expect(sanitizeUrl("not-a-url-at-all$$$")).toBe("");
  });

  it("deve retornar string vazia para string vazia", () => {
    expect(sanitizeUrl("")).toBe("");
  });
});

describe("isMercadoPagoUrl", () => {
  // ─── casos válidos ────────────────────────────────────────────────────────
  it("aceita mercadopago.com com https", () => {
    expect(isMercadoPagoUrl("https://mercadopago.com/checkout/v1/redirect")).toBe(true);
  });

  it("aceita www.mercadopago.com.br", () => {
    expect(isMercadoPagoUrl("https://www.mercadopago.com.br/checkout/pro/pay")).toBe(true);
  });

  it("aceita sandbox.mercadopago.com.br", () => {
    expect(isMercadoPagoUrl("https://sandbox.mercadopago.com.br/checkout/v1/redirect")).toBe(true);
  });

  it("aceita mercadopago.com.ar", () => {
    expect(isMercadoPagoUrl("https://mercadopago.com.ar/checkout/pro/pay")).toBe(true);
  });

  it("aceita mercadolibre.com", () => {
    expect(isMercadoPagoUrl("https://mercadolibre.com/checkout")).toBe(true);
  });

  it("aceita www.mercadolibre.com.br", () => {
    expect(isMercadoPagoUrl("https://www.mercadolibre.com.br/checkout")).toBe(true);
  });

  it("aceita subdomínio múltiplo legítimo (a.b.mercadopago.com)", () => {
    expect(isMercadoPagoUrl("https://a.b.mercadopago.com/pay")).toBe(true);
  });

  // ─── casos inválidos — protocolo ─────────────────────────────────────────
  it("rejeita http:// mesmo em domínio válido", () => {
    expect(isMercadoPagoUrl("http://mercadopago.com/checkout")).toBe(false);
  });

  it("rejeita ftp:// mesmo em domínio válido", () => {
    expect(isMercadoPagoUrl("ftp://mercadopago.com/file")).toBe(false);
  });

  // ─── casos inválidos — domínio errado ────────────────────────────────────
  it("rejeita domínio arbitrário", () => {
    expect(isMercadoPagoUrl("https://evil.com/checkout")).toBe(false);
  });

  it("rejeita mercadopago como path, não hostname (https://evil.com/mercadopago)", () => {
    expect(isMercadoPagoUrl("https://evil.com/mercadopago/checkout")).toBe(false);
  });

  it("rejeita mercadopago como subdomínio de domínio malicioso (mercadopago.evil.com)", () => {
    expect(isMercadoPagoUrl("https://mercadopago.evil.com/checkout")).toBe(false);
  });

  it("rejeita domínio que contém 'mercadopago' mas não como marca principal", () => {
    expect(isMercadoPagoUrl("https://notmercadopago.com/checkout")).toBe(false);
  });

  // ─── casos inválidos — entrada degenerada ────────────────────────────────
  it("rejeita string vazia", () => {
    expect(isMercadoPagoUrl("")).toBe(false);
  });

  it("rejeita URL malformada", () => {
    expect(isMercadoPagoUrl("not-a-url")).toBe(false);
  });

  it("rejeita javascript: com domínio mercadopago no path", () => {
    expect(isMercadoPagoUrl("javascript:mercadopago.com")).toBe(false);
  });
});
