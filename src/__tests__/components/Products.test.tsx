import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Produtos } from "@/components/products/Products";

// Mock do api helper (não faz rede)
vi.mock("@/lib/api", () => ({
  api: vi.fn(),
}));

// Mock do ProductCard para evitar dependência do layout interno do card
vi.mock("@/components/products/ProductCard", () => ({
  default: ({ product }: { product: any }) => (
    <div data-testid="product-card">{product?.name ?? "sem-nome"}</div>
  ),
}));

// Importa o mock tipado após vi.mock
import { api } from "@/lib/api";

describe("Produtos (Products.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("chama api('/api/products') ao montar e renderiza ProductCard para cada produto (positivo)", async () => {
    (api as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 1, name: "Milho Premium" },
      { id: 2, name: "Ração Bovina" },
      { id: 3, name: "Suplemento Mineral" },
    ]);

    render(<Produtos />);

    // Semântica do título
    expect(
      screen.getByRole("heading", { name: /produtos/i, level: 1 })
    ).toBeInTheDocument();

    // Assert da chamada (AAA)
    await waitFor(() => {
      expect(api).toHaveBeenCalledTimes(1);
    });

    expect(api).toHaveBeenCalledWith("/api/products");

    // Renderiza um card por item
    const cards = await screen.findAllByTestId("product-card");
    expect(cards).toHaveLength(3);

    expect(screen.getByText("Milho Premium")).toBeInTheDocument();
    expect(screen.getByText("Ração Bovina")).toBeInTheDocument();
    expect(screen.getByText("Suplemento Mineral")).toBeInTheDocument();
  });

  it("quando api retorna array vazio, não renderiza cards (negativo/controle)", async () => {
    (api as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    render(<Produtos />);

    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));
    expect(api).toHaveBeenCalledWith("/api/products");

    expect(screen.queryAllByTestId("product-card")).toHaveLength(0);
  });

  it("quando api falha, loga erro e não renderiza cards (negativo)", async () => {
    const err = new Error("Falha na API");
    (api as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<Produtos />);

    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));

    // O componente faz console.error("Erro ao buscar produtos:", err)
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleSpy.mock.calls[0]?.[0]).toMatch(/erro ao buscar produtos/i);
    });

    expect(screen.queryAllByTestId("product-card")).toHaveLength(0);

    consoleSpy.mockRestore();
  });
});
