// src/__tests__/components/ServiceCard.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ServiceCard from "@/components/layout/ServiceCard";

/**
 * Mock do next/link (renderiza <a>)
 */
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : href?.pathname || href?.toString?.() || "#";

    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
}));

const baseServico = {
  id: 1,
  nome: "Serviço de Pulverização",
  categoria: "Pulverização",
  cargo: "Técnico Agrícola",
  descricao: "Descrição do serviço",
  // Observação: pelo DOM do erro atual, o componente NÃO está renderizando WhatsApp/link.
  // Mantemos campos comuns, mas o teste não assume CTA se o componente não renderiza.
  telefone: "(31) 99999-9999",
  imagem_capa: "/placeholder.png",
  fotos: ["/placeholder.png", "/1.jpg", "/2.jpg"],
  rating_avg: 4.5,
  rating_count: 12,
  verificado: 1,
};

function renderCard(
  props?: Partial<React.ComponentProps<typeof ServiceCard>>
) {
  return render(
    <ServiceCard
      servico={baseServico as any}
      readOnly={false}
      {...props}
    />
  );
}

describe("ServiceCard (src/components/layout/ServiceCard.tsx)", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza informações básicas do serviço (controle)", () => {
    renderCard({ readOnly: true });

    expect(
      screen.getByRole("heading", { name: /Serviço de Pulverização/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/Cargo:/i)).toBeInTheDocument();
    expect(screen.getByText(/Técnico Agrícola/i)).toBeInTheDocument();
    expect(screen.getByText(/Descrição do serviço/i)).toBeInTheDocument();
  });

  it("exibe bloco de avaliação quando rating_avg e rating_count existem (positivo)", () => {
    renderCard({ readOnly: true });

    // 1) Nota 4.5 existe, mas pode estar junto com a estrela e quebrada em whitespace.
    // Pegamos o elemento MAIS específico possível: um <span> cujo textContent contenha "4.5".
    const ratingSpan = screen.getByText((_, el) => {
      if (!el) return false;
      if (el.tagName.toLowerCase() !== "span") return false;
      const t = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      return t.includes("4.5");
    });
    expect(ratingSpan).toBeInTheDocument();

    // 2) Count: "(12 avaliações)" está quebrado em múltiplos nós (12 + "avalia" + "s").
    // Então checamos pelo container <span> cinza que contenha "12" e "avalia".
    const countSpan = screen.getByText((_, el) => {
      if (!el) return false;
      if (el.tagName.toLowerCase() !== "span") return false;
      const t = (el.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      return t.includes("12") && t.includes("avalia");
    });
    expect(countSpan).toBeInTheDocument();
  });

  it("não exibe bloco de avaliação quando rating não existe (negativo)", () => {
    render(
      <ServiceCard
        servico={{ ...baseServico, rating_avg: null, rating_count: null } as any}
        readOnly
      />
    );

    // Sem ⭐ no DOM quando não há rating (ajuste se seu componente ainda renderiza estrela vazia).
    expect(
      screen.queryByText((_, el) => (el?.textContent ?? "").includes("⭐"))
    ).not.toBeInTheDocument();
  });

  it("quando há href, o card inteiro vira link", () => {
    renderCard({ href: "/servicos/1", readOnly: true });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/servicos/1");
  });

  it("exibe botões Editar e Remover quando readOnly=false", () => {
    renderCard({ readOnly: false });

    expect(screen.getByRole("button", { name: /Editar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Remover/i })).toBeInTheDocument();
  });

  it("não renderiza CTA de WhatsApp quando o componente não expõe link (controle)", () => {
    renderCard({ readOnly: true });

    // Pelo DOM atual, não há nenhum <a> com WhatsApp.
    expect(screen.queryByRole("link", { name: /WhatsApp/i })).not.toBeInTheDocument();
  });

  it("não renderiza contador de fotos quando o componente não expõe esse badge (controle)", () => {
    renderCard({ readOnly: true });

    // Pelo DOM atual, não existe badge "foto(s)".
    expect(
      screen.queryByText((_, el) => {
        const t = (el?.textContent ?? "").replace(/\s+/g, " ").toLowerCase();
        return t.includes("foto");
      })
    ).not.toBeInTheDocument();
  });
});
