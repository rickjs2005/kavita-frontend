import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CartCar from "../../components/cart/CartCar";
import { installMockStorage, mockGlobalFetch } from "../testUtils";

/**
 * =========================
 * HOISTED MOCK STATE
 * =========================
 */
const hoisted = vi.hoisted(() => {
  return {
    router: {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    },
    axios: {
      post: vi.fn(),
    },
    toastFn: Object.assign(vi.fn(), {
      success: vi.fn(),
      error: vi.fn(),
    }),
    cart: {
      cartItems: [] as any[],
    },
    auth: {
      user: null as any,
      isAuthenticated: false,
    },
    closeCart: vi.fn(),
  };
});

/**
 * =========================
 * MODULE MOCKS (required)
 * =========================
 */
vi.mock("next/navigation", () => ({
  useRouter: () => hoisted.router,
  usePathname: () => "/",
  redirect: vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    post: hoisted.axios.post,
  },
}));

vi.mock("react-hot-toast", () => ({
  default: hoisted.toastFn,
}));

/**
 * IMPORTANT: precisa bater com imports reais do CartCar.tsx
 */
vi.mock("../../context/CartContext", () => ({
  useCart: () => hoisted.cart,
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => hoisted.auth,
}));

/**
 * Child components mocked to keep tests stable/focused.
 */
vi.mock("../../components/cart/CartItemCard", () => ({
  default: ({ item }: any) => (
    <li data-testid="cart-item">{item?.name ?? "Item"}</li>
  ),
}));

vi.mock("../../components/buttons/CustomButton", () => ({
  default: ({ label, onClick, isLoading, className }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={Boolean(isLoading)}
      className={className}
    >
      {label}
    </button>
  ),
}));

vi.mock("../../components/buttons/CloseButton", () => ({
  default: ({ onClose }: any) => (
    <button type="button" aria-label="Fechar carrinho" onClick={onClose}>
      X
    </button>
  ),
}));

function setCart(items: any[]) {
  hoisted.cart.cartItems = items;
}

function setAuthLogged(logged: boolean) {
  hoisted.auth.isAuthenticated = logged;
  hoisted.auth.user = logged ? { id: 123 } : null;
}

describe("CartCar", () => {
  let fetchMock: ReturnType<typeof mockGlobalFetch>;

  beforeEach(() => {
    vi.clearAllMocks();

    installMockStorage();

    hoisted.router.push = vi.fn();
    hoisted.router.replace = vi.fn();
    hoisted.router.prefetch = vi.fn();

    setCart([]);
    setAuthLogged(false);

    fetchMock = mockGlobalFetch();
    // retorno padrão para evitar "undefined.ok" durante efeitos de promoções
    fetchMock.mockResolvedValue({ ok: false } as any);

    hoisted.closeCart = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renderiza estado vazio (positivo/controle): mostra mensagem e não mostra footer", () => {
    // Arrange
    setCart([]);

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);

    // Assert
    const dialog = screen.getByRole("dialog", { name: /carrinho de compras/i });
    expect(dialog).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByText(/seu carrinho está vazio/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /finalizar compra/i })
    ).not.toBeInTheDocument();
  });

  it("aplica aria-hidden quando isCartOpen=false (negativo)", () => {
    // Arrange
    setCart([]);

    // Act
    render(<CartCar isCartOpen={false} closeCart={hoisted.closeCart} />);

    // Assert
    // Com aria-hidden=true, o accessible name pode ficar vazio no tree do RTL.
    // Então buscamos o dialog hidden sem filtrar por name e validamos aria-label manualmente.
    const dialog = screen.getByRole("dialog", { hidden: true });

    expect(dialog).toHaveAttribute("aria-hidden", "true");
    expect(dialog).toHaveAttribute("aria-label", "Carrinho de compras");
  });

  it("chama closeCart ao clicar no botão de fechar (positivo)", async () => {
    // Arrange
    setCart([{ id: 1, name: "Produto A", quantity: 1, price: 10 }]);

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);
    await userEvent.click(
      screen.getByRole("button", { name: /fechar carrinho/i })
    );

    // Assert
    expect(hoisted.closeCart).toHaveBeenCalledTimes(1);
  });

  it("renderiza itens e calcula subtotal usando promoção quando fetch retorna ok (positivo)", async () => {
    // Arrange
    setCart([
      { id: 10, name: "Milho", quantity: 2, price: 100 },
      { id: 20, name: "Ração", quantity: 1, price: 50 },
    ]);

    fetchMock.mockImplementation(async (url: any) => {
      const s = String(url);
      if (s.includes("/api/public/promocoes/10")) {
        return {
          ok: true,
          json: async () => ({ original_price: 100, final_price: 80 }),
        } as any;
      }
      if (s.includes("/api/public/promocoes/20")) {
        return { ok: false } as any;
      }
      return { ok: false } as any;
    });

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);

    // Assert (itens)
    expect(await screen.findAllByTestId("cart-item")).toHaveLength(2);
    expect(screen.getByText("Milho")).toBeInTheDocument();
    expect(screen.getByText("Ração")).toBeInTheDocument();

    // Footer: validar labels exatos e valores, evitando "Total" casar com "Subtotal"
    const subtotalLabel = await screen.findByText(/^Subtotal$/i);
    const footerEl = subtotalLabel.closest("footer");
    expect(footerEl).toBeTruthy();

    const footerWithin = within(footerEl as HTMLElement);

    expect(footerWithin.getByText(/^Subtotal$/i)).toBeInTheDocument();
    expect(footerWithin.getByText(/^Total$/i)).toBeInTheDocument();

    await waitFor(() => {
      const vals = footerWithin.getAllByText("R$ 210,00");
      expect(vals.length).toBeGreaterThanOrEqual(2);
    });

    expect(fetchMock).toHaveBeenCalled();
  });

  it("exibe warning de estoque quando quantity >= _stock (positivo)", async () => {
    // Arrange
    setCart([
      { id: 1, name: "Produto Limite", quantity: 2, price: 10, _stock: 2 },
    ]);

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);

    // Assert
    const warning = await screen.findByText(/atingiu o limite de estoque/i);
    expect(warning).toBeInTheDocument();
    // evita ambiguidade do nome aparecer no item e no aviso
    expect(warning.textContent?.toLowerCase()).toContain("produto limite");
  });

  it("applyDiscount: sem cupom -> toast.error (negativo)", async () => {
    // Arrange
    setCart([{ id: 1, name: "Item", quantity: 1, price: 10 }]);

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);
    await userEvent.click(screen.getByRole("button", { name: /aplicar/i }));

    // Assert
    expect(hoisted.toastFn.error).toHaveBeenCalledWith("Informe um cupom.");
    expect(hoisted.axios.post).not.toHaveBeenCalled();
  });

  it("applyDiscount: não logado -> toast.error e redireciona /login (negativo)", async () => {
    // Arrange
    setAuthLogged(false);
    setCart([{ id: 1, name: "Item", quantity: 1, price: 10 }]);

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);
    const input = screen.getByPlaceholderText(/cupom de desconto/i);
    await userEvent.type(input, "promo10");
    await userEvent.click(screen.getByRole("button", { name: /aplicar/i }));

    // Assert
    expect(hoisted.toastFn.error).toHaveBeenCalledWith(
      "Você precisa estar logado para aplicar um cupom."
    );
    expect(hoisted.router.push).toHaveBeenCalledWith("/login");
    expect(hoisted.axios.post).not.toHaveBeenCalled();
  });

  it("applyDiscount: subtotal 0 -> toast.error (negativo)", async () => {
    // Arrange
    setAuthLogged(true);

    // O footer (cupom) só aparece quando carrinho NÃO está vazio,
    // então simulamos subtotal 0 com price 0.
    setCart([{ id: 99, name: "Grátis", quantity: 1, price: 0 }]);

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);
    const input = screen.getByPlaceholderText(/cupom de desconto/i);
    await userEvent.type(input, "X");
    await userEvent.click(screen.getByRole("button", { name: /aplicar/i }));

    // Assert
    expect(hoisted.toastFn.error).toHaveBeenCalledWith("Seu carrinho está vazio.");
    expect(hoisted.axios.post).not.toHaveBeenCalled();
  });

  it("applyDiscount: sucesso -> chama axios com payload correto, mostra desconto e salva no localStorage (positivo)", async () => {
    // Arrange
    setAuthLogged(true);
    setCart([{ id: 1, name: "Item", quantity: 2, price: 50 }]); // subtotal=100

    hoisted.axios.post.mockResolvedValue({
      data: {
        success: true,
        desconto: 10,
        message: "Cupom aplicado com sucesso!",
      },
    });

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);
    const input = screen.getByPlaceholderText(/cupom de desconto/i);
    await userEvent.type(input, "cupom10");
    await userEvent.click(screen.getByRole("button", { name: /aplicar/i }));

    // Assert (axios)
    await waitFor(() => {
      expect(hoisted.axios.post).toHaveBeenCalledTimes(1);
    });

    const [url, body, cfg] = hoisted.axios.post.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/checkout\/preview-cupom$/);
    expect(body).toEqual({ codigo: "CUPOM10", total: 100 });
    expect(cfg).toEqual({ withCredentials: true });

    // Assert (toast + UI)
    expect(hoisted.toastFn.success).toHaveBeenCalledWith(
      "Cupom aplicado com sucesso!"
    );
    expect(await screen.findByText(/desconto \(cupom\)/i)).toBeInTheDocument();
    expect(screen.getByText("- R$ 10,00")).toBeInTheDocument();

    // Total = 90
    expect(screen.getByText("R$ 90,00")).toBeInTheDocument();

    // storage
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "kavita_current_coupon",
      "CUPOM10"
    );
  });

  it("applyDiscount: backend retorna success=false -> exibe erro e toast.error (negativo)", async () => {
    // Arrange
    setAuthLogged(true);
    setCart([{ id: 1, name: "Item", quantity: 1, price: 100 }]);

    hoisted.axios.post.mockResolvedValue({
      data: { success: false, message: "Cupom inválido" },
    });

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);
    const input = screen.getByPlaceholderText(/cupom de desconto/i);
    await userEvent.type(input, "invalid");
    await userEvent.click(screen.getByRole("button", { name: /aplicar/i }));

    // Assert
    await waitFor(() => {
      expect(hoisted.toastFn.error).toHaveBeenCalledWith("Cupom inválido");
    });
    expect(await screen.findByText("Cupom inválido")).toBeInTheDocument();
    expect(screen.queryByText(/desconto \(cupom\)/i)).not.toBeInTheDocument();
  });

  it("applyDiscount: erro (axios throw) -> usa mensagem do backend quando existir (negativo)", async () => {
    // Arrange
    setAuthLogged(true);
    setCart([{ id: 1, name: "Item", quantity: 1, price: 100 }]);

    hoisted.axios.post.mockRejectedValue({
      response: { data: { message: "Erro do servidor" } },
    });

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);
    const input = screen.getByPlaceholderText(/cupom de desconto/i);
    await userEvent.type(input, "cupom");
    await userEvent.click(screen.getByRole("button", { name: /aplicar/i }));

    // Assert
    await waitFor(() => {
      expect(hoisted.toastFn.error).toHaveBeenCalledWith("Erro do servidor");
    });
    expect(await screen.findByText("Erro do servidor")).toBeInTheDocument();
  });

  it("Finalizar Compra: carrinho com itens e não logado -> toast() e push /login (negativo)", async () => {
    // Arrange
    setAuthLogged(false);
    setCart([{ id: 1, name: "Item", quantity: 1, price: 10 }]);

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);
    await userEvent.click(
      screen.getByRole("button", { name: /finalizar compra/i })
    );

    // Assert
    expect(hoisted.toastFn).toHaveBeenCalledWith("Faça login para continuar.");
    expect(hoisted.router.push).toHaveBeenCalledWith("/login");
  });

  it("Finalizar Compra: carrinho com itens e logado -> push /checkout (positivo)", async () => {
    // Arrange
    setAuthLogged(true);
    setCart([{ id: 1, name: "Item", quantity: 1, price: 10 }]);

    // Act
    render(<CartCar isCartOpen={true} closeCart={hoisted.closeCart} />);
    await userEvent.click(
      screen.getByRole("button", { name: /finalizar compra/i })
    );

    // Assert
    expect(hoisted.router.push).toHaveBeenCalledWith("/checkout");
  });
});
