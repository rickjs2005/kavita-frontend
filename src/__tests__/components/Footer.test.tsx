import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";

import Footer from "@/components/layout/Footer";
import type { PublicShopSettings } from "@/server/data/shopSettings";

// next/link mock
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={String(href)} {...props}>
      {children}
    </a>
  ),
}));

/**
 * Factory tipada para evitar erro de props obrigatórias
 */
function makeShop(
  overrides: Partial<PublicShopSettings> = {}
): PublicShopSettings {
  return {
    store_name: "Kavita",
    logo_url: "/logo.png", // obrigatório
    footer_tagline: "",
    footer_links: [],
    contact_whatsapp: "",
    contact_email: "",
    social_whatsapp_url: "",
    cnpj: "",
    address_street: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
    address_zip: "",
    ...overrides,
  };
}

describe("Footer (src/components/layout/Footer.tsx)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-04T12:00:00.000Z"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renderiza nome padrão e links default quando shop não é informado", () => {
    render(<Footer />);

    vi.runAllTimers();

    expect(
      screen.getByRole("heading", { name: "Kavita" })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Home/i })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: /Serviços/i })).toHaveAttribute(
      "href",
      "/servicos"
    );
    expect(screen.getByRole("link", { name: /Contato/i })).toHaveAttribute(
      "href",
      "/contato"
    );
  });

  it("formata CNPJ quando fornecido e não exibe valor quando vazio (positivo + negativo)", () => {
    const { rerender } = render(
      <Footer shop={makeShop({ cnpj: "12.345.678/0001-99" })} />
    );

    vi.runAllTimers();

    // positivo
    expect(screen.getByText(/CNPJ:/i)).toBeInTheDocument();
    expect(
      screen.getByText("12.345.678/0001-99")
    ).toBeInTheDocument();

    // negativo (rerender limpo)
    rerender(<Footer shop={makeShop({ cnpj: "" })} />);
    vi.runAllTimers();

    // label pode existir, valor não
    expect(
      screen.queryByText(/\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/)
    ).not.toBeInTheDocument();
  });

  it("renderiza endereço completo quando todos os campos existem", () => {
    render(
      <Footer
        shop={makeShop({
          address_street: "Rua A, 123",
          address_neighborhood: "Centro",
          address_city: "Belo Horizonte",
          address_state: "MG",
          address_zip: "30100-000",
        })}
      />
    );

    vi.runAllTimers();

    expect(screen.getByText("Sede")).toBeInTheDocument();
    expect(screen.getByText("Rua A, 123 • Centro")).toBeInTheDocument();
    expect(screen.getByText("Belo Horizonte - MG")).toBeInTheDocument();
    expect(screen.getByText("30100-000")).toBeInTheDocument();
  });

  it("renderiza apenas cidade/estado quando endereço é parcial", () => {
    render(
      <Footer
        shop={makeShop({
          address_city: "São Paulo",
          address_state: "SP",
        })}
      />
    );

    vi.runAllTimers();

    expect(screen.getByText("Sede")).toBeInTheDocument();
    expect(screen.getByText("São Paulo - SP")).toBeInTheDocument();
    expect(screen.queryByText(/•/)).not.toBeInTheDocument();
  });

  it("gera link wa.me quando há WhatsApp e não há social_whatsapp_url", () => {
    render(
      <Footer
        shop={makeShop({
          contact_whatsapp: "(31) 9 9999-8888",
        })}
      />
    );

    vi.runAllTimers();

    const wa = screen.getByRole("link", { name: "WhatsApp" });
    expect(wa).toHaveAttribute("href", "https://wa.me/5531999998888");
  });

  it("prioriza social_whatsapp_url quando fornecido", () => {
    render(
      <Footer
        shop={makeShop({
          contact_whatsapp: "31999998888",
          social_whatsapp_url: "https://wa.me/5511999999999?text=Oi",
        })}
      />
    );

    vi.runAllTimers();

    const wa = screen.getByRole("link", { name: "WhatsApp" });
    expect(wa).toHaveAttribute(
      "href",
      "https://wa.me/5511999999999?text=Oi"
    );
  });

  it("não renderiza botão de WhatsApp quando não há dados", () => {
    render(<Footer shop={makeShop()} />);

    vi.runAllTimers();

    expect(
      screen.queryByRole("link", { name: "WhatsApp" })
    ).not.toBeInTheDocument();
  });

  it("renderiza navegação com lista semântica", () => {
    render(<Footer shop={makeShop()} />);

    vi.runAllTimers();

    const heading = screen.getByText("Navegação");
    const container = heading.closest("div")!;
    const list = container.querySelector("ul");

    expect(list).toBeTruthy();
    expect(within(list!).getAllByRole("link").length).toBeGreaterThan(0);
  });
});
