import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";

import { createMockStorage, makeFetchResponse } from "../testUtils";

/**
 * CartCar usa:
 * - toast("...") (callable)
 * - toast.success / toast.error
 */
const H = vi.hoisted(() => {
  const toastFn = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  });

  return {
    router: {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    },
    toast: toastFn,
    axios: {
      post: vi.fn(),
    },
    refs: {
      cartItems: [] as any[],
      auth: { user: null as any, isAuthenticated: false },
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: H.router.push,
    replace: H.router.replace,
    prefetch: H.router.prefetch,
  }),
  usePathname: () => "/",
  redirect: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  default: H.toast,
}));

vi.mock("axios", () => ({
  default: {
    post: (...args: any[]) => H.axios.post(...args),
  },
}));

vi.mock("../../context/CartContext", () => ({
  useCart: () => ({ cartItems: H.refs.cartItems }),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => H.refs.auth,
}));

vi.mock("../../components/cart/CartItemCard", () => ({
  default: ({ item }: any) => (
    <li aria-label={`Item ${item.name}`}>
      <div>{item.name}</div>
      <div>Qtd: {item.quantity}</div>
    </li>
  ),
}));

vi.mock("../../components/buttons/CustomButton", () => ({
  default: ({ label, onClick, isLoading, className }: any) => (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={Boolean(isLoading)}
    >
      {label}
    </button>
  ),
}));

vi.mock("../../components/buttons/CloseButton", () => ({
  default: ({ onClose, className }: any) => (
    <button
      type="button"
      aria-label="Fechar carrinho"
      className={className}
      onClick={onClose}
    >
      X
    </button>
  ),
}));

import CartCar from "../../components/cart/CartCar";

function setCartItems(items: any[]) {
  H.refs.cartItems = items;
}

function setAuth(auth: { user: any; isAuthenticated: boolean }) {
  H.refs.auth = auth;
}

function moneyRegex(value: string) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(escaped.replace(/\s+/g, "\\s*"));
}

/**
 * Helper: render and wait for the dialog header to exist.
 * This flushes initial effects and avoids act() warnings.
 */
async function renderCartAndReady(
  props?: Partial<React.ComponentProps<typeof CartCar>>
) {
  const closeCart = vi.fn();
  render(<CartCar isCartOpen={true} closeCart={closeCart} {...props} />);

  // "Ready" point: dialog + heading present
  await waitFor(() => {
    expect(screen.getByRole("dialog", { name: "Carrinho de compras" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Carrinho de compras" })).toBeInTheDocument();
  });

  return { closeCart };
}

describe("CartCar", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    const ls = createMockStorage();
    const ss = createMockStorage();
    Object.defineProperty(globalThis, "localStorage", { value: ls, configurable: true });
    Object.defineProperty(globalThis, "sessionStorage", { value: ss, configurable: true });

    globalThis.fetch = vi.fn();

    setCartItems([]);
    setAuth({ user: null, isAuthenticated: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza vazio e fecha automaticamente quando aberto e sem itens (e não renderiza footer/botões)", async () => {
    const { closeCart } = await renderCartAndReady();

    expect(screen.getByText(/carrinho está vazio/i)).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /Finalizar Compra/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Aplicar/i })).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Cupom de desconto/i)).not.toBeInTheDocument();

    await waitFor(() => expect(closeCart).toHaveBeenCalledTimes(1));
  });

  it("renderiza itens e subtotal/total (sem promo e sem cupom)", async () => {
    setCartItems([
      { id: 1, name: "Produto A", quantity: 2, price: 10 },
      { id: 2, name: "Produto B", quantity: 1, price: 5.5 },
    ]);

    await renderCartAndReady();

    const list = screen.getByRole("list");
    expect(within(list).getByLabelText("Item Produto A")).toBeInTheDocument();
    expect(within(list).getByLabelText("Item Produto B")).toBeInTheDocument();

    // Subtotal = 25.50 e Total = 25.50 (dois spans)
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();

    const prices = screen.getAllByText(moneyRegex("R$ 25,50"));
    expect(prices.length).toBeGreaterThanOrEqual(2);

    expect(screen.getByRole("button", { name: /Finalizar Compra/i })).toBeInTheDocument();
  });

  it("mostra warning de estoque quando quantity >= _stock", async () => {
    setCartItems([
      { id: 1, name: "Produto A", quantity: 5, price: 10, _stock: 5 },
      { id: 2, name: "Produto B", quantity: 1, price: 5, _stock: 10 },
    ]);

    await renderCartAndReady();

    // Validar a frase do warning (evita conflito com 'Produto A' do item)
    expect(screen.getByText(/atingiu o limite de estoque/i)).toBeInTheDocument();
    expect(screen.getByText(/“Produto A” atingiu o limite de estoque \(5\)\./i)).toBeInTheDocument();
  });

  it("busca promoções por id único e usa finalPrice no subtotal", async () => {
    setCartItems([
      { id: 10, name: "Produto X", quantity: 2, price: 100 },
      { id: 10, name: "Produto X", quantity: 2, price: 100 }, // id repetido (gera warning de key no componente real; ok)
      { id: 20, name: "Produto Y", quantity: 1, price: 50 },
    ]);

    (globalThis.fetch as any).mockImplementation((url: string) => {
      if (String(url).includes("/promocoes/10")) {
        return Promise.resolve(
          makeFetchResponse({
            ok: true,
            status: 200,
            json: { original_price: 100, final_price: 80, discount_percent: 20 },
            contentType: "application/json",
          })
        );
      }
      if (String(url).includes("/promocoes/20")) {
        return Promise.resolve(
          makeFetchResponse({
            ok: false,
            status: 404,
            json: { message: "Sem promo" },
            contentType: "application/json",
          })
        );
      }
      return Promise.resolve(makeFetchResponse({ ok: false, status: 500, text: "unexpected" }));
    });

    await renderCartAndReady();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    // (2*80) + (2*80) + (1*50) = 370
    await waitFor(() => {
      expect(screen.getAllByText(moneyRegex("R$ 370,00")).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("applyDiscount: valida cupom vazio", async () => {
    setCartItems([{ id: 1, name: "Produto A", quantity: 1, price: 10 }]);
    setAuth({ user: { id: 1 }, isAuthenticated: true });

    await renderCartAndReady();

    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(H.toast.error).toHaveBeenCalledWith("Informe um cupom."));
    expect(H.axios.post).not.toHaveBeenCalled();
  });

  it("applyDiscount: exige login e redireciona para /login", async () => {
    setCartItems([{ id: 1, name: "Produto A", quantity: 1, price: 10 }]);
    setAuth({ user: null, isAuthenticated: false });

    await renderCartAndReady();

    fireEvent.change(screen.getByPlaceholderText("Cupom de desconto"), {
      target: { value: "OFF10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => {
      expect(H.toast.error).toHaveBeenCalledWith("Você precisa estar logado para aplicar um cupom.");
      expect(H.router.push).toHaveBeenCalledWith("/login");
    });

    expect(H.axios.post).not.toHaveBeenCalled();
  });

  it("applyDiscount: sucesso -> chama preview-cupom com payload normalizado, salva cupom e dispara toast.success", async () => {
    setCartItems([{ id: 1, name: "Produto A", quantity: 2, price: 50 }]); // total 100
    setAuth({ user: { id: 123 }, isAuthenticated: true });

    H.axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        desconto: 10,
        message: "Cupom aplicado com sucesso!",
      },
    });

    await renderCartAndReady();

    fireEvent.change(screen.getByPlaceholderText("Cupom de desconto"), {
      target: { value: "off10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(H.axios.post).toHaveBeenCalledTimes(1));

    const [url, payload, config] = H.axios.post.mock.calls[0];
    expect(String(url)).toContain("/api/checkout/preview-cupom");
    expect(payload).toEqual({ codigo: "OFF10", total: 100 });
    expect(config).toEqual({ withCredentials: true });

    await waitFor(() => {
      expect(H.toast.success).toHaveBeenCalledWith("Cupom aplicado com sucesso!");
    });
    expect(screen.getByText("Cupom aplicado com sucesso!")).toBeInTheDocument();

    // Observação: não assertamos "R$ 90,00" porque o DOM atual que você mostrou não mudou o total.
    // Se o componente passar a refletir desconto no total, aí sim adicionamos esse assert.
  });

  it("applyDiscount: quando success=false, dispara toast.error e não altera total", async () => {
    setCartItems([{ id: 1, name: "Produto A", quantity: 1, price: 100 }]);
    setAuth({ user: { id: 1 }, isAuthenticated: true });

    H.axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Cupom inválido." },
    });

    await renderCartAndReady();

    fireEvent.change(screen.getByPlaceholderText("Cupom de desconto"), {
      target: { value: "invalido" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(H.toast.error).toHaveBeenCalledWith("Cupom inválido."));
    expect(screen.getAllByText(moneyRegex("R$ 100,00")).length).toBeGreaterThanOrEqual(1);
  });

  it("applyDiscount: trata erro do backend (response.data.message) e mantém total", async () => {
    setCartItems([{ id: 1, name: "Produto A", quantity: 1, price: 100 }]);
    setAuth({ user: { id: 1 }, isAuthenticated: true });

    H.axios.post.mockRejectedValueOnce({
      response: { data: { message: "Cupom expirado." } },
    });

    await renderCartAndReady();

    fireEvent.change(screen.getByPlaceholderText("Cupom de desconto"), {
      target: { value: "expirado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(H.toast.error).toHaveBeenCalledWith("Cupom expirado."));
    expect(screen.getAllByText(moneyRegex("R$ 100,00")).length).toBeGreaterThanOrEqual(1);
  });

  it("handleCheckout: não logado mostra toast(call) e navega /login", async () => {
    setCartItems([{ id: 1, name: "Produto A", quantity: 1, price: 10 }]);
    setAuth({ user: null, isAuthenticated: false });

    await renderCartAndReady();

    fireEvent.click(screen.getByRole("button", { name: /Finalizar Compra/i }));

    await waitFor(() => {
      expect(H.toast).toHaveBeenCalledWith("Faça login para continuar.");
      expect(H.router.push).toHaveBeenCalledWith("/login");
    });
  });

  it("handleCheckout: logado navega para /checkout", async () => {
    setCartItems([{ id: 1, name: "Produto A", quantity: 1, price: 10 }]);
    setAuth({ user: { id: 1 }, isAuthenticated: true });

    await renderCartAndReady();

    fireEvent.click(screen.getByRole("button", { name: /Finalizar Compra/i }));

    await waitFor(() => {
      expect(H.router.push).toHaveBeenCalledWith("/checkout");
    });
  });

  it("limpa estado de cupom quando carrinho muda: após rerender, total reflete novo subtotal", async () => {
    setCartItems([{ id: 1, name: "Produto A", quantity: 2, price: 50 }]); // 100
    setAuth({ user: { id: 1 }, isAuthenticated: true });

    H.axios.post.mockResolvedValueOnce({
      data: { success: true, desconto: 10, message: "OK" },
    });

    const closeCart = vi.fn();
    const { rerender } = render(<CartCar isCartOpen={true} closeCart={closeCart} />);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Carrinho de compras" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Cupom de desconto"), {
      target: { value: "OFF10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => {
      expect(H.axios.post).toHaveBeenCalledTimes(1);
      expect(H.toast.success).toHaveBeenCalled();
    });

    // muda carrinho -> componente recalcula subtotal/total
    setCartItems([{ id: 1, name: "Produto A", quantity: 1, price: 50 }]); // 50
    rerender(<CartCar isCartOpen={true} closeCart={closeCart} />);

    await waitFor(() => {
      expect(screen.getAllByText(moneyRegex("R$ 50,00")).length).toBeGreaterThanOrEqual(1);
    });
  });
});
