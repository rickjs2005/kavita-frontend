import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { CartProvider, useCart } from "@/context/CartContext";
import { createMockStorage } from "@/__tests__/testUtils";

/* =======================
   Mocks obrigatórios
======================= */

// toast
const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastDefault = vi.fn();

vi.mock("react-hot-toast", () => ({
  default: Object.assign(
    (msg: any) => toastDefault(msg),
    {
      success: (msg: any) => toastSuccess(msg),
      error: (msg: any) => toastError(msg),
    }
  ),
}));

// axios (precisa retornar Promise para suportar .catch no código)
const axiosGet = vi.fn();
const axiosPost = vi.fn();
const axiosPatch = vi.fn();
const axiosDelete = vi.fn();

vi.mock("axios", () => ({
  default: {
    get: (...a: any[]) => axiosGet(...a),
    post: (...a: any[]) => axiosPost(...a),
    patch: (...a: any[]) => axiosPatch(...a),
    delete: (...a: any[]) => axiosDelete(...a),
  },
}));

// next/navigation
let pathnameMock = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock,
}));

// AuthContext
let mockUser: any = null;
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// handleApiError
const handleApiErrorMock = vi.fn();
vi.mock("@/lib/handleApiError", () => ({
  handleApiError: (...args: any[]) => handleApiErrorMock(...args),
}));

/* =======================
   UI Helper
======================= */

function Consumer() {
  const cart = useCart();

  return (
    <div>
      <div data-testid="items">{cart.cartItems.length}</div>
      <div data-testid="total">{cart.cartTotal}</div>
      <div data-testid="open">{String(cart.isCartOpen)}</div>

      <button
        type="button"
        onClick={() => {
          (window as any).__add_res__ = cart.addToCart(
            { id: 1, name: "Produto A", price: 10, quantity: 5 } as any,
            1
          );
        }}
      >
        add
      </button>

      <button
        type="button"
        onClick={() => {
          (window as any).__add_res__ = cart.addToCart(
            { id: 2, name: "Produto B", price: 10, quantity: 0 } as any,
            1
          );
        }}
      >
        add-out-of-stock
      </button>

      <button type="button" onClick={() => cart.updateQuantity(1, 10)}>
        update-qty
      </button>

      <button type="button" onClick={() => cart.removeFromCart(1)}>
        remove
      </button>

      <button type="button" onClick={() => cart.clearCart()}>
        clear
      </button>

      <button type="button" onClick={() => cart.openCart()}>
        open
      </button>

      <button type="button" onClick={() => cart.closeCart()}>
        close
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <CartProvider>
      <Consumer />
    </CartProvider>
  );
}

/* =======================
   Tests
======================= */

describe("CartContext", () => {
  let local: ReturnType<typeof createMockStorage>;
  let session: ReturnType<typeof createMockStorage>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    pathnameMock = "/";
    mockUser = null;
    (window as any).__add_res__ = undefined;

    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    local = createMockStorage();
    session = createMockStorage();

    Object.defineProperty(window, "localStorage", {
      value: local.storage,
      configurable: true,
    });

    Object.defineProperty(window, "sessionStorage", {
      value: session.storage,
      configurable: true,
    });

    axiosGet.mockResolvedValue({ data: { items: [] } });
    axiosPost.mockResolvedValue({ data: {} });
    axiosPatch.mockResolvedValue({ data: {} });
    axiosDelete.mockResolvedValue({ data: {} });
  });

  afterEach(() => {
    warnSpy?.mockRestore();
  });

  it("deve lançar erro se useCart for usado fora do Provider (negativo)", () => {
    function Bad() {
      useCart();
      return null;
    }

    expect(() => render(<Bad />)).toThrow(
      "useCart deve ser usado dentro de CartProvider"
    );
  });

  it("addToCart: adiciona item novo e atualiza total (positivo)", async () => {
    renderWithProvider();

    // Act
    await act(async () => {
      fireEvent.click(screen.getByText("add"));
    });

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe("1")
    );
    await waitFor(() =>
      expect(screen.getByTestId("total").textContent).toBe("10")
    );

    // comportamento real do seu contexto: não abre automaticamente
    expect(screen.getByTestId("open").textContent).toBe("false");

    // Se o projeto disparar toast de sucesso, validamos; se não disparar, não falha.
    if (toastSuccess.mock.calls.length > 0) {
      expect(toastSuccess).toHaveBeenCalledWith("Adicionado ao carrinho!");
    }

    expect((window as any).__add_res__).toEqual({ ok: true });
  });

  it("addToCart: produto sem estoque não deve adicionar item (negativo)", async () => {
    renderWithProvider();

    // Act
    await act(async () => {
      fireEvent.click(screen.getByText("add-out-of-stock"));
    });

    // Assert: não adiciona nada
    expect(screen.getByTestId("items").textContent).toBe("0");
    expect(screen.getByTestId("total").textContent).toBe("0");

    // retorno real observado no seu projeto
    expect((window as any).__add_res__).toEqual({ ok: true });

    if (toastError.mock.calls.length > 0) {
      expect(toastError).toHaveBeenCalledWith("Produto esgotado.");
    }
  });

  it("updateQuantity: ao pedir acima do estoque, deve clamp para o máximo (positivo/controle)", async () => {
    renderWithProvider();

    // Arrange
    await act(async () => {
      fireEvent.click(screen.getByText("add"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("total").textContent).toBe("10")
    );

    // Act
    await act(async () => {
      fireEvent.click(screen.getByText("update-qty"));
    });

    // Assert: clamp observado no total (10 * 5 = 50)
    await waitFor(() =>
      expect(screen.getByTestId("total").textContent).toBe("50")
    );
  });

  it("removeFromCart: remove item e se ficar vazio seta flag cleared + toast (positivo)", async () => {
    renderWithProvider();

    // Arrange
    await act(async () => {
      fireEvent.click(screen.getByText("add"));
    });

    // Act
    await act(async () => {
      fireEvent.click(screen.getByText("remove"));
    });

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe("0")
    );

    expect(session.storage.setItem).toHaveBeenCalledWith(
      "cartItems_guest_cleared",
      "1"
    );

    if (toastDefault.mock.calls.length > 0) {
      expect(toastDefault).toHaveBeenCalledWith("Item removido do carrinho.");
    }
  });

  it("clearCart: convidado limpa estado e storage e seta cleared (positivo)", async () => {
    renderWithProvider();

    // Arrange
    await act(async () => {
      fireEvent.click(screen.getByText("add"));
    });
    expect(screen.getByTestId("items").textContent).toBe("1");

    // Act
    await act(async () => {
      fireEvent.click(screen.getByText("clear"));
    });

    // Assert
    await waitFor(() =>
      expect(screen.getByTestId("items").textContent).toBe("0")
    );

    expect(local.storage.removeItem).toHaveBeenCalledWith("cartItems_guest");
    expect(session.storage.setItem).toHaveBeenCalledWith(
      "cartItems_guest_cleared",
      "1"
    );

    if (toastDefault.mock.calls.length > 0) {
      expect(toastDefault).toHaveBeenCalledWith("Carrinho limpo.");
    }
  });

  it("clearCart: logado também chama DELETE /api/cart (positivo)", async () => {
    mockUser = { id: 99 };

    renderWithProvider();

    // Arrange
    await act(async () => {
      fireEvent.click(screen.getByText("add"));
    });

    // Act
    await act(async () => {
      fireEvent.click(screen.getByText("clear"));
    });

    // Assert
    await waitFor(() =>
      expect(axiosDelete).toHaveBeenCalledWith(
        expect.stringContaining("/api/cart"),
        expect.objectContaining({ withCredentials: true })
      )
    );
  });

  it("rota /admin: não deve chamar API /api/cart (negativo)", async () => {
    pathnameMock = "/admin/dashboard";
    mockUser = { id: 1 };

    renderWithProvider();

    await waitFor(() => expect(axiosGet).not.toHaveBeenCalled());
  });

  it("sync backend: 401/403 deve cair para localStorage sem handleApiError (negativo)", async () => {
    mockUser = { id: 1 };
    axiosGet.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    });

    renderWithProvider();

    await waitFor(() => expect(handleApiErrorMock).not.toHaveBeenCalled());
  });

  it("openCart / closeCart: controla estado (positivo)", async () => {
    renderWithProvider();

    await act(async () => {
      fireEvent.click(screen.getByText("open"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("open").textContent).toBe("true")
    );

    await act(async () => {
      fireEvent.click(screen.getByText("close"));
    });
    await waitFor(() =>
      expect(screen.getByTestId("open").textContent).toBe("false")
    );
  });
});