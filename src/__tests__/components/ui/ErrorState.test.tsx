// src/__tests__/components/ui/ErrorState.test.tsx
//
// Risco: ErrorState é usado em todas as telas de listagem e formulário.
// Variante errada pode tornar o alerta invisível (sem role="alert");
// onRetry ausente ou mal-conectado deixa o usuário sem caminho de recuperação.
//
// O que está sendo coberto:
//   - Todas as 4 variantes (default, dark, warning, inline) renderizam a mensagem
//   - Todas têm role="alert"
//   - Variante default é aplicada quando variant omitido
//   - Botão "Tentar novamente" aparece quando onRetry fornecido
//   - Botão "Tentar novamente" ausente quando onRetry não fornecido
//   - onRetry é chamado ao clicar no botão

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorState } from "@/components/ui/ErrorState";

describe("ErrorState", () => {
  describe("mensagem e role", () => {
    it("renderiza a mensagem com role='alert'", () => {
      render(<ErrorState message="Algo deu errado." />);
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent("Algo deu errado.");
    });

    it("variante default aplicada quando variant é omitido", () => {
      render(<ErrorState message="Erro padrão" />);
      // Elemento deve ser um <div> (não <p>)
      expect(screen.getByRole("alert").tagName).toBe("DIV");
    });
  });

  describe("variant='default'", () => {
    it("renderiza mensagem corretamente", () => {
      render(<ErrorState message="Erro ao carregar" variant="default" />);
      expect(screen.getByRole("alert")).toHaveTextContent("Erro ao carregar");
    });

    it("NÃO mostra botão sem onRetry", () => {
      render(<ErrorState message="Erro" variant="default" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("mostra botão 'Tentar novamente' quando onRetry fornecido", () => {
      render(<ErrorState message="Erro" variant="default" onRetry={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
    });

    it("chama onRetry ao clicar no botão", () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Erro" variant="default" onRetry={onRetry} />);
      fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("variant='dark'", () => {
    it("renderiza mensagem com role='alert'", () => {
      render(<ErrorState message="Erro dark" variant="dark" />);
      expect(screen.getByRole("alert")).toHaveTextContent("Erro dark");
    });

    it("mostra botão 'Tentar novamente' quando onRetry fornecido", () => {
      render(<ErrorState message="Erro" variant="dark" onRetry={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
    });

    it("NÃO mostra botão sem onRetry", () => {
      render(<ErrorState message="Erro" variant="dark" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("variant='warning'", () => {
    it("renderiza mensagem de aviso com role='alert'", () => {
      render(<ErrorState message="Aviso de configuração" variant="warning" />);
      expect(screen.getByRole("alert")).toHaveTextContent("Aviso de configuração");
    });

    it("mostra botão 'Tentar novamente' quando onRetry fornecido", () => {
      render(<ErrorState message="Aviso" variant="warning" onRetry={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
    });

    it("chama onRetry ao clicar no botão (warning)", () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Aviso" variant="warning" onRetry={onRetry} />);
      fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("variant='inline'", () => {
    it("renderiza como <p> com role='alert'", () => {
      render(<ErrorState message="Erro inline" variant="inline" />);
      const alert = screen.getByRole("alert");
      expect(alert.tagName).toBe("P");
      expect(alert).toHaveTextContent("Erro inline");
    });

    it("mostra botão 'Tentar novamente' inline quando onRetry fornecido", () => {
      render(<ErrorState message="Erro" variant="inline" onRetry={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
    });

    it("chama onRetry ao clicar (inline)", () => {
      const onRetry = vi.fn();
      render(<ErrorState message="Erro" variant="inline" onRetry={onRetry} />);
      fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
