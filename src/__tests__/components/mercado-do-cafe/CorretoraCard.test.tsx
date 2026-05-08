// src/__tests__/components/mercado-do-cafe/CorretoraCard.test.tsx
//
// Fluxo crítico: card da listagem pública de corretoras — é o que
// converte produtor em lead (canais de contato + CTA "Vender meu
// café"). Quebrar o link do WhatsApp ou do detalhe = perda direta
// de receita.
//
// Cobertura focada em comportamento (não em copy/layout):
//   - Identidade: nome + cidade aparecem para escolha
//   - Link de detalhe aponta para /mercado-do-cafe/corretoras/{slug}
//   - CTA "Vender meu café" aponta para a âncora #fale-corretora
//   - WhatsApp: href montado com prefixo 55 + dígitos
//   - Selo de KYC: condicional ao kyc_status === "verified"
//   - Sem canais: card ainda renderiza identidade (não quebra)

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CorretoraCard } from "@/components/mercado-do-cafe/CorretoraCard";
import type { PublicCorretora } from "@/types/corretora";

// next/image: stub para não tentar otimizar URL no jsdom
vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: any) => {
    const resolvedSrc = typeof src === "string" ? src : src?.src ?? "";
    return <img src={resolvedSrc} alt={alt} {...rest} />;
  },
}));

vi.mock("@/utils/absUrl", () => ({
  absUrl: (p: string) => `http://localhost:5000${p}`,
  API_BASE: "http://localhost:5000",
}));

function makeCorretora(
  overrides: Partial<PublicCorretora> = {},
): PublicCorretora {
  return {
    id: 42,
    name: "Corretora Serra Verde",
    slug: "corretora-serra-verde",
    contact_name: "João Silva",
    description: "Corretora regional com 20 anos de mercado.",
    logo_path: null,
    city: "Manhuaçu",
    state: "MG",
    region: "Zona da Mata",
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    instagram: null,
    facebook: null,
    is_featured: 0,
    cidades_atendidas: null,
    tipos_cafe: null,
    perfil_compra: null,
    horario_atendimento: null,
    anos_atuacao: null,
    foto_responsavel_path: null,
    reviews_count: null,
    reviews_avg: null,
    sla_avg_seconds: null,
    sla_sample_count: null,
    kyc_status: null,
    kyc_verified_at: null,
    cnpj: null,
    razao_social: null,
    nome_fantasia: null,
    cnpj_verified_at: null,
    cnpj_verification_status: null,
    ...overrides,
  };
}

describe("CorretoraCard — fluxo crítico", () => {
  it("renderiza nome e cidade da corretora", () => {
    render(
      <CorretoraCard
        corretora={makeCorretora({
          name: "Corretora Vale do Café",
          city: "Caratinga",
          state: "MG",
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /Corretora Vale do Café/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Caratinga/),
    ).toBeInTheDocument();
  });

  it("link 'Ver ficha' aponta para /mercado-do-cafe/corretoras/{slug}", () => {
    render(
      <CorretoraCard
        corretora={makeCorretora({ slug: "minha-corretora" })}
      />,
    );

    const link = screen.getByRole("link", { name: /ver ficha/i });
    expect(link.getAttribute("href")).toBe(
      "/mercado-do-cafe/corretoras/minha-corretora",
    );
  });

  it("CTA 'Vender meu café' aponta para âncora #fale-corretora do detalhe", () => {
    // Esse CTA é o caminho mais curto entre listagem e formulário de
    // lead. Se quebrar a âncora, o produtor cai no topo do detalhe e
    // perde fricção da conversão.
    render(
      <CorretoraCard
        corretora={makeCorretora({ slug: "abc" })}
      />,
    );

    const cta = screen.getByLabelText(/Enviar lote para/i);
    expect(cta.getAttribute("href")).toBe(
      "/mercado-do-cafe/corretoras/abc#fale-corretora",
    );
  });

  it("WhatsApp gera link wa.me com prefixo 55 e apenas dígitos", () => {
    render(
      <CorretoraCard
        corretora={makeCorretora({
          whatsapp: "(33) 99999-1234",
          name: "Corretora Y",
        })}
      />,
    );

    const link = screen.getByLabelText(/WhatsApp de Corretora Y/i);
    expect(link.getAttribute("href")).toBe("https://wa.me/5533999991234");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("Telefone gera link tel: com prefixo +55", () => {
    render(
      <CorretoraCard
        corretora={makeCorretora({ phone: "33 3333-1111", name: "C" })}
      />,
    );

    const link = screen.getByLabelText(/Telefone de C/i);
    expect(link.getAttribute("href")).toBe("tel:+553333331111");
  });

  it("E-mail gera link mailto: com endereço cru", () => {
    render(
      <CorretoraCard
        corretora={makeCorretora({
          email: "contato@corretora.com.br",
          name: "C",
        })}
      />,
    );

    const link = screen.getByLabelText(/E-mail de C/i);
    expect(link.getAttribute("href")).toBe(
      "mailto:contato@corretora.com.br",
    );
  });

  it("renderiza selo 'Corretora auditada' apenas quando kyc_status='verified'", () => {
    const { rerender } = render(
      <CorretoraCard
        corretora={makeCorretora({ kyc_status: "verified" })}
      />,
    );
    expect(
      screen.getByText(/Corretora auditada/i),
    ).toBeInTheDocument();

    rerender(
      <CorretoraCard
        corretora={makeCorretora({ kyc_status: "pending_verification" })}
      />,
    );
    expect(
      screen.queryByText(/Corretora auditada/i),
    ).not.toBeInTheDocument();

    rerender(
      <CorretoraCard
        corretora={makeCorretora({ kyc_status: null })}
      />,
    );
    expect(
      screen.queryByText(/Corretora auditada/i),
    ).not.toBeInTheDocument();
  });

  it("renderiza identidade mesmo sem nenhum canal de contato (defensivo)", () => {
    // Cenário: corretora cadastrada mas sem WA/email/site preenchidos.
    // O card NÃO pode quebrar — produtor ainda precisa ver nome+cidade
    // pra clicar em "Ver ficha" e mandar lead pelo formulário.
    render(<CorretoraCard corretora={makeCorretora()} />);

    expect(
      screen.getByRole("heading", { name: /Corretora Serra Verde/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ver ficha/i })).toBeInTheDocument();
    // Nenhum link de canal externo
    expect(
      screen.queryByLabelText(/WhatsApp de/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Telefone de/i),
    ).not.toBeInTheDocument();
  });
});
