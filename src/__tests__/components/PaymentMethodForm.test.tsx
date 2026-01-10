import React from "react";
import { describe, it, expect, vi, type MockedFunction } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import PaymentMethodForm from "@/components/checkout/PaymentMethodForm";
import type { CheckoutFormData } from "@/hooks/useCheckoutForm";

/**
 * Tipo alinhado com o contrato REAL do componente:
 * onChange pode vir de input | select | textarea
 */
type AnyChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

/**
 * Harness para manter o componente controlado (como no checkout real)
 * e permitir inspecionar efeitos de onChange sem depender da implementação interna.
 */
function PaymentMethodHarness(props?: {
  initial?: CheckoutFormData["formaPagamento"];
  onChangeSpy?: MockedFunction<(e: AnyChangeEvent) => void>;
}) {
  const [formaPagamento, setFormaPagamento] = React.useState<
    CheckoutFormData["formaPagamento"]
  >(props?.initial ?? "Pix");

  const onChange = (e: AnyChangeEvent) => {
    props?.onChangeSpy?.(e);
    setFormaPagamento(e.target.value as CheckoutFormData["formaPagamento"]);
  };

  return (
    <PaymentMethodForm
      formaPagamento={formaPagamento}
      onChange={onChange}
    />
  );
}

describe("PaymentMethodForm (src/components/checkout/PaymentMethodForm.tsx)", () => {
  it("renderiza label e select com semântica correta e atributos principais (a11y/contrato)", () => {
    // Arrange
    render(<PaymentMethodHarness />);

    // Act
    const label = screen.getByText("Forma de Pagamento");
    const select = screen.getByRole("combobox", {
      name: "Forma de Pagamento",
    });

    // Assert
    expect(label).toBeInTheDocument();
    expect(select).toBeInTheDocument();

    expect(select).toHaveAttribute("id", "checkout-payment-method");
    expect(select).toHaveAttribute("name", "formaPagamento");
    expect(select).toHaveAttribute(
      "aria-describedby",
      "checkout-payment-hint"
    );

    // hint sempre existe (conteúdo varia conforme método)
    expect(document.getElementById("checkout-payment-hint")).toBeTruthy();
  });

  it("renderiza todas as opções de pagamento esperadas (contrato de domínio)", () => {
    // Arrange
    render(<PaymentMethodHarness />);

    // Act
    const options = screen.getAllByRole("option");

    // Assert
    expect(options.map((opt) => opt.textContent)).toEqual([
      "Pix",
      "Boleto",
      "Cartão (Mercado Pago)",
      "Prazo",
    ]);

    expect(options.map((opt) => (opt as HTMLOptionElement).value)).toEqual([
      "Pix",
      "Boleto",
      "Cartão (Mercado Pago)",
      "Prazo",
    ]);
  });

  it("exibe corretamente a forma de pagamento inicial recebida (positivo)", () => {
    // Arrange
    render(<PaymentMethodHarness initial="Boleto" />);

    // Act
    const select = screen.getByRole("combobox", {
      name: "Forma de Pagamento",
    }) as HTMLSelectElement;

    // Assert
    expect(select.value).toBe("Boleto");
  });

  it("dispara onChange e atualiza o valor controlado ao alterar seleção (positivo)", async () => {
    // Arrange
    const onChangeSpy = vi.fn() as MockedFunction<
      (e: AnyChangeEvent) => void
    >;

    render(
      <PaymentMethodHarness
        initial="Pix"
        onChangeSpy={onChangeSpy}
      />
    );

    const select = screen.getByRole("combobox", {
      name: "Forma de Pagamento",
    }) as HTMLSelectElement;

    // Act
    fireEvent.change(select, {
      target: { value: "Cartão (Mercado Pago)" },
    });

    // Assert
    expect(onChangeSpy).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(select.value).toBe("Cartão (Mercado Pago)");
    });
  });

  it("mostra o hint correto para cada método de pagamento (branches)", () => {
    // Pix
    render(<PaymentMethodHarness initial="Pix" />);
    expect(
      screen.getByText("Pagamento instantâneo via Pix.")
    ).toBeInTheDocument();

    // Boleto
    render(<PaymentMethodHarness initial="Boleto" />);
    expect(
      screen.getByText(
        "Boleto bancário (confirmação pode levar até 2 dias úteis)."
      )
    ).toBeInTheDocument();

    // Cartão
    render(
      <PaymentMethodHarness initial="Cartão (Mercado Pago)" />
    );
    expect(
      screen.getByText(
        "Cartão processado com segurança pelo Mercado Pago."
      )
    ).toBeInTheDocument();

    // Prazo
    render(<PaymentMethodHarness initial="Prazo" />);
    expect(
      screen.getByText("Pagamento no prazo (sem Mercado Pago).")
    ).toBeInTheDocument();
  });

  it("fluxo negativo/robustez: troca Pix → Prazo via UI atualiza hint e valor", async () => {
    // Arrange
    render(<PaymentMethodHarness initial="Pix" />);

    const select = screen.getByRole("combobox", {
      name: "Forma de Pagamento",
    }) as HTMLSelectElement;

    expect(
      screen.getByText("Pagamento instantâneo via Pix.")
    ).toBeInTheDocument();

    // Act
    fireEvent.change(select, { target: { value: "Prazo" } });

    // Assert
    await waitFor(() => {
      expect(select.value).toBe("Prazo");
      expect(
        screen.getByText("Pagamento no prazo (sem Mercado Pago).")
      ).toBeInTheDocument();
    });
  });
});
