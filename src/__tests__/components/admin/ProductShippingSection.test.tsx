import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ProductShippingSection, {
  type ShippingRules,
} from "@/components/admin/produtos/ProductShippingSection";

function renderSut(opts?: { value?: ShippingRules; onChange?: (next: ShippingRules) => void }) {
  const value: ShippingRules = opts?.value ?? {
    shippingFree: false,
    shippingFreeFromQtyStr: "",
  };

  const onChange = opts?.onChange ?? vi.fn();

  render(<ProductShippingSection value={value} onChange={onChange} />);

  return { value, onChange: onChange as unknown as ReturnType<typeof vi.fn> };
}

describe("ProductShippingSection", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza título/descrição e checkbox acessível; por padrão não mostra detalhes quando shippingFree=false", () => {
    // Arrange
    const { onChange } = renderSut({
      value: { shippingFree: false, shippingFreeFromQtyStr: "" },
    });

    // Act
    const checkbox = screen.getByRole("checkbox", { name: /frete grátis \(este produto\)/i });

    // Assert
    expect(screen.getByText("Frete do produto")).toBeInTheDocument();
    expect(
      screen.getByText(/configure regras simples de frete grátis por produto/i)
    ).toBeInTheDocument();

    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();

    // detalhes não aparecem
    expect(
      screen.queryByText(/frete grátis a partir de \(unidades\)/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ex\.\:\s*3/i)).not.toBeInTheDocument();

    // não dispara onChange sem interação
    expect(onChange).not.toHaveBeenCalled();
  });

  it("quando marca o checkbox (false -> true), chama onChange mantendo qty e garantindo shippingFree=true", async () => {
    // Arrange
    const user = userEvent.setup();
    const { onChange } = renderSut({
      value: { shippingFree: false, shippingFreeFromQtyStr: "12" },
    });

    const checkbox = screen.getByRole("checkbox", { name: /frete grátis \(este produto\)/i });

    // Act
    await user.click(checkbox);

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      shippingFree: true,
      shippingFreeFromQtyStr: "12", // mantém
    });
  });

  it('quando desmarca o checkbox (true -> false), evita "estado zumbi": zera qty e envia shippingFree=false', async () => {
    // Arrange
    const user = userEvent.setup();
    const { onChange } = renderSut({
      value: { shippingFree: true, shippingFreeFromQtyStr: "5" },
    });

    const checkbox = screen.getByRole("checkbox", { name: /frete grátis \(este produto\)/i });
    expect(checkbox).toBeChecked();

    // Act
    await user.click(checkbox);

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      shippingFree: false,
      shippingFreeFromQtyStr: "", // => NULL no backend (conforme comentário do componente)
    });
  });

  it("quando shippingFree=true, mostra campo de quantidade e texto de ajuda", () => {
    // Arrange
    renderSut({
      value: { shippingFree: true, shippingFreeFromQtyStr: "" },
    });

    // Act
    const label = screen.getByText(/frete grátis a partir de \(unidades\)/i);
    const input = screen.getByRole("textbox", { name: "" }); // input não tem aria-label; validamos pelo placeholder também
    const placeholderInput = screen.getByPlaceholderText(/ex\.\:\s*3/i);

    // Assert
    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(placeholderInput).toBeInTheDocument();
    expect(
      screen.getByText(/se vazio, o frete grátis vale para qualquer quantidade/i)
    ).toBeInTheDocument();
  });

  it("normaliza o input: remove não-dígitos, limita a 6 dígitos e mantém merge com o state atual", () => {
    // Arrange
    const onChange = vi.fn();
    renderSut({
      value: { shippingFree: true, shippingFreeFromQtyStr: "" },
      onChange,
    });

    const input = screen.getByPlaceholderText(/ex\.\:\s*3/i);

    // Act
    fireEvent.change(input, { target: { value: "ab12-34c56789" } });

    // Assert
    // onlyDigits => "123456789" ; slice(0,6) => "123456"
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      shippingFree: true,
      shippingFreeFromQtyStr: "123456",
    });
  });

  it('normaliza "0" como vazio (sempre grátis): digits==="0" => ""', () => {
    // Arrange
    const onChange = vi.fn();
    renderSut({
      value: { shippingFree: true, shippingFreeFromQtyStr: "9" },
      onChange,
    });

    const input = screen.getByPlaceholderText(/ex\.\:\s*3/i);

    // Act
    fireEvent.change(input, { target: { value: "0" } });

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      shippingFree: true,
      shippingFreeFromQtyStr: "", // "0" vira "" conforme regra do componente
    });
  });

  it("permite limpar o input: valor vazio permanece vazio (representa NULL no backend)", () => {
    // Arrange
    const onChange = vi.fn();
    renderSut({
      value: { shippingFree: true, shippingFreeFromQtyStr: "15" },
      onChange,
    });

    const input = screen.getByPlaceholderText(/ex\.\:\s*3/i);

    // Act
    fireEvent.change(input, { target: { value: "" } });

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      shippingFree: true,
      shippingFreeFromQtyStr: "",
    });
  });

  it("não renderiza o input quando shippingFree=false (negação explícita)", () => {
    // Arrange
    renderSut({
      value: { shippingFree: false, shippingFreeFromQtyStr: "999" },
    });

    // Act / Assert
    expect(screen.queryByPlaceholderText(/ex\.\:\s*3/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/se vazio, o frete grátis vale para qualquer quantidade/i)
    ).not.toBeInTheDocument();
  });
});
