import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionHeader } from "@/components/news/SectionHeader";

// Mock de next/link para jsdom
vi.mock("next/link", () => {
  return {
    default: ({
      href,
      children,
      ...props
    }: {
      href: string;
      children: React.ReactNode;
      [key: string]: any;
    }) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

describe("SectionHeader", () => {
  it("deve renderizar o título corretamente (positivo)", () => {
    render(<SectionHeader title="Clima" />);

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Clima",
    });

    expect(heading).toBeInTheDocument();
  });

  it("deve renderizar subtitle quando fornecido (positivo)", () => {
    render(
      <SectionHeader
        title="Cotações"
        subtitle="Preços atualizados diariamente."
      />
    );

    expect(
      screen.getByText("Preços atualizados diariamente.")
    ).toBeInTheDocument();
  });

  it("não deve renderizar subtitle quando não fornecido (negativo)", () => {
    render(<SectionHeader title="Notícias" />);

    expect(
      screen.queryByText("Preços atualizados diariamente.")
    ).not.toBeInTheDocument();
  });

  it("deve renderizar link de ação quando href for fornecido (positivo)", () => {
    render(
      <SectionHeader
        title="Posts"
        href="/news/posts"
        actionLabel="Ver todos"
      />
    );

    const link = screen.getByRole("link", {
      name: "Ver todos",
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/news/posts");
  });

  it("deve usar actionLabel padrão 'Ver mais' quando não fornecido (controle)", () => {
    render(
      <SectionHeader
        title="Clima"
        href="/news/clima"
      />
    );

    const link = screen.getByRole("link", {
      name: "Ver mais",
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/news/clima");
  });

  it("não deve renderizar link quando href não for fornecido (negativo)", () => {
    render(<SectionHeader title="Cotações" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("deve renderizar elemento visual decorativo com aria-hidden (acessibilidade)", () => {
    render(<SectionHeader title="Agro" />);

    // A barra verde é puramente decorativa
    const decorative = screen.getByRole("heading", { name: "Agro" })
      .previousSibling;

    // Garante que existe um elemento com aria-hidden no header
    const hiddenEls = document.querySelectorAll("[aria-hidden]");
    expect(hiddenEls.length).toBeGreaterThan(0);
  });

  it("deve manter estrutura semântica estável (controle)", () => {
    render(
      <SectionHeader
        title="Economia Rural"
        subtitle="Análises e dados do agronegócio."
        href="/news/economia"
      />
    );

    expect(
      screen.getByRole("heading", { name: "Economia Rural" })
    ).toBeInTheDocument();

    expect(
      screen.getByText("Análises e dados do agronegócio.")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "Ver mais" })
    ).toBeInTheDocument();
  });
});
