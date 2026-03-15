import React, { useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { installMockStorage, flushMicrotasks } from "../testUtils";

/* -------------------------------------------------------------------------- */
/*                               HOISTED MOCKS                                */
/* -------------------------------------------------------------------------- */

const hoisted = vi.hoisted(() => {
  const toast = vi.fn() as any;
  toast.success = vi.fn();
  toast.error = vi.fn();

  return {
    toast,
    // CartContext agora usa apiClient diretamente (não axios)
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      del: vi.fn(),
    },
    handleApiError: vi.fn(),
    state: {
      pathname: "/",
      user: null as null | { id: number },
    },
  };
});

/* --------------------------------- Mocks --------------------------------- */

vi.mock("react-hot-toast", () => ({
  default: hoisted.toast,
}));

vi.mock("@/lib/apiClient", () => ({
  default: hoisted.apiClient,
  apiClient: hoisted.apiClient,
}));

vi.mock("@/lib/handleApiError", () => ({
  handleApiError: (e: unknown, opts: any) => hoisted.handleApiError(e, opts),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: hoisted.state.user }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => hoisted.state.pathname,
  redirect: vi.fn(),
}));

/* -------------------------------------------------------------------------- */
/*                        Lazy import do módulo sob teste                      */
/* -------------------------------------------------------------------------- */

type CartModule = typeof import("@/context/CartContext");
let CartProvider: CartModule["CartProvider"];
let useCart: CartModule["useCart"];

async function loadCartModule() {
  vi.resetModules();
  const mod = await import("@/context/CartContext");
  CartProvider = mod.CartProvider;
  useCart = mod.useCart;
}

/* -------------------------------------------------------------------------- */
/*                                Test Harness                                */
/* -------------------------------------------------------------------------- */

function Wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

function TestConsumer() {
  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    syncStock,
    clearCart,
    cartTotal,
    isCartOpen,
    openCart,
    closeCart,
  } = useCart();

  const [lastResult, setLastResult] = useState<string>("");

  const product = {
    id: 10,
    name: "Milho Premium",
    price: 12.5,
    image: null,
    quantity: 3, // estoque
  } as any;

  return (
    <div>
      <div data-testid="open">{isCartOpen ? "open" : "closed"}</div>
      <div data-testid="count">{cartItems.length}</div>
      <div data-testid="total">{String(cartTotal)}</div>
      <div data-testid="qty">{cartItems[0]?.quantity ?? ""}</div>
      <div data-testid="stock">{(cartItems[0] as any)?._stock ?? ""}</div>
      <div data-testid="lastResult">{lastResult}</div>

      <button onClick={() => openCart()}>open</button>
      <button onClick={() => closeCart()}>close</button>

      <button
        onClick={() => {
          const r = addToCart(product, 1);
          setLastResult(JSON.stringify(r));
        }}
      >
        add1
      </button>

      <button
        onClick={() => {
          const r = addToCart(product, 10);
          setLastResult(JSON.stringify(r));
        }}
      >
        add10
      </button>

      <button onClick={() => updateQuantity(10, 99)}>setQty99</button>
      <button onClick={() => updateQuantity(10, 0)}>setQty0</button>
      <button onClick={() => removeFromCart(10)}>remove</button>
      <button onClick={() => syncStock(10, 0)}>stock0</button>
      <button onClick={() => syncStock(10, 2)}>stock2</button>
      <button onClick={() => clearCart()}>clear</button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

describe("CartContext (CartProvider/useCart)", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };

    hoisted.state.pathname = "/";
    hoisted.state.user = null;

    hoisted.apiClient.get.mockReset();
    hoisted.apiClient.post.mockReset();
    hoisted.apiClient.patch.mockReset();
    hoisted.apiClient.del.mockReset();

    hoisted.toast.mockReset();
    hoisted.toast.success.mockReset();
    hoisted.toast.error.mockReset();

    hoisted.handleApiError.mockReset();

    installMockStorage();

    await loadCartModule();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("useCart: lança erro se usado fora de CartProvider", () => {
    function Bad() {
      useCart();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(
      /useCart deve ser usado dentro de CartProvider/i,
    );
  });

  it("visitante: addToCart adiciona item (estado) e NÃO chama API", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    expect(screen.getByTestId("count").textContent).toBe("0");

    await user.click(screen.getByRole("button", { name: "add1" }));

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );
    expect(screen.getByTestId("qty").textContent).toBe("1");
    expect(screen.getByTestId("stock").textContent).toBe("3");

    expect(hoisted.apiClient.post).not.toHaveBeenCalled();
  });

  it("visitante: com estoque 0, não adiciona item (estado permanece vazio)", async () => {
    const user = userEvent.setup();

    function ConsumerStock0() {
      const { addToCart, cartItems } = useCart();
      const [r, setR] = useState<any>(null);
      const product0 = {
        id: 77,
        name: "Produto Zero",
        price: 10,
        quantity: 0,
      } as any;

      return (
        <div>
          <div data-testid="count">{cartItems.length}</div>
          <div data-testid="res">{r ? JSON.stringify(r) : ""}</div>
          <button
            onClick={() => {
              const rr = addToCart(product0, 1);
              setR(rr);
            }}
          >
            add
          </button>
        </div>
      );
    }

    render(
      <Wrapper>
        <ConsumerStock0 />
      </Wrapper>,
    );

    await user.click(screen.getByRole("button", { name: "add" }));

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0"),
    );
  });

  it("visitante: ao tentar ultrapassar estoque, quantidade fica clampada no máximo do stock", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await user.click(screen.getByRole("button", { name: "add1" }));
    await waitFor(() =>
      expect(screen.getByTestId("qty").textContent).toBe("1"),
    );

    await user.click(screen.getByRole("button", { name: "add10" }));

    await waitFor(() =>
      expect(screen.getByTestId("qty").textContent).toBe("3"),
    );
  });

  it("efeito: fecha automaticamente quando carrinho fica vazio (abrindo manualmente antes)", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await user.click(screen.getByRole("button", { name: "add1" }));
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );

    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByTestId("open").textContent).toBe("open");

    await user.click(screen.getByRole("button", { name: "remove" }));

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0"),
    );
    await waitFor(() =>
      expect(screen.getByTestId("open").textContent).toBe("closed"),
    );
  });

  it("pathname /admin: não chama API e carrega do localStorage (logado)", async () => {
    hoisted.state.pathname = "/admin/produtos";
    hoisted.state.user = { id: 1 };

    await loadCartModule();
    installMockStorage();

    localStorage.setItem(
      "cartItems_1",
      JSON.stringify([
        { id: 10, name: "X", price: 2, quantity: 2, image: null, _stock: 5 },
      ]),
    );

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    expect(hoisted.apiClient.get).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );
    expect(screen.getByTestId("qty").textContent).toBe("2");
    expect(screen.getByTestId("stock").textContent).toBe("5");
  });

  it("logado: GET /api/cart normaliza quantidade/stock e renderiza", async () => {
    hoisted.state.pathname = "/";
    hoisted.state.user = { id: 7 };

    // apiClient.get retorna dados diretamente (sem wrapper .data)
    hoisted.apiClient.get.mockResolvedValueOnce({
      items: [
        {
          produto_id: 10,
          nome: "Milho API",
          valor_unitario: "12.5", // string coercida para number pelo schema
          quantidade: "1",
          stock: "3",
          image: null,
        },
      ],
    });

    await loadCartModule();
    installMockStorage();

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitFor(() => expect(hoisted.apiClient.get).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );

    expect(screen.getByTestId("qty").textContent).toBe("1");
    expect(screen.getByTestId("stock").textContent).toBe("3");
  });

  it("logado: item com valor_unitario=0 é descartado pelo schema (não polui state)", async () => {
    hoisted.state.pathname = "/";
    hoisted.state.user = { id: 7 };

    hoisted.apiClient.get.mockResolvedValueOnce({
      items: [
        {
          produto_id: 10,
          nome: "Produto Zerado",
          valor_unitario: 0, // schema rejeita: não é positivo
          quantidade: 1,
        },
        {
          produto_id: 20,
          nome: "Produto Válido",
          valor_unitario: 9.99,
          quantidade: 1,
        },
      ],
    });

    await loadCartModule();
    installMockStorage();

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitFor(() => expect(hoisted.apiClient.get).toHaveBeenCalledTimes(1));

    // Apenas o item com preço válido deve aparecer
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );
  });

  it("logado: falha no GET /api/cart chama handleApiError e faz fallback para cache local", async () => {
    hoisted.state.pathname = "/";
    hoisted.state.user = { id: 5 };

    await loadCartModule();
    installMockStorage();

    localStorage.setItem(
      "cartItems_5",
      JSON.stringify([
        {
          id: 10,
          name: "Cache",
          price: 1,
          quantity: 2,
          image: null,
          _stock: 9,
        },
      ]),
    );

    hoisted.apiClient.get.mockRejectedValueOnce(new Error("boom"));

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitFor(() =>
      expect(hoisted.handleApiError).toHaveBeenCalledTimes(1),
    );
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );
    expect(screen.getByTestId("qty").textContent).toBe("2");
    expect(screen.getByTestId("stock").textContent).toBe("9");
  });

  it("logado: addToCart faz POST /api/cart/items e, em 409 STOCK_LIMIT, refaz GET", async () => {
    const user = userEvent.setup();

    hoisted.state.pathname = "/";
    hoisted.state.user = { id: 9 };

    // GET inicial retorna vazio
    hoisted.apiClient.get.mockResolvedValueOnce({ items: [] });

    // POST falha com 409 STOCK_LIMIT (formato ApiError)
    const stockErr = Object.assign(new Error("STOCK_LIMIT"), {
      name: "ApiError",
      status: 409,
      code: "STOCK_LIMIT",
    });
    hoisted.apiClient.post.mockRejectedValueOnce(stockErr);

    // GET refetch retorna item com estoque correto
    hoisted.apiClient.get.mockResolvedValueOnce({
      items: [
        {
          produto_id: 10,
          nome: "Servidor",
          valor_unitario: 12.5,
          quantidade: 3,
          stock: 3,
        },
      ],
    });

    await loadCartModule();
    installMockStorage();

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitFor(() => expect(hoisted.apiClient.get).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: "add1" }));

    expect(hoisted.apiClient.post).toHaveBeenCalled();

    await flushMicrotasks();
    await waitFor(() => expect(hoisted.apiClient.get).toHaveBeenCalledTimes(2));
  });

  it("logado: updateQuantity clampa para o estoque no estado (independente de toast)", async () => {
    const user = userEvent.setup();

    hoisted.state.pathname = "/";
    hoisted.state.user = { id: 11 };

    hoisted.apiClient.get.mockResolvedValueOnce({
      items: [
        {
          produto_id: 10,
          nome: "A",
          valor_unitario: 10,
          quantidade: 1,
          stock: 2,
        },
      ],
    });

    hoisted.apiClient.patch.mockResolvedValueOnce({ ok: true });

    await loadCartModule();
    installMockStorage();

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );

    await user.click(screen.getByRole("button", { name: "setQty99" }));

    await waitFor(() =>
      expect(screen.getByTestId("qty").textContent).toBe("2"),
    );
  });

  it("logado: updateQuantity para 0 remove item do estado", async () => {
    const user = userEvent.setup();

    hoisted.state.pathname = "/";
    hoisted.state.user = { id: 12 };

    hoisted.apiClient.get.mockResolvedValueOnce({
      items: [
        {
          produto_id: 10,
          nome: "A",
          valor_unitario: 10,
          quantidade: 1,
          stock: 0,
        },
      ],
    });

    hoisted.apiClient.del.mockResolvedValueOnce({ ok: true });

    await loadCartModule();
    installMockStorage();

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );

    await user.click(screen.getByRole("button", { name: "setQty0" }));

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0"),
    );
  });

  it("syncStock: estoque 0 remove item; reduzir estoque clampa qty no estado", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await user.click(screen.getByRole("button", { name: "add1" }));
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );

    await user.click(screen.getByRole("button", { name: "stock0" }));
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0"),
    );

    await user.click(screen.getByRole("button", { name: "add1" }));
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );

    await user.click(screen.getByRole("button", { name: "add10" }));
    await waitFor(() =>
      expect(screen.getByTestId("qty").textContent).toBe("3"),
    );

    await user.click(screen.getByRole("button", { name: "stock2" }));
    await waitFor(() =>
      expect(screen.getByTestId("qty").textContent).toBe("2"),
    );
  });

  it("clearCart: zera itens, fecha carrinho e (logado) faz DELETE /api/cart", async () => {
    const user = userEvent.setup();

    hoisted.state.pathname = "/";
    hoisted.state.user = { id: 33 };

    hoisted.apiClient.get.mockResolvedValueOnce({ items: [] });
    hoisted.apiClient.post.mockResolvedValueOnce({ ok: true });
    hoisted.apiClient.del.mockResolvedValueOnce({ ok: true });

    await loadCartModule();
    const { local } = installMockStorage();

    render(
      <Wrapper>
        <TestConsumer />
      </Wrapper>,
    );

    await waitFor(() => expect(hoisted.apiClient.get).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole("button", { name: "add1" }));
    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("1"),
    );

    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByTestId("open").textContent).toBe("open");

    await user.click(screen.getByRole("button", { name: "clear" }));

    await waitFor(() =>
      expect(screen.getByTestId("count").textContent).toBe("0"),
    );
    await waitFor(() =>
      expect(screen.getByTestId("open").textContent).toBe("closed"),
    );

    expect(local.storage.removeItem).toHaveBeenCalledWith("cartItems_33");

    expect(hoisted.apiClient.del).toHaveBeenCalledWith("/api/cart");

    expect(hoisted.toast).toHaveBeenCalledWith("Carrinho limpo.");
  });
});
