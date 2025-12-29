import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import FormattedInput from "@/components/layout/FormattedInput";

describe("FormattedInput (src/components/FormattedInput.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setup(props?: Partial<React.ComponentProps<typeof FormattedInput>>) {
    const onChange = vi.fn();

    render(
      <FormattedInput
        label="Documento"
        name="documento"
        value=""
        onChange={onChange}
        {...props}
      />
    );

    const input = screen.getByLabelText("Documento") as HTMLInputElement;
    return { input, onChange };
  }

  it("renderiza label, input e helperText quando fornecido (positivo/controle)", () => {
    // Arrange
    setup({ helperText: "Campo obrigatório" });

    // Assert
    expect(screen.getByText("Documento")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
  });

  it("usa id gerado automaticamente quando id não é passado (positivo)", () => {
    // Arrange
    setup({ name: "email" });

    // Act
    const input = screen.getByLabelText("Documento");

    // Assert
    expect(input).toHaveAttribute("id", "field-email");
  });

  it("usa id customizado quando informado via props (positivo)", () => {
    // Arrange
    setup({ id: "custom-id" });

    // Act
    const input = screen.getByLabelText("Documento");

    // Assert
    expect(input).toHaveAttribute("id", "custom-id");
  });

  it("aplica máscara CPF corretamente (positivo)", () => {
    // Arrange
    const { input, onChange } = setup({ mask: "cpf" });

    // Act
    fireEvent.change(input, { target: { value: "12345678901" } });

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          name: "documento",
          value: "123.456.789-01",
        }),
      })
    );
  });

  it("aplica máscara CNPJ corretamente (positivo)", () => {
    // Arrange
    const { input, onChange } = setup({ mask: "cnpj" });

    // Act
    fireEvent.change(input, { target: { value: "12345678000199" } });

    // Assert
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "12.345.678/0001-99",
        }),
      })
    );
  });

  it("aplica máscara de telefone corretamente (positivo)", () => {
    // Arrange
    const { input, onChange } = setup({ mask: "telefone" });

    // Act
    fireEvent.change(input, { target: { value: "31999998888" } });

    // Assert
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "(31) 99999-8888",
        }),
      })
    );
  });

  it("normaliza e-mail para lowercase e trim (positivo)", () => {
    // Arrange
    const { input, onChange } = setup({ mask: "email" });

    // Act
    fireEvent.change(input, {
      target: { value: "  Rick@KAVITA.COM.BR " },
    });

    // Assert
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "rick@kavita.com.br",
        }),
      })
    );
  });

  it("não altera valor quando mask = none (controle)", () => {
    // Arrange
    const { input, onChange } = setup({ mask: "none" });

    // Act
    fireEvent.change(input, { target: { value: "ABC123" } });

    // Assert
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          value: "ABC123",
        }),
      })
    );
  });

  it("mantém name original no evento sintético (regra crítica)", () => {
    // Arrange
    const { input, onChange } = setup({
      name: "telefone",
      mask: "telefone",
    });

    // Act
    fireEvent.change(input, { target: { value: "31999998888" } });

    // Assert
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({
          name: "telefone",
        }),
      })
    );
  });

  it("aplica classes corretas para variant light (controle)", () => {
    // Arrange
    setup({ variant: "light" });

    // Act
    const input = screen.getByRole("textbox");

    // Assert
    expect(input.className).toMatch(/border-gray-300/);
  });

  it("aplica classes corretas para variant dark (positivo)", () => {
    // Arrange
    setup({ variant: "dark" });

    // Act
    const input = screen.getByRole("textbox");

    // Assert
    expect(input.className).toMatch(/bg-slate-900/);
    expect(input.className).toMatch(/text-slate-50/);
  });

  it("não renderiza helperText quando não fornecido (negativo)", () => {
    // Arrange
    setup();

    // Assert
    expect(screen.queryByText(/Campo obrigatório/i)).not.toBeInTheDocument();
  });
});
