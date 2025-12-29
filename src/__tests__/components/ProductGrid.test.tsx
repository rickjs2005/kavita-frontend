import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ProductGrid } from "@/components/products/ProductGrid";

// next/link -> renderiza <a> para permitir assert de href
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [k: string]: any;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

type UiProduct = {
  id: number;
  name: string;
  description?: string;
  image: string;
  original_price: number | null;
  final_price: number | null;
  discount_percent: number | null;
  isPromo: boolean;
};

function makeProduct(overrides: Partial<UiProduct> = {}): UiProduct {
  return {
    id: 1,
    name: "Produto 1",
    image: "http://localhost:5000/uploads/p1.png",
    original_price: null,
    final_price: null,
    discount_percent: null,
    isPromo: false,
    ...overrides,
  };
}

function normalizeText(s: string) {
  return s.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ProductGrid", () => {
  it("renderiza skeleton de loading com 12 cards (positivo)", () => {
    const { container } = render(
      <ProductGrid loading={true} products={[]} empty={<div>Nenhum</div>} />
    );

    const cards = container.querySelectorAll("div.h-56");
    expect(cards).toHaveLength(12);

    expect(screen.queryByText(/nenhum/i)).not.toBeInTheDocument();
  });

  it("quando não há produtos, renderiza o empty (negativo)", () => {
    render(
      <ProductGrid
        loading={false}
        products={[]}
        empty={<div data-testid="empty">Sem resultados</div>}
      />
    );

    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.getByText(/sem resultados/i)).toBeInTheDocument();
  });

  it("renderiza grid com links e imagem para cada produto (positivo)", () => {
    const products: UiProduct[] = [
      makeProduct({ id: 10, name: "Milho Premium" }),
      makeProduct({ id: 11, name: "Ração Bovina" }),
    ];

    render(<ProductGrid loading={false} products={products} empty={<div />} />);

    const link1 = screen.getByRole("link", { name: /milho premium/i });
    const link2 = screen.getByRole("link", { name: /ração bovina/i });

    expect(link1).toHaveAttribute("href", "/produto/10");
    expect(link2).toHaveAttribute("href", "/produto/11");

    expect(screen.getByAltText("Milho Premium")).toBeInTheDocument();
    expect(screen.getByAltText("Ração Bovina")).toBeInTheDocument();
  });

  it("mostra badge 'Promo' quando isPromo=true (positivo)", () => {
    const products: UiProduct[] = [
      makeProduct({
        id: 20,
        name: "Produto Promo Flag",
        isPromo: true,
        final_price: 99.9,
      }),
    ];

    render(<ProductGrid loading={false} products={products} empty={<div />} />);

    // Badge
    expect(screen.getByText(/^promo$/i, { selector: "span" })).toBeInTheDocument();

    // Preço final: restringe a spans para não casar em <a>/<div>/<body>
    expect(
      screen.getByText((_, node) => {
        if (!node) return false;
        if (node.tagName.toLowerCase() !== "span") return false;
        return /R\$\s*99,90/i.test(normalizeText(node.textContent ?? ""));
      })
    ).toBeInTheDocument();
  });

  it("mostra badge 'Promo' quando há desconto por preço (hasDiscount) mesmo com isPromo=false (positivo)", () => {
    const products: UiProduct[] = [
      makeProduct({
        id: 21,
        name: "Produto com Desconto",
        isPromo: false,
        original_price: 200,
        final_price: 150,
      }),
    ];

    render(<ProductGrid loading={false} products={products} empty={<div />} />);

    // Escopa no card do produto (link tem accessible name = nome do produto)
    const cardLink = screen.getByRole("link", { name: /produto com desconto/i });
    const card = within(cardLink);

    expect(card.getByText(/^promo$/i, { selector: "span" })).toBeInTheDocument();

    // Preço final e original: restringe para spans (evita match no <a> e <div>)
    const finalPrice = card.getByText((_, node) => {
      if (!node) return false;
      if (node.tagName.toLowerCase() !== "span") return false;
      return /R\$\s*150,00/i.test(normalizeText(node.textContent ?? ""));
    });
    expect(finalPrice).toBeInTheDocument();

    const originalPrice = card.getByText((_, node) => {
      if (!node) return false;
      if (node.tagName.toLowerCase() !== "span") return false;
      return /R\$\s*200,00/i.test(normalizeText(node.textContent ?? ""));
    });
    expect(originalPrice).toBeInTheDocument();
    expect(originalPrice.className).toMatch(/line-through/);
  });

  it("renderiza apenas final_price quando não há desconto (final_price!=null e sem hasDiscount) (positivo)", () => {
    const products: UiProduct[] = [
      makeProduct({
        id: 22,
        name: "Produto Preço Único",
        isPromo: false,
        original_price: null,
        final_price: 123.45,
      }),
    ];

    render(<ProductGrid loading={false} products={products} empty={<div />} />);

    expect(screen.queryByText(/^promo$/i)).not.toBeInTheDocument();

    const cardLink = screen.getByRole("link", { name: /produto preço único/i });
    const card = within(cardLink);

    // Restringe a span e valida o texto normalizado
    expect(
      card.getByText((_, node) => {
        if (!node) return false;
        if (node.tagName.toLowerCase() !== "span") return false;
        return /R\$\s*123,45/i.test(normalizeText(node.textContent ?? ""));
      })
    ).toBeInTheDocument();
  });

  it("não renderiza bloco de preço quando final_price é null e não há hasDiscount (negativo)", () => {
    const products: UiProduct[] = [
      makeProduct({
        id: 23,
        name: "Produto Sem Preço",
        isPromo: false,
        original_price: null,
        final_price: null,
        discount_percent: null,
      }),
    ];

    render(<ProductGrid loading={false} products={products} empty={<div />} />);

    // como não tem preço, não deve existir spans com "R$"
    expect(
      screen.queryByText((_, node) => {
        if (!node) return false;
        if (node.tagName.toLowerCase() !== "span") return false;
        return /R\$/i.test(normalizeText(node.textContent ?? ""));
      })
    ).not.toBeInTheDocument();
  });

  it("renderiza '% OFF' somente quando discount_percent > 0 (positivo/negativo)", () => {
    const products: UiProduct[] = [
      makeProduct({
        id: 30,
        name: "Produto com Percentual",
        final_price: 90,
        discount_percent: 10,
      }),
      makeProduct({
        id: 31,
        name: "Produto sem Percentual",
        final_price: 90,
        discount_percent: 0,
      }),
      makeProduct({
        id: 32,
        name: "Produto sem Percentual Null",
        final_price: 90,
        discount_percent: null,
      }),
    ];

    render(<ProductGrid loading={false} products={products} empty={<div />} />);

    const cardLink = screen.getByRole("link", { name: /produto com percentual/i });
    const card = within(cardLink);

    // O componente quebra em "10" + "% OFF" com whitespace, então normaliza.
    // Restringe a <p> para não casar em nós ancestrais.
    expect(
      card.getByText((_, node) => {
        if (!node) return false;
        if (node.tagName.toLowerCase() !== "p") return false;
        return /10\s*% OFF/i.test(normalizeText(node.textContent ?? ""));
      })
    ).toBeInTheDocument();

    // negativos: não deve existir qualquer <p> com "% OFF" nos outros cards
    const offParagraphs = screen.queryAllByText((_, node) => {
      if (!node) return false;
      if (node.tagName.toLowerCase() !== "p") return false;
      return /% OFF/i.test(normalizeText(node.textContent ?? ""));
    });
    expect(offParagraphs).toHaveLength(1);
  });
});
