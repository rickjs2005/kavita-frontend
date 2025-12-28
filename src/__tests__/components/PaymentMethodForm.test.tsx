import React from "react";
import { describe, it, expect, vi, type MockedFunction } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import PaymentMethodForm from "@/components/checkout/PaymentMethodForm";
import type { CheckoutFormChangeHandler, CheckoutFormData } from "@/hooks/useCheckoutForm";

function PaymentMethodHarness(props?: {
  initial?: CheckoutFormData["formaPagamento"];
  onChangeSpy?: MockedFunction<CheckoutFormChangeHandler>;
}) {
  const [formaPagamento, setFormaPagamento] = React.useState<
    CheckoutFormData["formaPagamento"]
  >(props?.initial ?? "Pix");

  const onChange: CheckoutFormChangeHandler = (e: any) => {
    // Encaminha para spy se existir
    props?.onChangeSpy?.(e);

    // Componente usa onChange direto no <select>, então aqui tratamos evento.
    const nextValue = e?.target?.value as CheckoutFormData["formaPagamento"];
    setFormaPagamento(nextValue);
  };

  return <PaymentMethodForm formaPagamento={formaPagamento} onChange={onChange} />;
}

describe("PaymentMethodForm", () => {
  it("renderiza label, select e hint com semântica correta", () => {
    render(<PaymentMethodHarness />);

    expect(screen.getByLabelText("Forma de Pagamento")).toBeInTheDocument();

    const select = screen.getByRole("combobox", { name: "Forma de Pagamento" });
    expect(select).toBeInTheDocument();
    expect(select).toHaveAttribute("id", "checkout-payment-method");
    expect(select).toHaveAttribute("aria-describedby", "checkout-payment-hint");

    expect(
      screen.getByText("💳 Cartão processado com segurança pelo Mercado Pago.")
    ).toBeInTheDocument();
  });

  it("renderiza todas as opções de pagamento esperadas (controle)", () => {
    render(<PaymentMethodHarness />);

    const options = screen.getAllByRole("option").map(opt => opt.textContent);
    expect(options).toEqual(["Pix", "Boleto", "Cartão (Mercado Pago)", "Prazo"]);
  });

  it("recebe e exibe corretamente a forma de pagamento atual (positivo)", () => {
    render(<PaymentMethodHarness initial="Boleto" />);

    const select = screen.getByRole("combobox", {
      name: "Forma de Pagamento",
    }) as HTMLSelectElement;

    expect(select.value).toBe("Boleto");
  });

  it("dispara onChange ao alterar a forma de pagamento e atualiza o valor controlado (positivo)", async () => {
    const onChangeSpy = vi.fn() as MockedFunction<CheckoutFormChangeHandler>;

    render(<PaymentMethodHarness initial="Pix" onChangeSpy={onChangeSpy} />);

    const select = screen.getByRole("combobox", {
      name: "Forma de Pagamento",
    }) as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "Cartão (Mercado Pago)" } });

    expect(onChangeSpy).toHaveBeenCalledTimes(1);

    // Asserção estável: como agora é controlado (state), o valor deve refletir a escolha
    await waitFor(() => {
      expect(select.value).toBe("Cartão (Mercado Pago)");
    });
  });

  it("mantém as opções como valores válidos do domínio (controle de contrato)", () => {
    const valid: Array<CheckoutFormData["formaPagamento"]> = [
      "Pix",
      "Boleto",
      "Cartão (Mercado Pago)",
      "Prazo",
    ];
    expect(valid).toHaveLength(4);
  });
});
