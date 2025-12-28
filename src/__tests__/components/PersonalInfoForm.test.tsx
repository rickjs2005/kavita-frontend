import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import PersonalInfoForm from "@/components/checkout/PersonalInfoForm";
import type { CheckoutFormChangeHandler, CheckoutFormData } from "@/hooks/useCheckoutForm";

/**
 * Mock do FormattedInput para:
 * - não depender de máscaras/implementação interna
 * - validar props (contrato)
 * - simular onChange de forma controlada/estável
 */
const formattedInputSpy = vi.fn();

vi.mock("@/components/layout/FormattedInput", () => {
  return {
    __esModule: true,
    default: (props: any) => {
      formattedInputSpy(props);

      const id = `fi-${props.name}`;

      return (
        <div data-testid={`formatted-${props.name}`}>
          <label htmlFor={id}>{props.label}</label>
          <input
            id={id}
            name={props.name}
            type={props.type}
            placeholder={props.placeholder}
            value={props.value ?? ""}
            onChange={props.onChange}
          />
          {/* expõe props relevantes como data-attrs para asserts estáveis */}
          <div
            data-testid={`meta-${props.name}`}
            data-mask={props.mask}
            data-required={String(Boolean(props.required))}
            data-autocomplete={props.autoComplete ?? ""}
            data-helpertext={props.helperText ?? ""}
          />
        </div>
      );
    },
  };
});

function makeFormData(overrides: Partial<CheckoutFormData> = {}): CheckoutFormData {
  // Aqui basta criar um "shape mínimo" e completar com overrides.
  // O componente acessa as chaves via (formData as any)[field.name].
  return {
    // campos comuns do checkout podem existir, mas não são necessários para este teste
    ...(overrides as CheckoutFormData),
  } as CheckoutFormData;
}

describe("PersonalInfoForm", () => {
  beforeEach(() => {
    formattedInputSpy.mockClear();
  });

  it("renderiza 4 inputs (Nome, CPF, E-mail, WhatsApp) via FormattedInput (controle)", () => {
    const onChange = vi.fn() as unknown as CheckoutFormChangeHandler;

    render(<PersonalInfoForm formData={makeFormData()} onChange={onChange} />);

    expect(screen.getByTestId("formatted-nome")).toBeInTheDocument();
    expect(screen.getByTestId("formatted-cpf")).toBeInTheDocument();
    expect(screen.getByTestId("formatted-email")).toBeInTheDocument();
    expect(screen.getByTestId("formatted-telefone")).toBeInTheDocument();

    // 4 chamadas do FormattedInput
    expect(formattedInputSpy).toHaveBeenCalledTimes(4);
  });

  it("passa as props corretas para cada campo (label/name/type/placeholder/mask/required)", () => {
    const onChange = vi.fn() as unknown as CheckoutFormChangeHandler;

    render(<PersonalInfoForm formData={makeFormData()} onChange={onChange} />);

    // Nome completo
    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Digite seu nome")).toBeInTheDocument();
    expect(screen.getByTestId("meta-nome")).toHaveAttribute("data-mask", "none");
    expect(screen.getByTestId("meta-nome")).toHaveAttribute("data-required", "true");
    expect(screen.getByTestId("meta-nome")).toHaveAttribute("data-autocomplete", "name");
    expect(screen.getByTestId("meta-nome")).toHaveAttribute("data-helpertext", "Digite seu nome");

    // CPF
    expect(screen.getByLabelText("CPF")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("000.000.000-00")).toBeInTheDocument();
    expect(screen.getByTestId("meta-cpf")).toHaveAttribute("data-mask", "cpf");
    expect(screen.getByTestId("meta-cpf")).toHaveAttribute("data-required", "true");
    expect(screen.getByTestId("meta-cpf")).toHaveAttribute("data-autocomplete", "off");
    expect(screen.getByTestId("meta-cpf")).toHaveAttribute("data-helpertext", "000.000.000-00");

    // E-mail
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("voce@gmail.com")).toBeInTheDocument();
    expect(screen.getByTestId("meta-email")).toHaveAttribute("data-mask", "email");
    expect(screen.getByTestId("meta-email")).toHaveAttribute("data-required", "true");
    expect(screen.getByTestId("meta-email")).toHaveAttribute("data-autocomplete", "email");
    expect(screen.getByTestId("meta-email")).toHaveAttribute("data-helpertext", "voce@gmail.com");

    // WhatsApp (telefone) é opcional => required=false
    expect(screen.getByLabelText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("(00) 00000-0000")).toBeInTheDocument();
    expect(screen.getByTestId("meta-telefone")).toHaveAttribute("data-mask", "telefone");
    expect(screen.getByTestId("meta-telefone")).toHaveAttribute("data-required", "false");
    expect(screen.getByTestId("meta-telefone")).toHaveAttribute("data-autocomplete", "tel");
    expect(screen.getByTestId("meta-telefone")).toHaveAttribute("data-helpertext", "(00) 00000-0000");
  });

  it("usa fallback para string vazia quando formData não contém a chave (negativo/controle)", () => {
    const onChange = vi.fn() as unknown as CheckoutFormChangeHandler;

    render(<PersonalInfoForm formData={makeFormData({})} onChange={onChange} />);

    const nome = screen.getByLabelText("Nome completo") as HTMLInputElement;
    const cpf = screen.getByLabelText("CPF") as HTMLInputElement;
    const email = screen.getByLabelText("E-mail") as HTMLInputElement;
    const tel = screen.getByLabelText("WhatsApp") as HTMLInputElement;

    expect(nome.value).toBe("");
    expect(cpf.value).toBe("");
    expect(email.value).toBe("");
    expect(tel.value).toBe("");
  });

  it("preenche os values vindos de formData quando existem (positivo)", () => {
    const onChange = vi.fn() as unknown as CheckoutFormChangeHandler;

    render(
      <PersonalInfoForm
        formData={makeFormData({
          nome: "Rick Januario" as any,
          cpf: "123.456.789-10" as any,
          email: "rick@email.com" as any,
          telefone: "(31) 99999-9999" as any,
        })}
        onChange={onChange}
      />
    );

    expect((screen.getByLabelText("Nome completo") as HTMLInputElement).value).toBe("Rick Januario");
    expect((screen.getByLabelText("CPF") as HTMLInputElement).value).toBe("123.456.789-10");
    expect((screen.getByLabelText("E-mail") as HTMLInputElement).value).toBe("rick@email.com");
    expect((screen.getByLabelText("WhatsApp") as HTMLInputElement).value).toBe("(31) 99999-9999");
  });

  it("encaminha onChange para os inputs (positivo): disparar change chama o handler", () => {
    const onChange = vi.fn() as unknown as CheckoutFormChangeHandler;

    render(<PersonalInfoForm formData={makeFormData()} onChange={onChange} />);

    const nome = screen.getByLabelText("Nome completo");
    fireEvent.change(nome, { target: { value: "Novo Nome" } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
