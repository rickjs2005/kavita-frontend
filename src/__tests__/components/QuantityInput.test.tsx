import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import QuantityInput from "@/components/ui/QuantityInput";

describe("QuantityInput (src/components/QuantityInput.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza com valor inicial padrão = 1 quando value não é passado (positivo)", () => {
    // Arrange
    render(<QuantityInput />);

    // Act
    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Assert
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("1");
  });

  it("renderiza com valor inicial fornecido via prop value (positivo)", () => {
    // Arrange
    render(<QuantityInput value={3} />);

    // Act
    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Assert
    expect(input.value).toBe("3");
  });

  it("incrementa a quantidade ao clicar no botão de aumentar (positivo)", () => {
    // Arrange
    const onChange = vi.fn();
    render(<QuantityInput value={1} onChange={onChange} />);

    const incButton = screen.getByRole("button", { name: "Aumentar quantidade" });
    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Act
    fireEvent.click(incButton);

    // Assert
    expect(input.value).toBe("2");
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("decrementa a quantidade ao clicar no botão de diminuir (positivo)", () => {
    // Arrange
    const onChange = vi.fn();
    render(<QuantityInput value={3} onChange={onChange} />);

    const decButton = screen.getByRole("button", { name: "Diminuir quantidade" });
    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Act
    fireEvent.click(decButton);

    // Assert
    expect(input.value).toBe("2");
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("não permite diminuir abaixo de 1 e desabilita o botão de diminuir (negativo/controle)", () => {
    // Arrange
    const onChange = vi.fn();
    render(<QuantityInput value={1} onChange={onChange} />);

    const decButton = screen.getByRole("button", { name: "Diminuir quantidade" });
    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Assert
    expect(decButton).toBeDisabled();
    expect(input.value).toBe("1");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("respeita o limite máximo (max) ao incrementar (positivo/controle)", () => {
    // Arrange
    const onChange = vi.fn();
    render(<QuantityInput value={2} max={3} onChange={onChange} />);

    const incButton = screen.getByRole("button", { name: "Aumentar quantidade" });
    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Act
    fireEvent.click(incButton); // 3
    fireEvent.click(incButton); // tentativa de 4 (bloqueado)

    // Assert
    expect(input.value).toBe("3");
    expect(incButton).toBeDisabled();
    expect(onChange).toHaveBeenLastCalledWith(3);
  });

  it("sanitiza entrada manual: remove não numéricos e aplica mínimo 1 (positivo)", () => {
    // Arrange
    const onChange = vi.fn();
    render(<QuantityInput value={5} onChange={onChange} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Act
    fireEvent.change(input, { target: { value: "abc" } });

    // Assert
    expect(input.value).toBe("1");
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("aplica max também na digitação manual (negativo)", () => {
    // Arrange
    const onChange = vi.fn();
    render(<QuantityInput value={1} max={5} onChange={onChange} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Act
    fireEvent.change(input, { target: { value: "999" } });

    // Assert
    expect(input.value).toBe("5");
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it("quando disabled=true, input e botões ficam desabilitados e cliques não emitem mudanças (negativo)", () => {
    // Arrange
    const onChange = vi.fn();
    render(<QuantityInput value={2} disabled onChange={onChange} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    const incButton = screen.getByRole("button", { name: "Aumentar quantidade" });
    const decButton = screen.getByRole("button", { name: "Diminuir quantidade" });

    // Assert inicial
    expect(input).toBeDisabled();
    expect(incButton).toBeDisabled();
    expect(decButton).toBeDisabled();
    expect(input.value).toBe("2");

    // Act (usuário real só consegue tentar clicar; digitar não é possível em disabled)
    fireEvent.click(incButton);
    fireEvent.click(decButton);

    // Assert
    expect(onChange).not.toHaveBeenCalled();
  });

  it("não chama onChange quando a prop não é fornecida (controle)", () => {
    // Arrange
    render(<QuantityInput value={2} />);

    const incButton = screen.getByRole("button", { name: "Aumentar quantidade" });
    const input = screen.getByRole("textbox") as HTMLInputElement;

    // Act
    fireEvent.click(incButton);

    // Assert
    expect(input.value).toBe("3");
  });
});
