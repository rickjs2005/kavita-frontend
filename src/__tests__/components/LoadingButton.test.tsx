import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import LoadingButton from "@/components/buttons/LoadingButton";

describe("LoadingButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o botão com children quando não está carregando (positivo)", () => {
    render(
      <LoadingButton isLoading={false}>
        Salvar
      </LoadingButton>
    );

    const button = screen.getByRole("button", { name: /salvar/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("renderiza spinner e texto 'Carregando...' quando isLoading=true (positivo)", () => {
    render(
      <LoadingButton isLoading={true}>
        Salvar
      </LoadingButton>
    );

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByText(/salvar/i)).not.toBeInTheDocument();
  });

  it("desabilita o botão quando isLoading=true (positivo)", () => {
    render(
      <LoadingButton isLoading={true}>
        Salvar
      </LoadingButton>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("desabilita o botão quando disabled=true mesmo sem loading (positivo/controle)", () => {
    render(
      <LoadingButton isLoading={false} disabled>
        Salvar
      </LoadingButton>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("prioriza isLoading sobre disabled para estado visual (positivo/controle)", () => {
    render(
      <LoadingButton isLoading={true} disabled>
        Salvar
      </LoadingButton>
    );

    const button = screen.getByRole("button");

    // Classe de loading deve estar presente
    expect(button.className).toContain("bg-gray-400");
    expect(button.className).toContain("cursor-wait");
  });

  it("aplica classes de estado normal quando não está em loading (positivo)", () => {
    render(
      <LoadingButton isLoading={false}>
        Salvar
      </LoadingButton>
    );

    const button = screen.getByRole("button");

    expect(button.className).toContain("bg-[#EC5B20]");
    expect(button.className).toContain("text-white");
  });

  it("aceita type customizado via props (controle)", () => {
    render(
      <LoadingButton isLoading={false} type="submit">
        Enviar
      </LoadingButton>
    );

    const button = screen.getByRole("button", { name: /enviar/i });
    expect(button).toHaveAttribute("type", "submit");
  });

  it("propaga props adicionais para o elemento button (controle)", async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(
      <LoadingButton isLoading={false} onClick={onClickMock}>
        Clique
      </LoadingButton>
    );

    await user.click(screen.getByRole("button", { name: /clique/i }));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("não dispara onClick quando isLoading=true (negativo)", async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(
      <LoadingButton isLoading={true} onClick={onClickMock}>
        Clique
      </LoadingButton>
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    await user.click(button);

    expect(onClickMock).not.toHaveBeenCalled();
  });

  it("mantém acessibilidade básica: spinner é aria-hidden (a11y)", () => {
    render(
      <LoadingButton isLoading={true}>
        Salvar
      </LoadingButton>
    );

    const spinner = screen.getByText(/carregando/i).previousSibling as HTMLElement;
    expect(spinner).toHaveAttribute("aria-hidden", "true");
  });
});
