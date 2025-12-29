import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Form from "@/components/layout/form";

describe("Form (src/components/form.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (vi.isFakeTimers()) vi.useRealTimers();
  });

  function fillRequiredFields(overrides?: Partial<Record<string, string>>) {
    const values = {
      assunto: "Dúvida sobre pedido",
      nome: "Rick Januario",
      email: "rick@kavita.com.br",
      telefone: "(31) 99999-9999",
      estado: "Minas Gerais",
      cidade: "Santana do Manhuaçu",
      mensagem: "Olá, preciso de ajuda com um pedido.",
      ...overrides,
    };

    fireEvent.change(screen.getByLabelText("Assunto"), {
      target: { value: values.assunto },
    });
    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: values.nome },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: values.email },
    });
    fireEvent.change(screen.getByLabelText("Telefone ou Celular"), {
      target: { value: values.telefone },
    });
    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: values.estado },
    });
    fireEvent.change(screen.getByLabelText("Cidade"), {
      target: { value: values.cidade },
    });
    fireEvent.change(screen.getByLabelText("Mensagem"), {
      target: { value: values.mensagem },
    });

    return values;
  }

  it("renderiza o título e todos os campos do formulário (positivo/controle)", () => {
    // Arrange
    render(<Form />);

    // Act
    const title = screen.getByRole("heading", { name: /Entre em contato/i });

    // Assert
    expect(title).toBeInTheDocument();

    expect(screen.getByLabelText("Assunto")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Telefone ou Celular")).toBeInTheDocument();
    expect(screen.getByLabelText("Estado")).toBeInTheDocument();
    expect(screen.getByLabelText("Cidade")).toBeInTheDocument();
    expect(screen.getByLabelText("Córrego")).toBeInTheDocument();
    expect(screen.getByLabelText("Mensagem")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Enviar/i })).toBeInTheDocument();
  });

  it("atualiza valores ao digitar (positivo)", () => {
    // Arrange
    render(<Form />);

    const assunto = screen.getByLabelText("Assunto") as HTMLInputElement;
    const corrego = screen.getByLabelText("Córrego") as HTMLInputElement;
    const mensagem = screen.getByLabelText("Mensagem") as HTMLTextAreaElement;

    // Act
    fireEvent.change(assunto, { target: { value: "Orçamento" } });
    fireEvent.change(corrego, { target: { value: "Córrego do Ouro" } });
    fireEvent.change(mensagem, { target: { value: "Quero saber valores." } });

    // Assert
    expect(assunto.value).toBe("Orçamento");
    expect(corrego.value).toBe("Córrego do Ouro");
    expect(mensagem.value).toBe("Quero saber valores.");
  });

  it("envia com sucesso, loga dados e troca o formulário pela mensagem de sucesso (positivo)", () => {
    // Arrange
    // Spy criado dentro do teste (mais robusto quando setup global mexe no console)
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    render(<Form />);

    const filled = fillRequiredFields();
    // Campo opcional
    fireEvent.change(screen.getByLabelText("Córrego"), {
      target: { value: "" },
    });

    const formEl = screen.getByLabelText("Assunto").closest("form");
    expect(formEl).toBeTruthy();

    // Act: submit direto no <form onSubmit={handleSubmit}>
    fireEvent.submit(formEl as HTMLFormElement);

    // Assert: mensagem de sucesso aparece
    expect(
      screen.getByText(
        /Sua mensagem foi enviada com sucesso! Logo entraremos em contato\./i
      )
    ).toBeInTheDocument();

    // Formulário some após submit
    expect(screen.queryByRole("button", { name: /Enviar/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Assunto")).not.toBeInTheDocument();

    // Assert do console.log (sem ser frágil demais)
    expect(consoleLogSpy).toHaveBeenCalled();

    // Argumentos esperados (o log acontece antes do reset)
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Formulário enviado:",
      expect.objectContaining({
        assunto: filled.assunto,
        nome: filled.nome,
        email: filled.email,
        telefone: filled.telefone,
        estado: filled.estado,
        cidade: filled.cidade,
        corrego: "",
        mensagem: filled.mensagem,
      })
    );

    consoleLogSpy.mockRestore();
  });

  it("não renderiza o formulário quando já está submetido (negativo/estado pós-submit)", () => {
    // Arrange
    render(<Form />);

    fillRequiredFields();

    const formEl = screen.getByLabelText("Assunto").closest("form");
    expect(formEl).toBeTruthy();

    // Act
    fireEvent.submit(formEl as HTMLFormElement);

    // Assert
    expect(screen.getByText(/Sua mensagem foi enviada com sucesso!/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Mensagem")).not.toBeInTheDocument();
  });

  it("aceita envio com o campo 'Córrego' preenchido (positivo/variação)", () => {
    // Arrange
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    render(<Form />);

    const filled = fillRequiredFields();
    fireEvent.change(screen.getByLabelText("Córrego"), {
      target: { value: "Córrego da Serra" },
    });

    const formEl = screen.getByLabelText("Assunto").closest("form");
    expect(formEl).toBeTruthy();

    // Act
    fireEvent.submit(formEl as HTMLFormElement);

    // Assert
    expect(screen.getByText(/Sua mensagem foi enviada com sucesso!/i)).toBeInTheDocument();

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "Formulário enviado:",
      expect.objectContaining({
        assunto: filled.assunto,
        nome: filled.nome,
        email: filled.email,
        telefone: filled.telefone,
        estado: filled.estado,
        cidade: filled.cidade,
        corrego: "Córrego da Serra",
        mensagem: filled.mensagem,
      })
    );

    consoleLogSpy.mockRestore();
  });
});
