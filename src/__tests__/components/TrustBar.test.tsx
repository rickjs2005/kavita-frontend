import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TrustBar from "../../components/layout/TrustBar";

describe("TrustBar (src/components/layout/TrustBar.tsx)", () => {
  it("renderiza corretamente os três itens de confiança (positivo)", () => {
    // Arrange
    render(<TrustBar />);

    // Act + Assert (títulos)
    expect(screen.getByText("Pagamento Seguro")).toBeInTheDocument();
    expect(screen.getByText("Entrega Garantida")).toBeInTheDocument();
    expect(screen.getByText("Atendimento")).toBeInTheDocument();

    // Act + Assert (descrições)
    expect(screen.getByText("Pix · Cartão · Boleto")).toBeInTheDocument();
    expect(screen.getByText("Rastreio e seguro")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp e E-mail")).toBeInTheDocument();
  });

  it("renderiza exatamente três indicadores visuais de confiança (controle)", () => {
    // Arrange
    const { container } = render(<TrustBar />);

    // Act
    const icons = container.querySelectorAll("div.h-9.w-9.rounded-full");

    // Assert
    expect(icons.length).toBe(3);
  });

  it("mantém estrutura semântica básica estável (controle)", () => {
    // Arrange
    const { container } = render(<TrustBar />);

    // Act
    const wrappers = container.querySelectorAll("div.flex.items-center.gap-3");

    // Assert
    expect(wrappers.length).toBe(3);
  });

  it("não depende de props externas ou estado (negativo/controle)", () => {
    // Arrange + Act
    const { rerender } = render(<TrustBar />);
    rerender(<TrustBar />);

    // Assert
    expect(screen.getByText("Pagamento Seguro")).toBeInTheDocument();
    expect(screen.getByText("Entrega Garantida")).toBeInTheDocument();
    expect(screen.getByText("Atendimento")).toBeInTheDocument();
  });
});
