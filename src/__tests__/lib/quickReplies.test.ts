import { describe, it, expect } from "vitest";
import {
  DEFAULT_QUICK_REPLIES,
  renderQuickReply,
  buildWhatsAppUrl,
} from "@/lib/quickReplies";

const baseLead = {
  nome: "João da Silva",
  cidade: "Manhuaçu",
  corrego_localidade: "Córrego Pedra Bonita",
  tipo_cafe: "arabica_especial" as const,
  volume_range: "200_500" as const,
};

describe("lib/quickReplies", () => {
  describe("renderQuickReply — primeiro contato", () => {
    const tpl = DEFAULT_QUICK_REPLIES.find((t) => t.id === "primeiro_contato")!;

    it("substitui nome, corretora, cidade e córrego quando todos presentes", () => {
      const out = renderQuickReply(tpl, {
        lead: baseLead,
        corretoraNome: "Corretora Teste",
      });
      expect(out).toContain("Olá João da Silva, aqui é da Corretora Teste.");
      expect(out).toContain("Vi que você é de Manhuaçu.");
      expect(out).toContain("Vi que você falou do córrego Córrego Pedra Bonita.");
      expect(out).toContain("Podemos conversar sobre seu café?");
    });

    it("descarta a linha de córrego quando lead não tem corrego_localidade", () => {
      const out = renderQuickReply(tpl, {
        lead: { ...baseLead, corrego_localidade: null },
        corretoraNome: "Corretora Teste",
      });
      expect(out).toContain("Vi que você é de Manhuaçu.");
      expect(out).not.toContain("córrego");
    });

    it("descarta a linha de cidade quando lead não tem cidade", () => {
      const out = renderQuickReply(tpl, {
        lead: { ...baseLead, cidade: null },
        corretoraNome: "Corretora Teste",
      });
      expect(out).not.toContain("Vi que você é de");
      expect(out).toContain("Vi que você falou do córrego");
    });

    it("preserva saudação mesmo sem dados extras", () => {
      const out = renderQuickReply(tpl, {
        lead: {
          nome: "Maria",
          cidade: null,
          corrego_localidade: null,
          tipo_cafe: null,
          volume_range: null,
        },
        corretoraNome: "X",
      });
      expect(out).toContain("Olá Maria, aqui é da X.");
      expect(out).toContain("Podemos conversar sobre seu café?");
    });
  });

  describe("renderQuickReply — cotação do dia", () => {
    const tpl = DEFAULT_QUICK_REPLIES.find((t) => t.id === "cotacao_dia")!;

    it("aplica tipo_cafe_lc em minúsculo ('arábica especial')", () => {
      const out = renderQuickReply(tpl, {
        lead: baseLead,
        corretoraNome: "X",
      });
      expect(out).toContain("café arábica especial");
    });

    it("traduz volume_range para label legível ('200 a 500 sacas')", () => {
      const out = renderQuickReply(tpl, {
        lead: baseLead,
        corretoraNome: "X",
      });
      expect(out).toContain("200 a 500 sacas");
    });
  });

  describe("renderQuickReply — pedir amostra", () => {
    const tpl = DEFAULT_QUICK_REPLIES.find((t) => t.id === "pedir_amostra")!;

    it("insere sufixo de quantidade quando há volume", () => {
      const out = renderQuickReply(tpl, {
        lead: baseLead,
        corretoraNome: "X",
      });
      expect(out).toContain("amostra do seu café (~200 a 500 sacas)");
    });

    it("omite sufixo de quantidade quando volume é null", () => {
      const out = renderQuickReply(tpl, {
        lead: { ...baseLead, volume_range: null },
        corretoraNome: "X",
      });
      expect(out).toContain("amostra do seu café.");
      expect(out).not.toContain("(~");
    });
  });

  describe("buildWhatsAppUrl", () => {
    it("prefixa 55 quando o telefone não tem DDI", () => {
      const url = buildWhatsAppUrl("(33) 99999-9999", "oi");
      expect(url).toBe("https://wa.me/5533999999999?text=oi");
    });

    it("não duplica DDI quando já começa com 55", () => {
      const url = buildWhatsAppUrl("5533999999999", "oi");
      expect(url).toBe("https://wa.me/5533999999999?text=oi");
    });

    it("encoda caracteres especiais na mensagem", () => {
      const url = buildWhatsAppUrl("33999999999", "Olá, tudo bem?");
      expect(url).toContain("Ol%C3%A1");
      expect(url).toContain("tudo%20bem%3F");
    });

    it("retorna null quando telefone é inválido", () => {
      expect(buildWhatsAppUrl(null, "oi")).toBeNull();
      expect(buildWhatsAppUrl("", "oi")).toBeNull();
      expect(buildWhatsAppUrl("123", "oi")).toBeNull();
    });
  });
});
