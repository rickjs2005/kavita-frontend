import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";

// Ajuste este import caso seu Footer esteja em outro caminho.
import Footer from "@/components/layout/Footer";

// next/link -> <a>
vi.mock("next/link", () => {
  return {
    default: ({
      href,
      children,
      ...props
    }: {
      href: string;
      children: React.ReactNode;
      [key: string]: unknown;
    }) => (
      <a href={String(href)} {...props}>
        {children}
      </a>
    ),
  };
});

describe("Footer (src/components/Footer.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (vi.isFakeTimers()) vi.useRealTimers();
  });

  it("renderiza marca, copy e CTA 'trabalhe conosco' no card do campo (positivo)", () => {
    // Arrange
    render(<Footer />);

    // Act
    const brand = screen.getByRole("heading", { name: "Kavita" });

    // Assert
    expect(brand).toBeInTheDocument();
    expect(
      screen.getByText(
        /Conectando você ao melhor da agropecuária com qualidade e tradição\./i
      )
    ).toBeInTheDocument();

    // Desambiguar: CTA dentro do bloco "É profissional do campo?"
    const cardTitle = screen.getByText(/É profissional do campo\?/i);
    const card = cardTitle.closest("div");
    expect(card).toBeTruthy();

    const cta = within(card as HTMLElement).getByRole("link", {
      name: /trabalhe conosco/i,
    });

    expect(cta).toHaveAttribute("href", "/trabalhe-conosco");
  });

  it("renderiza navegação com links esperados (positivo)", () => {
    // Arrange
    render(<Footer />);

    // Act
    const navTitle = screen.getByRole("heading", { name: /Navegação/i });

    // Assert
    expect(navTitle).toBeInTheDocument();

    // Escopa no bloco de navegação para evitar colisão com o link do card
    const navBlock = navTitle.closest("div");
    expect(navBlock).toBeTruthy();

    expect(
      within(navBlock as HTMLElement).getByRole("link", { name: "Home" })
    ).toHaveAttribute("href", "/");

    expect(
      within(navBlock as HTMLElement).getByRole("link", { name: "Serviços" })
    ).toHaveAttribute("href", "/servicos");

    expect(
      within(navBlock as HTMLElement).getByRole("link", { name: "Contato" })
    ).toHaveAttribute("href", "/contato");

    expect(
      within(navBlock as HTMLElement).getByRole("link", {
        name: /Prestação de serviços/i,
      })
    ).toHaveAttribute("href", "/servicos");

    // CTA da navegação (o texto tem capitalização "Trabalhe conosco")
    expect(
      within(navBlock as HTMLElement).getByRole("link", {
        name: /^Trabalhe conosco$/i,
      })
    ).toHaveAttribute("href", "/trabalhe-conosco");
  });

  it("renderiza informações de contato (positivo)", () => {
    // Arrange
    render(<Footer />);

    // Act
    const contatoTitle = screen.getByRole("heading", { name: /Contato/i });

    // Assert
    expect(contatoTitle).toBeInTheDocument();
    expect(screen.getByText(/\(31\)\s*99999-9999/)).toBeInTheDocument();
    expect(screen.getByText(/contato@kavita\.com\.br/i)).toBeInTheDocument();
  });

  it("renderiza links de redes sociais com a11y e hardening (positivo)", () => {
    // Arrange
    render(<Footer />);

    // Act
    const instagram = screen.getByRole("link", { name: "Instagram" });
    const whatsapp = screen.getByRole("link", { name: "WhatsApp" });

    // Assert
    expect(instagram).toHaveAttribute("href", "https://instagram.com");
    expect(instagram).toHaveAttribute("target", "_blank");
    expect(instagram).toHaveAttribute("rel", "noopener noreferrer");

    expect(whatsapp).toHaveAttribute("href", "https://wa.me/5531999999999");
    expect(whatsapp).toHaveAttribute("target", "_blank");
    expect(whatsapp).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("exibe o ano conforme o relógio do sistema (positivo) e mantém texto de copyright (controle)", () => {
    // Arrange
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-06-10T12:00:00.000Z"));

    // Act
    render(<Footer />);

    // Assert
    // Teste determinístico: o footer deve refletir o ano do sistema
    expect(
      screen.getByText(/©\s*2031\s*Kavita\s*-\s*Todos os direitos reservados\./i)
    ).toBeInTheDocument();
  });
});
