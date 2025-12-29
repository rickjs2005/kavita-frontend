import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ProdutosPorCategoria from "@/components/products/ProdutosPorCategoria";

/* ------------------------------------------------------------------ */
/* Mocks                                                               */
/* ------------------------------------------------------------------ */

vi.mock("@/components/products/ProductCard", () => ({
  default: ({ product }: any) => (
    <div data-testid="product-card">{product.name}</div>
  ),
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserverMock;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const mockFetchJson = (payload: any, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    text: vi.fn().mockResolvedValue(JSON.stringify(payload)),
    statusText: ok ? "OK" : "Erro",
  } as any);
};

describe("ProdutosPorCategoria", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza produtos quando sucesso (positivo)", async () => {
    // Arrange
    mockFetchJson([
      { id: 1, name: "Ração Premium" },
      { id: 2, name: "Milho Selecionado" },
    ]);

    // Act
    render(<ProdutosPorCategoria categoria="ração" limit={5} />);

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId("product-card")).toHaveLength(2);
    });

    expect(screen.getByText("Ração Premium")).toBeInTheDocument();
    expect(screen.getByText("Milho Selecionado")).toBeInTheDocument();

    // URL vem com encodeURIComponent e inclui host base
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(
        `/api/products?category=${encodeURIComponent("ração")}`
      ),
      expect.objectContaining({
        cache: "no-store",
        // o componente passa AbortSignal
        signal: expect.any(Object),
      })
    );
  });

  it("respeita o limit (controle)", async () => {
    // Arrange
    mockFetchJson([
      { id: 1, name: "Produto 1" },
      { id: 2, name: "Produto 2" },
      { id: 3, name: "Produto 3" },
    ]);

    // Act
    render(<ProdutosPorCategoria categoria="teste" limit={2} />);

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId("product-card")).toHaveLength(2);
    });
  });

  it("renderiza vazio quando não há produtos (negativo)", async () => {
    // Arrange
    mockFetchJson([]);

    // Act
    render(<ProdutosPorCategoria categoria="vazia" />);

    // Assert
    expect(
      await screen.findByText(/sem produtos nessa categoria/i)
    ).toBeInTheDocument();
  });

  it("renderiza erro quando fetch retorna não-ok (negativo)", async () => {
    // Arrange
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      text: vi.fn().mockResolvedValue("Erro interno"),
      statusText: "Erro",
    } as any);

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    // Act
    render(<ProdutosPorCategoria categoria="erro" />);

    // Assert
    expect(
      await screen.findByText(/não foi possível carregar produtos/i)
    ).toBeInTheDocument();

    expect(warnSpy).toHaveBeenCalled();
  });

  it("renderiza carrossel com scroll horizontal (positivo)", async () => {
    // Arrange
    mockFetchJson(
      new Array(10).fill(0).map((_, i) => ({
        id: i + 1,
        name: `Produto ${i + 1}`,
      }))
    );

    // Act
    const { container } = render(<ProdutosPorCategoria categoria="overflow" />);

    // Assert
    await waitFor(() => {
      expect(screen.getAllByTestId("product-card").length).toBeGreaterThan(0);
    });

    // O componente não renderiza botões; ele usa overflow-x-auto (scroll)
    const scroller = container.querySelector("div.overflow-x-auto");
    expect(scroller).toBeTruthy();

    // Garante que é um “carrossel” (snap + smooth)
    expect(scroller).toHaveClass("snap-x");
    expect(scroller).toHaveClass("snap-mandatory");
    expect(scroller).toHaveClass("scroll-smooth");
  });

  it("não renderiza botões de navegação (controle)", async () => {
    // Arrange
    mockFetchJson([{ id: 1, name: "Produto 1" }]);

    // Act
    render(<ProdutosPorCategoria categoria="sem-setas" />);

    // Assert
    await screen.findByTestId("product-card");

    expect(
      screen.queryByRole("button", { name: /avançar produtos/i })
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /voltar produtos/i })
    ).not.toBeInTheDocument();
  });
});
