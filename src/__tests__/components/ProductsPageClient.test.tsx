import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ProductsPageClient from "@/components/products/ProductsPageClient";

/* ------------------------------------------------------------------ */
/* Mocks (sem rede / sem dependência de layout interno)                */
/* ------------------------------------------------------------------ */

vi.mock("@/hooks/useFetchProducts", () => ({
  useFetchProducts: vi.fn(),
}));

vi.mock("@/context/CartContext", () => ({
  useCart: vi.fn(),
}));

vi.mock("@/components/products/ProductCard", () => ({
  default: ({ product }: { product: any }) => (
    <div data-testid="product-card">{product?.name ?? "sem-nome"}</div>
  ),
}));

vi.mock("@/components/cart/CartCar", () => ({
  default: ({ isCartOpen }: { isCartOpen: boolean }) => (
    <div data-testid="cart-car">{isCartOpen ? "Carrinho aberto" : "Carrinho fechado"}</div>
  ),
}));

import { useFetchProducts } from "@/hooks/useFetchProducts";
import { useCart } from "@/context/CartContext";

describe("ProductsPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza estado de loading quando loading=true (positivo)", () => {
    // Arrange
    vi.mocked(useFetchProducts).mockReturnValue({
      data: [],
      loading: true,
      error: null,
    } as any);

    vi.mocked(useCart).mockReturnValue({
      isCartOpen: false,
      closeCart: vi.fn(),
    } as any);

    // Act
    render(<ProductsPageClient />);

    // Assert
    expect(screen.getByText(/carregando produtos/i)).toBeInTheDocument();
    expect(screen.queryByTestId("product-card")).not.toBeInTheDocument();
  });

  it("renderiza mensagem de erro quando error=true (negativo)", () => {
    // Arrange
    vi.mocked(useFetchProducts).mockReturnValue({
      data: [],
      loading: false,
      error: true,
    } as any);

    vi.mocked(useCart).mockReturnValue({
      isCartOpen: false,
      closeCart: vi.fn(),
    } as any);

    // Act
    render(<ProductsPageClient />);

    // Assert
    expect(
      screen.getByText(/não foi possível carregar os produtos/i)
    ).toBeInTheDocument();

    expect(screen.queryByTestId("product-card")).not.toBeInTheDocument();
  });

  it("renderiza mensagem de vazio quando não há produtos (negativo)", () => {
    // Arrange
    vi.mocked(useFetchProducts).mockReturnValue({
      data: [],
      loading: false,
      error: null,
    } as any);

    vi.mocked(useCart).mockReturnValue({
      isCartOpen: false,
      closeCart: vi.fn(),
    } as any);

    // Act
    render(<ProductsPageClient />);

    // Assert
    expect(screen.getByText(/nenhum produto encontrado/i)).toBeInTheDocument();
    expect(screen.queryByTestId("product-card")).not.toBeInTheDocument();
  });

  it("renderiza ProductCard para cada produto quando sucesso (positivo)", () => {
    // Arrange
    vi.mocked(useFetchProducts).mockReturnValue({
      data: [
        { id: 1, name: "Milho Premium" },
        { id: 2, name: "Ração Bovina" },
      ],
      loading: false,
      error: null,
    } as any);

    vi.mocked(useCart).mockReturnValue({
      isCartOpen: false,
      closeCart: vi.fn(),
    } as any);

    // Act
    render(<ProductsPageClient />);

    // Assert
    const cards = screen.getAllByTestId("product-card");
    expect(cards).toHaveLength(2);

    expect(screen.getByText("Milho Premium")).toBeInTheDocument();
    expect(screen.getByText("Ração Bovina")).toBeInTheDocument();
  });

  it("renderiza CartCar e reflete estado do carrinho (positivo)", () => {
    // Arrange
    vi.mocked(useFetchProducts).mockReturnValue({
      data: [{ id: 1, name: "Produto Teste" }],
      loading: false,
      error: null,
    } as any);

    vi.mocked(useCart).mockReturnValue({
      isCartOpen: true,
      closeCart: vi.fn(),
    } as any);

    // Act
    render(<ProductsPageClient />);

    // Assert
    expect(screen.getByTestId("cart-car")).toBeInTheDocument();
    expect(screen.getByText(/carrinho aberto/i)).toBeInTheDocument();
  });
});
