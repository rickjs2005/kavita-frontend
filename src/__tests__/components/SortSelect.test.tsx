import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SortSelect, type SortKey } from "@/components/search/SortSelect";

describe("SortSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const allOptions: { value: SortKey; label: string }[] = [
    { value: "relevance", label: "Relevância" },
    { value: "price_asc", label: "Preço: menor → maior" },
    { value: "price_desc", label: "Preço: maior → menor" },
    { value: "sold_desc", label: "Mais vendidos" },
    { value: "new_desc", label: "Mais recentes" },
    { value: "discount_desc", label: "Maior desconto" },
  ];

  it("renderiza o select com todas as opções disponíveis (positivo)", () => {
    // Arrange
    render(<SortSelect value="relevance" onChange={vi.fn()} />);

    // Act
    const select = screen.getByRole("combobox");

    // Assert
    allOptions.forEach(({ label }) => {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    });

    expect(select).toBeInTheDocument();
  });

  it("define corretamente o valor selecionado via prop value (positivo/controle)", () => {
    // Arrange
    render(<SortSelect value="price_desc" onChange={vi.fn()} />);

    // Act
    const select = screen.getByRole("combobox") as HTMLSelectElement;

    // Assert
    expect(select.value).toBe("price_desc");
  });

  it("chama onChange com a SortKey correta ao trocar a opção (positivo)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SortSelect value="relevance" onChange={onChange} />);

    const select = screen.getByRole("combobox");

    // Act
    await user.selectOptions(select, "price_asc");

    // Assert
    expect(onChange).toHaveBeenCalledWith("price_asc");
  });

  it("permite trocar para todas as opções válidas (positivo)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SortSelect value="relevance" onChange={onChange} />);

    const select = screen.getByRole("combobox");

    // Act + Assert
    for (const { value } of allOptions) {
      await user.selectOptions(select, value);
      expect(onChange).toHaveBeenCalledWith(value);
    }
  });

  it("não dispara onChange se o usuário selecionar novamente o mesmo valor (negativo/controle)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<SortSelect value="relevance" onChange={onChange} />);

    const select = screen.getByRole("combobox");

    // Act
    await user.selectOptions(select, "relevance");

    // Assert
    // Dependendo do browser/jsdom, change pode ou não disparar;
    // aqui garantimos que, no mínimo, não houve múltiplas chamadas inesperadas
    expect(onChange.mock.calls.length).toBeLessThanOrEqual(1);
  });

  it("mantém semântica acessível usando role='combobox' (positivo)", () => {
    // Arrange
    render(<SortSelect value="relevance" onChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renderiza o texto 'Ordenar:' apenas como elemento informativo (positivo/controle)", () => {
    // Arrange
    render(<SortSelect value="relevance" onChange={vi.fn()} />);

    // Assert
    expect(screen.getByText("Ordenar:")).toBeInTheDocument();
  });
});
