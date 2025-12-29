import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import ProductBuyBox from "@/components/products/ProductBuyBox";

// ---- Mocks ----
const quantityInputSpy = vi.fn();
const addToCartSpy = vi.fn();

vi.mock("@/components/ui/QuantityInput", () => ({
  __esModule: true,
  default: (props: any) => {
    quantityInputSpy(props);

    const { value, disabled, max, onChange } = props;

    return (
      <div>
        <label htmlFor="qty">Quantidade</label>
        <input
          id="qty"
          aria-label="Quantidade"
          data-testid="qty-input"
          type="number"
          disabled={disabled}
          value={value}
          max={max}
          onChange={(e) => onChange(Number((e.target as HTMLInputElement).value))}
        />
        <span data-testid="qty-max">{String(max)}</span>
      </div>
    );
  },
}));

vi.mock("@/components/buttons/AddToCartButton", () => ({
  __esModule: true,
  default: (props: any) => {
    addToCartSpy(props);

    const { disabled, qty, product } = props;
    return (
      <button
        type="button"
        disabled={disabled}
        data-testid="add-to-cart"
        aria-label={`Adicionar ${product?.name ?? "produto"} ao carrinho`}
      >
        Add (qty={String(qty)})
      </button>
    );
  },
}));

// ---- Helpers ----
// Tipagem: usamos o tipo real do projeto para evitar drift
import type { Product } from "@/types/product";

function makeProduct(overrides?: Partial<Product>): Product {
  return {
    id: 123,
    name: "Produto X",
    price: 10,
    // ✅ obrigatório no seu tipo Product
    image: "https://example.com/produto.jpg",
    // se o seu tipo tiver mais campos obrigatórios, adicione aqui também
    ...(overrides ?? {}),
  } as Product;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductBuyBox", () => {
  it("renderiza textos informativos fixos (positivo/semântica)", () => {
    render(<ProductBuyBox product={makeProduct()} stock={5} />);

    expect(screen.getByText(/Envio rápido para MG\/ES\/RJ\/BA/i)).toBeInTheDocument();
    expect(screen.getByText(/Troca\/devolução em até 7 dias/i)).toBeInTheDocument();
    expect(screen.getByText(/Suporte pelo WhatsApp/i)).toBeInTheDocument();
  });

  it("por padrão, stock=0 => indisponível: QuantityInput e AddToCartButton desabilitados (negativo)", () => {
    render(<ProductBuyBox product={makeProduct()} />);

    const qty = screen.getByTestId("qty-input") as HTMLInputElement;
    const addBtn = screen.getByTestId("add-to-cart") as HTMLButtonElement;

    expect(qty).toBeDisabled();
    expect(addBtn).toBeDisabled();

    expect(screen.getByTestId("qty-max")).toHaveTextContent("0");

    expect(quantityInputSpy).toHaveBeenCalled();
    const lastQtyProps = quantityInputSpy.mock.calls.at(-1)?.[0];
    expect(lastQtyProps.disabled).toBe(true);
    expect(lastQtyProps.max).toBe(0);

    expect(addToCartSpy).toHaveBeenCalled();
    const lastCartProps = addToCartSpy.mock.calls.at(-1)?.[0];
    expect(lastCartProps.disabled).toBe(true);
    expect(lastCartProps.qty).toBe(1);
  });

  it("quando stock>0, habilita controles e passa max=stock (positivo)", () => {
    render(<ProductBuyBox product={makeProduct()} stock={8} />);

    const qty = screen.getByTestId("qty-input") as HTMLInputElement;
    const addBtn = screen.getByTestId("add-to-cart") as HTMLButtonElement;

    expect(qty).not.toBeDisabled();
    expect(addBtn).not.toBeDisabled();
    expect(screen.getByTestId("qty-max")).toHaveTextContent("8");

    const lastQtyProps = quantityInputSpy.mock.calls.at(-1)?.[0];
    expect(lastQtyProps.disabled).toBe(false);
    expect(lastQtyProps.max).toBe(8);

    const lastCartProps = addToCartSpy.mock.calls.at(-1)?.[0];
    expect(lastCartProps.disabled).toBe(false);
    expect(lastCartProps.qty).toBe(1);
  });

  it("atualiza qty ao alterar QuantityInput e propaga para AddToCartButton (positivo)", () => {
    render(<ProductBuyBox product={makeProduct()} stock={10} />);

    const qty = screen.getByTestId("qty-input") as HTMLInputElement;

    expect(screen.getByTestId("add-to-cart")).toHaveTextContent("qty=1");

    fireEvent.change(qty, { target: { value: "3" } });

    expect(screen.getByTestId("add-to-cart")).toHaveTextContent("qty=3");

    const lastCartProps = addToCartSpy.mock.calls.at(-1)?.[0];
    expect(lastCartProps.qty).toBe(3);
  });

  it("repassa o objeto product corretamente para AddToCartButton (positivo/contrato)", () => {
    const product = makeProduct({ id: 999, name: "Adubo Premium" });

    render(<ProductBuyBox product={product} stock={1} />);

    const lastCartProps = addToCartSpy.mock.calls.at(-1)?.[0];
    expect(lastCartProps.product).toEqual(product);

    expect(
      screen.getByRole("button", { name: /Adicionar Adubo Premium ao carrinho/i })
    ).toBeInTheDocument();
  });

  it("stock nulo/undefined é tratado como 0 => indisponível (negativo/robustez)", () => {
    render(<ProductBuyBox product={makeProduct()} stock={undefined as any} />);

    expect(screen.getByTestId("qty-input")).toBeDisabled();
    expect(screen.getByTestId("add-to-cart")).toBeDisabled();
  });
});
