// src/__tests__/components/AddToCartButton.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddToCartButton from "@/components/buttons/AddToCartButton";

const resolveStockValueMock = vi.fn();
vi.mock("../../utils/stock", () => ({
  resolveStockValue: (...args: unknown[]) => resolveStockValueMock(...args),
}));

// Mock do CartContext
const addToCartMock = vi.fn();
const openCartMock = vi.fn();

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    addToCart: addToCartMock,
    openCart: openCartMock,
  }),
}));

type TestProduct = {
  id: number;
  name: string;
  price: number;
  stock?: number;
} & Record<string, unknown>;

function makeProduct(overrides: Partial<TestProduct> = {}): TestProduct {
  return {
    id: 123,
    name: "Produto Teste",
    price: 10,
    ...overrides,
  };
}

describe("AddToCartButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveStockValueMock.mockReturnValue(10); // default: tem estoque
    addToCartMock.mockReturnValue({ ok: true }); // default: comportamento síncrono
  });

  it("renderiza texto padrão e fica habilitado quando há estoque (positivo)", () => {
    const product = makeProduct({ stock: 10 });

    render(<AddToCartButton product={product as never} />);

    const btn = screen.getByRole("button", { name: /adicionar ao carrinho/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute("title", "Adicionar ao Carrinho");
    expect(btn).not.toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "false");
  });

  it("aplica estado de esgotado quando estoque <= 0 (negativo)", () => {
    resolveStockValueMock.mockReturnValue(0);

    const product = makeProduct({ stock: 0 });
    render(<AddToCartButton product={product as never} />);

    const btn = screen.getByRole("button", { name: /esgotado/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", "Esgotado");
    expect(btn).toHaveAttribute("aria-disabled", "true");
  });

  it("chama addToCart com qty informado e abre o carrinho quando res.ok=true (positivo)", async () => {
    const user = userEvent.setup();
    const product = makeProduct({ stock: 10 });

    render(<AddToCartButton product={product as never} qty={3} />);

    await user.click(screen.getByRole("button", { name: /adicionar ao carrinho/i }));

    expect(addToCartMock).toHaveBeenCalledTimes(1);
    expect(addToCartMock).toHaveBeenCalledWith(product, 3);

    // openCart pode ocorrer no mesmo tick; waitFor deixa o teste estável
    await waitFor(() => {
      expect(openCartMock).toHaveBeenCalledTimes(1);
    });
  });

  it("não abre o carrinho quando addToCart retorna res.ok=false (negativo)", async () => {
    addToCartMock.mockReturnValueOnce({ ok: false });

    const user = userEvent.setup();
    const product = makeProduct({ stock: 10 });

    render(<AddToCartButton product={product as never} qty={2} />);

    await user.click(screen.getByRole("button", { name: /adicionar ao carrinho/i }));

    expect(addToCartMock).toHaveBeenCalledTimes(1);
    expect(addToCartMock).toHaveBeenCalledWith(product, 2);
    expect(openCartMock).not.toHaveBeenCalled();
  });

  it("não chama addToCart quando disabled=true (negativo)", async () => {
    const user = userEvent.setup();
    const product = makeProduct({ stock: 10 });

    render(<AddToCartButton product={product as never} disabled />);

    const btn = screen.getByRole("button", { name: /adicionar ao carrinho/i });
    expect(btn).toBeDisabled();

    await user.click(btn);

    expect(addToCartMock).not.toHaveBeenCalled();
    expect(openCartMock).not.toHaveBeenCalled();
  });

  it("não chama addToCart quando está esgotado (negativo)", async () => {
    resolveStockValueMock.mockReturnValue(-1);

    const user = userEvent.setup();
    const product = makeProduct({ stock: 0 });

    render(<AddToCartButton product={product as never} />);

    const btn = screen.getByRole("button", { name: /esgotado/i });
    expect(btn).toBeDisabled();

    await user.click(btn);

    expect(addToCartMock).not.toHaveBeenCalled();
    expect(openCartMock).not.toHaveBeenCalled();
  });

  it("faz stopPropagation: clique no botão não dispara onClick do container pai (positivo/controle)", async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();
    const product = makeProduct({ stock: 10 });

    // ✅ Ajuste para satisfazer jsx-a11y:
    // - elemento com onClick precisa de suporte a teclado
    // - se não for nativo, precisa role + tabIndex + handlers
    const onParentKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        parentClick();
      }
    };

    render(
      <div role="button" tabIndex={0} onClick={parentClick} onKeyDown={onParentKeyDown}>
        <AddToCartButton product={product as never} />
      </div>
    );

    await user.click(screen.getByRole("button", { name: /adicionar ao carrinho/i }));

    expect(parentClick).not.toHaveBeenCalled();
    expect(addToCartMock).toHaveBeenCalledTimes(1);
  });

  it("exponha aria-disabled quando disabled=true (a11y/semântica) (positivo/controle)", () => {
    const product = makeProduct({ stock: 10 });

    render(<AddToCartButton product={product as never} disabled />);

    const btn = screen.getByRole("button", { name: /adicionar ao carrinho/i });
    // no seu componente: aria-disabled={loading || disabled || isOut || undefined}
    expect(btn).toHaveAttribute("aria-disabled", "true");
  });

  it("concatena className no container raiz (positivo/controle)", () => {
    const product = makeProduct({ stock: 10 });

    render(<AddToCartButton product={product as never} className="minha-classe" />);

    const btn = screen.getByRole("button", { name: /adicionar ao carrinho/i });
    expect(btn.className).toContain("minha-classe");
  });
});