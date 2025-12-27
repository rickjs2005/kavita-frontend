import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CloseButton from "@/components/buttons/CloseButton";

// Mock do next/navigation
const backMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: backMock,
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("CloseButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o botão com aria-label='Fechar' (positivo)", () => {
    render(<CloseButton />);

    const button = screen.getByRole("button", { name: /fechar/i });
    expect(button).toBeInTheDocument();
  });

  it("renderiza o símbolo × como conteúdo visual (positivo)", () => {
    render(<CloseButton />);

    expect(screen.getByText("×")).toBeInTheDocument();
  });

  it("chama onClose quando a prop é fornecida (positivo)", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    render(<CloseButton onClose={onCloseMock} />);

    await user.click(screen.getByRole("button", { name: /fechar/i }));

    expect(onCloseMock).toHaveBeenCalledTimes(1);
    expect(backMock).not.toHaveBeenCalled();
  });

  it("chama router.back quando onClose não é fornecida (positivo)", async () => {
    const user = userEvent.setup();

    render(<CloseButton />);

    await user.click(screen.getByRole("button", { name: /fechar/i }));

    expect(backMock).toHaveBeenCalledTimes(1);
  });

  it("não chama router.back quando onClose está definido (negativo/controle)", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    render(<CloseButton onClose={onCloseMock} />);

    await user.click(screen.getByRole("button", { name: /fechar/i }));

    expect(backMock).not.toHaveBeenCalled();
  });

  it("concatena className customizada junto às classes padrão (positivo/controle)", () => {
    render(<CloseButton className="custom-class" />);

    const button = screen.getByRole("button", { name: /fechar/i });
    expect(button.className).toContain("custom-class");
    expect(button.className).toContain("text-gray-500");
    expect(button.className).toContain("text-4xl");
  });

  it("mantém acessibilidade mínima via aria-label (a11y)", () => {
    render(<CloseButton />);

    const button = screen.getByLabelText("Fechar");
    expect(button).toBeInTheDocument();
  });
});
