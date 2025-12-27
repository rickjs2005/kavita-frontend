import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DeleteButton from "@/components/buttons/DeleteButton";

describe("DeleteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o botão com label padrão 'Excluir' (positivo)", () => {
    render(<DeleteButton onConfirm={vi.fn()} />);

    const button = screen.getByRole("button", { name: /excluir/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("renderiza o botão com label customizado quando fornecido (positivo)", () => {
    render(<DeleteButton onConfirm={vi.fn()} label="Remover item" />);

    expect(screen.getByRole("button", { name: /remover item/i })).toBeInTheDocument();
  });

  it("não executa onConfirm quando o usuário cancela a confirmação (negativo)", async () => {
    const user = userEvent.setup();
    const onConfirmMock = vi.fn();

    vi.spyOn(window, "confirm").mockReturnValueOnce(false);

    render(<DeleteButton onConfirm={onConfirmMock} />);

    await user.click(screen.getByRole("button", { name: /excluir/i }));

    expect(onConfirmMock).not.toHaveBeenCalled();
  });

  it("executa onConfirm quando o usuário confirma a exclusão (positivo)", async () => {
    const user = userEvent.setup();
    const onConfirmMock = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    render(<DeleteButton onConfirm={onConfirmMock} />);

    await user.click(screen.getByRole("button", { name: /excluir/i }));

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it("mostra estado de loading e desabilita o botão durante a exclusão (positivo)", async () => {
    const user = userEvent.setup();

    let resolveConfirm!: () => void;
    const onConfirmMock = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        })
    );

    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    render(<DeleteButton onConfirm={onConfirmMock} />);

    const button = screen.getByRole("button", { name: /excluir/i });

    await user.click(button);

    // Estado loading ativo
    expect(screen.getByRole("button", { name: /removendo/i })).toBeDisabled();
    expect(button.className).toContain("opacity-50");

    // Finaliza a promise
    resolveConfirm();

    // Aguarda sair do loading
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /excluir/i })).not.toBeDisabled();
    });
  });

  it("altera o texto para 'Removendo...' durante loading (positivo)", async () => {
    const user = userEvent.setup();

    let resolveConfirm!: () => void;
    const onConfirmMock = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        })
    );

    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    render(<DeleteButton onConfirm={onConfirmMock} />);

    await user.click(screen.getByRole("button", { name: /excluir/i }));

    expect(screen.getByText(/removendo/i)).toBeInTheDocument();

    resolveConfirm();

    await waitFor(() => {
      expect(screen.queryByText(/removendo/i)).not.toBeInTheDocument();
    });
  });

  it("não permite múltiplos cliques enquanto está em loading (negativo/controle)", async () => {
    const user = userEvent.setup();

    let resolveConfirm!: () => void;
    const onConfirmMock = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        })
    );

    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<DeleteButton onConfirm={onConfirmMock} />);

    const button = screen.getByRole("button", { name: /excluir/i });

    await user.click(button);
    await user.click(button);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);

    resolveConfirm();
  });
});
