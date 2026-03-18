// src/__tests__/components/ui/LoadingState.test.tsx
//
// Risco: LoadingState aparece durante toda operação assíncrona.
// role="status" e aria-live="polite" são críticos para leitores de tela.
// Mensagem errada ou ausente deixa o usuário sem feedback durante carregamento.
//
// O que está sendo coberto:
//   - Mensagem padrão "Carregando…" quando message omitida
//   - Mensagem customizada
//   - role="status" e aria-live="polite" presentes em todas as variantes
//   - As 3 variantes (default, dark, inline) renderizam corretamente
//   - Variante inline usa elemento <p>
//   - Variantes default e dark usam <div>

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingState } from "@/components/ui/LoadingState";

describe("LoadingState", () => {
  describe("mensagem", () => {
    it("exibe 'Carregando…' por padrão quando message omitida", () => {
      render(<LoadingState />);
      expect(screen.getByRole("status")).toHaveTextContent("Carregando…");
    });

    it("exibe mensagem customizada", () => {
      render(<LoadingState message="Salvando dados..." />);
      expect(screen.getByRole("status")).toHaveTextContent("Salvando dados...");
    });
  });

  describe("acessibilidade", () => {
    it("tem role='status' em todas as variantes", () => {
      const { rerender } = render(<LoadingState variant="default" />);
      expect(screen.getByRole("status")).toBeInTheDocument();

      rerender(<LoadingState variant="dark" />);
      expect(screen.getByRole("status")).toBeInTheDocument();

      rerender(<LoadingState variant="inline" />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("tem aria-live='polite' em todas as variantes", () => {
      const { rerender } = render(<LoadingState variant="default" />);
      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

      rerender(<LoadingState variant="dark" />);
      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

      rerender(<LoadingState variant="inline" />);
      expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("variant='default'", () => {
    it("renderiza como <div>", () => {
      render(<LoadingState variant="default" />);
      expect(screen.getByRole("status").tagName).toBe("DIV");
    });

    it("é a variante padrão quando variant omitido", () => {
      render(<LoadingState />);
      expect(screen.getByRole("status").tagName).toBe("DIV");
    });
  });

  describe("variant='dark'", () => {
    it("renderiza como <div> com mensagem", () => {
      render(<LoadingState variant="dark" message="Processando..." />);
      const el = screen.getByRole("status");
      expect(el.tagName).toBe("DIV");
      expect(el).toHaveTextContent("Processando...");
    });
  });

  describe("variant='inline'", () => {
    it("renderiza como <p> com mensagem", () => {
      render(<LoadingState variant="inline" message="Buscando..." />);
      const el = screen.getByRole("status");
      expect(el.tagName).toBe("P");
      expect(el).toHaveTextContent("Buscando...");
    });
  });
});
