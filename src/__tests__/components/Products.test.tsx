import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Produtos } from "@/components/products/Products";

const mockGet = vi.fn();

// Mock do apiClient (não faz rede)
vi.mock("@/lib/apiClient", () => ({
  default: { get: (...args: any[]) => mockGet(...args) },
}));

// Mock do ProductCard para evitar dependência do layout interno do card
vi.mock("@/components/products/ProductCard", () => ({
  default: ({ product }: { product: any }) => (
    <div data-testid="product-card">{product?.name ?? "sem-nome"}</div>
  ),
}));

describe("Produtos (Products.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("chama apiClient.get('/api/products') ao montar e renderiza ProductCard para cada produto (positivo)", async () => {
    mockGet.mockResolvedValueOnce([
      { id: 1, name: "Milho Premium" },
      { id: 2, name: "Ração Bovina" },
      { id: 3, name: "Suplemento Mineral" },
    ]);

    render(<Produtos />);

    // Semântica do título
    expect(
      screen.getByRole("heading", { name: /produtos/i, level: 1 }),
    ).toBeInTheDocument();

    // Assert da chamada (AAA)
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(1);
    });

    expect(mockGet).toHaveBeenCalledWith("/api/products");

    // Renderiza um card por item
    const cards = await screen.findAllByTestId("product-card");
    expect(cards).toHaveLength(3);

    expect(screen.getByText("Milho Premium")).toBeInTheDocument();
    expect(screen.getByText("Ração Bovina")).toBeInTheDocument();
    expect(screen.getByText("Suplemento Mineral")).toBeInTheDocument();
  });

  it("quando apiClient.get retorna array vazio, não renderiza cards (negativo/controle)", async () => {
    mockGet.mockResolvedValueOnce([]);

    render(<Produtos />);

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    expect(mockGet).toHaveBeenCalledWith("/api/products");

    expect(screen.queryAllByTestId("product-card")).toHaveLength(0);
  });

  it("quando apiClient.get falha, loga erro e não renderiza cards (negativo)", async () => {
    const err = new Error("Falha na API");
    mockGet.mockRejectedValueOnce(err);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<Produtos />);

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    // O componente faz console.error("Erro ao buscar produtos:", err)
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0]?.[0]).toMatch(/erro ao buscar produtos/i);
    });

    expect(screen.queryAllByTestId("product-card")).toHaveLength(0);

    consoleSpy.mockRestore();
  });
});
