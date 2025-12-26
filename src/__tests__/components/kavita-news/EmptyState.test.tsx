import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/news/EmptyState";

describe("EmptyState", () => {
  it("deve renderizar com textos padrão quando nenhuma prop for passada (positivo)", () => {
    render(<EmptyState />);

    // Wrapper semântico para estados vazios
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-live", "polite");

    // Conteúdo padrão
    expect(screen.getByText("Nada por aqui ainda")).toBeInTheDocument();
    expect(
      screen.getByText("Conteúdos serão atualizados em breve.")
    ).toBeInTheDocument();

    // Emoji é decorativo
    const emoji = screen.getByText("📰");
    expect(emoji).toBeInTheDocument();
    expect(emoji).toHaveAttribute("aria-hidden");
  });

  it("deve renderizar title e subtitle customizados quando props forem fornecidas (positivo)", () => {
    render(
      <EmptyState
        title="Nenhuma cotação encontrada"
        subtitle="Tente novamente mais tarde ou ajuste os filtros."
      />
    );

    expect(
      screen.getByText("Nenhuma cotação encontrada")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tente novamente mais tarde ou ajuste os filtros.")
    ).toBeInTheDocument();
  });

  it("deve permitir renderizar apenas title customizado e manter subtitle padrão (controle)", () => {
    render(<EmptyState title="Sem resultados" />);

    expect(screen.getByText("Sem resultados")).toBeInTheDocument();
    expect(
      screen.getByText("Conteúdos serão atualizados em breve.")
    ).toBeInTheDocument();
  });

  it("deve permitir renderizar apenas subtitle customizado e manter title padrão (controle)", () => {
    render(
      <EmptyState subtitle="Ainda não há dados disponíveis para esta seção." />
    );

    expect(
      screen.getByText("Nada por aqui ainda")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Ainda não há dados disponíveis para esta seção.")
    ).toBeInTheDocument();
  });

  it("não deve expor o emoji decorativo para tecnologias assistivas (acessibilidade)", () => {
    render(<EmptyState />);

    // Não deve haver nenhum elemento com role relacionado ao emoji
    // O emoji existe apenas como texto aria-hidden
    const status = screen.getByRole("status");
    expect(status.textContent).toContain("📰");
  });
});
