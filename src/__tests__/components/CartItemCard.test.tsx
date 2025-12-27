import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CartItemCard from "../../components/cart/CartItemCard";
import { installMockStorage, mockGlobalFetch } from "../testUtils";

/**
 * =========================
 * HOISTED MOCK STATE
 * =========================
 */
const hoisted = vi.hoisted(() => {
  return {
    cart: {
      removeFromCart: vi.fn(),
      updateQuantity: vi.fn(),
    },
  };
});

/**
 * =========================
 * MODULE MOCKS
 * =========================
 */
vi.mock("../../context/CartContext", () => ({
  useCart: () => hoisted.cart,
}));

vi.mock("next/image", () => ({
  default: (props: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} />
  ),
}));

vi.mock("../../components/buttons/CustomButton", () => ({
  default: ({ label, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

/**
 * =========================
 * BASE ITEM
 * =========================
 */
const baseItem = {
  id: 1,
  name: "Produto Teste",
  price: 100,
  quantity: 2,
  image: null,
};

describe("CartItemCard", () => {
  let fetchMock: ReturnType<typeof mockGlobalFetch>;

  beforeEach(() => {
    vi.clearAllMocks();
    installMockStorage();

    fetchMock = mockGlobalFetch();
    // padrão: sem promoção
    fetchMock.mockResolvedValue({ ok: false } as any);
  });

  it("renderiza nome, imagem placeholder e preço sem promoção (positivo)", async () => {
    // Arrange
    render(<CartItemCard item={baseItem as any} />);

    // Assert
    expect(screen.getByText("Produto Teste")).toBeInTheDocument();
    expect(screen.getByText("R$ 100,00")).toBeInTheDocument();

    const img = screen.getByRole("img", { name: /produto teste/i });
    expect(img).toBeInTheDocument();
  });

  it("busca promoção e renderiza preço com desconto quando fetch retorna ok (positivo)", async () => {
    // Arrange
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        original_price: 100,
        final_price: 80,
        discount_percent: 20,
      }),
    } as any);

    render(<CartItemCard item={baseItem as any} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("R$ 80,00")).toBeInTheDocument();
    });

    expect(screen.getByText("R$ 100,00")).toBeInTheDocument();
    expect(screen.getByText(/20% OFF/i)).toBeInTheDocument();
  });

  it("incrementa quantidade ao clicar em '+' (positivo)", async () => {
    // Arrange
    render(<CartItemCard item={baseItem as any} />);

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: /aumentar quantidade/i })
    );

    // Assert
    expect(hoisted.cart.updateQuantity).toHaveBeenCalledWith(1, 3);
  });

  it("decrementa quantidade ao clicar em '-' (positivo)", async () => {
    // Arrange
    render(<CartItemCard item={baseItem as any} />);

    // Act
    await userEvent.click(
      screen.getByRole("button", { name: /diminuir quantidade/i })
    );

    // Assert
    expect(hoisted.cart.updateQuantity).toHaveBeenCalledWith(1, 1);
  });

  it("desabilita botão '+' quando atinge o estoque máximo (positivo)", async () => {
    // Arrange
    render(
      <CartItemCard
        item={{
          ...baseItem,
          quantity: 5,
          _stock: 5,
        } as any}
      />
    );

    // Assert
    const plusBtn = screen.getByRole("button", {
      name: /aumentar quantidade/i,
    });

    expect(plusBtn).toBeDisabled();
    expect(
      screen.getByText(/limite de estoque atingido/i)
    ).toBeInTheDocument();
  });

  it("mostra estoque restante quando ainda há unidades disponíveis (positivo)", () => {
    // Arrange
    render(
      <CartItemCard
        item={{
          ...baseItem,
          quantity: 2,
          _stock: 10,
        } as any}
      />
    );

    // Assert
    expect(screen.getByText(/em estoque: 8/i)).toBeInTheDocument();
  });

  it("chama removeFromCart ao clicar em 'Remover' (positivo)", async () => {
    // Arrange
    render(<CartItemCard item={baseItem as any} />);

    // Act
    await userEvent.click(screen.getByRole("button", { name: /remover/i }));

    // Assert
    expect(hoisted.cart.removeFromCart).toHaveBeenCalledWith(1);
  });

  it("não quebra se fetch de promoção falhar (negativo)", async () => {
    // Arrange
    fetchMock.mockRejectedValue(new Error("network error"));

    render(<CartItemCard item={baseItem as any} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText("R$ 100,00")).toBeInTheDocument();
    });
  });
});
