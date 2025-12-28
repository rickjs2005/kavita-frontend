import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Pagination } from "@/components/search/Pagination";

describe("Pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não renderiza nada quando totalPages <= 1 (negativo)", () => {
    // Arrange
    const onPageChange = vi.fn();

    // Act
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={onPageChange} />
    );

    // Assert
    expect(container.firstChild).toBeNull();
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("renderiza botões Anterior e Próxima corretamente (positivo)", () => {
    // Arrange
    render(<Pagination page={2} totalPages={5} onPageChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole("button", { name: "Anterior" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeInTheDocument();
  });

  it("desabilita botão Anterior quando page=1 (negativo)", () => {
    // Arrange
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).not.toBeDisabled();
  });

  it("desabilita botão Próxima quando page=totalPages (negativo)", () => {
    // Arrange
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Anterior" })).not.toBeDisabled();
  });

  it("chama onPageChange(page - 1) ao clicar em Anterior (positivo)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Anterior" }));

    // Assert
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("chama onPageChange(page + 1) ao clicar em Próxima (positivo)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Próxima" }));

    // Assert
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("renderiza a página atual com estilo ativo (positivo/controle)", () => {
    // Arrange
    render(<Pagination page={3} totalPages={5} onPageChange={vi.fn()} />);

    // Act
    const current = screen.getByRole("button", { name: "3" });

    // Assert
    expect(current).toHaveClass("border-emerald-600");
    expect(current).toHaveClass("bg-emerald-600");
  });

  it("renderiza janela simples de páginas (page - 2 até page + 2) (positivo)", () => {
    // Arrange
    render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />);

    // Assert
    // janela esperada: 3 4 5 6 7
    ["3", "4", "5", "6", "7"].forEach((p) => {
      expect(screen.getByRole("button", { name: p })).toBeInTheDocument();
    });
  });

  it("mostra botão '1' e reticências quando start > 1 (positivo)", () => {
    // Arrange
    render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getAllByText("…").length).toBeGreaterThanOrEqual(1);
  });

  it("mostra botão da última página e reticências quando end < totalPages (positivo)", () => {
    // Arrange
    render(<Pagination page={5} totalPages={10} onPageChange={vi.fn()} />);

    // Assert
    expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
    expect(screen.getAllByText("…").length).toBeGreaterThanOrEqual(1);
  });

  it("não mostra reticências quando todas as páginas cabem na janela (negativo/controle)", () => {
    // Arrange
    render(<Pagination page={2} totalPages={4} onPageChange={vi.fn()} />);

    // Assert
    expect(screen.queryByText("…")).not.toBeInTheDocument();
  });

  it("chama onPageChange ao clicar em uma página específica (positivo)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />);

    // Act
    await user.click(screen.getByRole("button", { name: "4" }));

    // Assert
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("chama onPageChange(1) ao clicar no botão da primeira página (positivo)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={5} totalPages={10} onPageChange={onPageChange} />);

    // Act
    await user.click(screen.getByRole("button", { name: "1" }));

    // Assert
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("chama onPageChange(totalPages) ao clicar no botão da última página (positivo)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={5} totalPages={10} onPageChange={onPageChange} />);

    // Act
    await user.click(screen.getByRole("button", { name: "10" }));

    // Assert
    expect(onPageChange).toHaveBeenCalledWith(10);
  });

  it("não dispara onPageChange ao clicar em botões desabilitados (negativo)", async () => {
    // Arrange
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);

    // Act
    await user.click(screen.getByRole("button", { name: "Anterior" }));

    // Assert
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
