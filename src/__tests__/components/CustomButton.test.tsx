import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CustomButton from "@/components/buttons/CustomButton";

// Mock do next/link para não navegar de verdade
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("CustomButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza botão padrão com label (positivo)", () => {
    render(
      <CustomButton
        label="Salvar"
        variant="primary"
        size="medium"
        isLoading={false}
      />
    );

    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });

  it("chama onClick quando clicado e não está em loading (positivo)", async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(
      <CustomButton
        label="Enviar"
        variant="primary"
        size="medium"
        isLoading={false}
        onClick={onClickMock}
      />
    );

    await user.click(screen.getByRole("button", { name: /enviar/i }));

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it("não chama onClick quando está em loading (negativo)", async () => {
    const user = userEvent.setup();
    const onClickMock = vi.fn();

    render(
      <CustomButton
        label="Enviar"
        variant="primary"
        size="medium"
        isLoading={true}
        onClick={onClickMock}
      />
    );

    const button = screen.getByRole("button");

    expect(button).toBeDisabled();

    await user.click(button);

    expect(onClickMock).not.toHaveBeenCalled();
  });

  it("exibe spinner e texto 'Carregando...' quando isLoading=true (positivo)", () => {
    render(
      <CustomButton
        label="Salvar"
        variant="primary"
        size="medium"
        isLoading={true}
      />
    );

    expect(screen.getByText(/carregando/i)).toBeInTheDocument();
    expect(screen.queryByText("Salvar")).not.toBeInTheDocument();
  });

  it("renderiza como link quando href é fornecido (positivo)", () => {
    render(
      <CustomButton
        label="Ir para página"
        href="/teste"
        variant="secondary"
        size="small"
        isLoading={false}
      />
    );

    const link = screen.getByRole("link", { name: /ir para página/i });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/teste");
  });

  it("aplica aria-disabled e tabIndex quando link está em loading (a11y)", () => {
    render(
      <CustomButton
        label="Ir"
        href="/teste"
        variant="secondary"
        size="small"
        isLoading={true}
      />
    );

    const link = screen.getByRole("link");

    expect(link).toHaveAttribute("aria-disabled", "true");
    expect(link).toHaveAttribute("tabIndex", "-1");
  });

  it("renderiza mensagem de erro quando message é fornecida e não está carregando (positivo)", () => {
    render(
      <CustomButton
        label="Salvar"
        variant="primary"
        size="medium"
        isLoading={false}
        message="Erro ao salvar"
      />
    );

    expect(screen.getByText("Erro ao salvar")).toBeInTheDocument();
  });

  it("não renderiza message quando está em loading (negativo)", () => {
    render(
      <CustomButton
        label="Salvar"
        variant="primary"
        size="medium"
        isLoading={true}
        message="Erro ao salvar"
      />
    );

    expect(screen.queryByText("Erro ao salvar")).not.toBeInTheDocument();
  });

  it("aplica corretamente variant, size e className customizada (positivo/controle)", () => {
    render(
      <CustomButton
        label="Custom"
        variant="secondary"
        size="large"
        isLoading={false}
        className="extra-class"
      />
    );

    const button = screen.getByRole("button", { name: /custom/i });

    expect(button.className).toContain("extra-class");
    expect(button.className).toContain("w-full"); // size large
    expect(button.className).toContain("bg-[#EC5B20]"); // secondary
  });

  it("define type corretamente quando passado via props (controle)", () => {
    render(
      <CustomButton
        label="Submit"
        variant="primary"
        size="medium"
        isLoading={false}
        type="submit"
      />
    );

    const button = screen.getByRole("button", { name: /submit/i });
    expect(button).toHaveAttribute("type", "submit");
  });

  it("define aria-busy quando isLoading=true (a11y)", () => {
    render(
      <CustomButton
        label="Salvar"
        variant="primary"
        size="medium"
        isLoading={true}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
