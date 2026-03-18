// src/__tests__/components/ui/EmptyState.test.tsx
//
// Risco: EmptyState aparece em toda tela de lista sem dados.
// role="status" ausente ou action.onClick desconectado deixa o usuário
// sem feedback e sem caminho para corrigir o estado.
//
// O que está sendo coberto:
//   - Todas as 3 variantes (default, dark, inline) renderizam a mensagem
//   - Todas têm role="status"
//   - Variante default aplicada quando variant omitido
//   - Botão de ação renderizado com label correto quando action fornecida
//   - onClick da action chamado ao clicar
//   - Sem botão quando action não fornecida

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EmptyState } from "@/components/ui/EmptyState";

describe("EmptyState", () => {
  describe("mensagem e role", () => {
    it("renderiza mensagem com role='status'", () => {
      render(<EmptyState message="Nenhum item encontrado." />);
      const status = screen.getByRole("status");
      expect(status).toBeInTheDocument();
      expect(status).toHaveTextContent("Nenhum item encontrado.");
    });

    it("variante default é um <div>", () => {
      render(<EmptyState message="Vazio" />);
      expect(screen.getByRole("status").tagName).toBe("DIV");
    });
  });

  describe("variant='default'", () => {
    it("renderiza mensagem corretamente", () => {
      render(<EmptyState message="Sem produtos" variant="default" />);
      expect(screen.getByRole("status")).toHaveTextContent("Sem produtos");
    });

    it("NÃO exibe botão quando action não fornecida", () => {
      render(<EmptyState message="Vazio" variant="default" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("exibe botão com label da action quando fornecida", () => {
      render(
        <EmptyState
          message="Vazio"
          variant="default"
          action={{ label: "Adicionar produto", onClick: vi.fn() }}
        />,
      );
      expect(screen.getByRole("button", { name: "Adicionar produto" })).toBeInTheDocument();
    });

    it("chama action.onClick ao clicar no botão", () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          message="Vazio"
          variant="default"
          action={{ label: "Adicionar", onClick }}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("variant='dark'", () => {
    it("renderiza mensagem com role='status'", () => {
      render(<EmptyState message="Sem dados no painel" variant="dark" />);
      expect(screen.getByRole("status")).toHaveTextContent("Sem dados no painel");
    });

    it("exibe botão de ação no tema escuro", () => {
      render(
        <EmptyState
          message="Vazio"
          variant="dark"
          action={{ label: "Criar item", onClick: vi.fn() }}
        />,
      );
      expect(screen.getByRole("button", { name: "Criar item" })).toBeInTheDocument();
    });

    it("chama onClick no tema escuro", () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          message="Vazio"
          variant="dark"
          action={{ label: "Criar", onClick }}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Criar" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("variant='inline'", () => {
    it("renderiza como <p> com role='status'", () => {
      render(<EmptyState message="Sem resultados" variant="inline" />);
      const status = screen.getByRole("status");
      expect(status.tagName).toBe("P");
      expect(status).toHaveTextContent("Sem resultados");
    });

    it("exibe botão inline quando action fornecida", () => {
      render(
        <EmptyState
          message="Vazio"
          variant="inline"
          action={{ label: "Limpar filtros", onClick: vi.fn() }}
        />,
      );
      expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeInTheDocument();
    });

    it("chama onClick no modo inline", () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          message="Vazio"
          variant="inline"
          action={{ label: "Limpar", onClick }}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("NÃO exibe botão inline sem action", () => {
      render(<EmptyState message="Vazio" variant="inline" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
