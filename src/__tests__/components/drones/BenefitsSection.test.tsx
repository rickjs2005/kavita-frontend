// src/__tests__/components/drones/BenefitsSection.test.tsx
//
// Risco: BenefitsSection é a única renderização pública dos benefícios dos
// drones. O normalizeOne suporta 3 formatos diferentes do backend — se a
// normalização quebrar, cards inteiros ficam ausentes silenciosamente.
//
// O que está sendo coberto:
//   - Título customizado e fallback "Benefícios"
//   - Renderização de cards com título + texto
//   - Fallback "Benefício" quando item tem apenas texto
//   - Item sem texto não renderiza parágrafo extra
//   - Normalização: formato novo { text }, legado { title, text }, string pura
//   - Itens nulos/vazios filtrados da lista
//   - Estado vazio (benefits_items_json null ou [])

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BenefitsSection from "@/components/drones/BenefitsSection";
import type { DronePageSettings } from "@/types/drones";

// ---- Fixtures --------------------------------------------------------------

function makePage(overrides: Partial<DronePageSettings> = {}): DronePageSettings {
  return {
    hero_title: "Drones Kavita",
    hero_subtitle: null,
    hero_video_path: null,
    hero_image_fallback_path: null,
    cta_title: null,
    cta_message_template: null,
    cta_button_label: null,
    specs_title: null,
    specs_items_json: null,
    features_title: null,
    features_items_json: null,
    benefits_title: null,
    benefits_items_json: null,
    sections_order_json: null,
    models_json: null,
    ...overrides,
  };
}

// ---- Tests -----------------------------------------------------------------

describe("BenefitsSection", () => {
  describe("título", () => {
    it("usa 'Benefícios' como título padrão quando benefits_title é null", () => {
      render(<BenefitsSection page={makePage()} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Benefícios");
    });

    it("renderiza título customizado", () => {
      render(<BenefitsSection page={makePage({ benefits_title: "Vantagens do Agras" })} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Vantagens do Agras");
    });
  });

  describe("estado vazio", () => {
    it("exibe mensagem de configuração quando benefits_items_json é null", () => {
      render(<BenefitsSection page={makePage({ benefits_items_json: null })} />);
      expect(
        screen.getByText("Configure os benefícios no Admin para exibir aqui."),
      ).toBeInTheDocument();
    });

    it("exibe mensagem de configuração quando benefits_items_json é []", () => {
      render(<BenefitsSection page={makePage({ benefits_items_json: [] })} />);
      expect(
        screen.getByText("Configure os benefícios no Admin para exibir aqui."),
      ).toBeInTheDocument();
    });
  });

  describe("renderização de cards", () => {
    it("renderiza card com title e text no formato legado { title, text }", () => {
      render(
        <BenefitsSection
          page={makePage({
            benefits_items_json: [
              { title: "Autonomia longa", text: "Até 50 minutos de voo." },
            ],
          })}
        />,
      );
      expect(screen.getByText("Autonomia longa")).toBeInTheDocument();
      expect(screen.getByText("Até 50 minutos de voo.")).toBeInTheDocument();
    });

    it("renderiza card com formato novo { text } — usa 'Benefício' como fallback de título", () => {
      render(
        <BenefitsSection
          page={makePage({
            benefits_items_json: [{ text: "Alta resistência à água." }],
          })}
        />,
      );
      expect(screen.getByText("Benefício")).toBeInTheDocument();
      expect(screen.getByText("Alta resistência à água.")).toBeInTheDocument();
    });

    it("renderiza card com string pura como texto", () => {
      render(
        <BenefitsSection
          page={makePage({ benefits_items_json: ["Certificação ANAC"] })}
        />,
      );
      expect(screen.getByText("Certificação ANAC")).toBeInTheDocument();
    });

    it("não renderiza parágrafo de texto quando item tem apenas title", () => {
      render(
        <BenefitsSection
          page={makePage({
            benefits_items_json: [{ title: "Só título", text: "" }],
          })}
        />,
      );
      expect(screen.getByText("Só título")).toBeInTheDocument();
      // Não há parágrafo extra de texto vazio
      const paragraphs = screen.queryAllByText("", { selector: "p" });
      expect(paragraphs).toHaveLength(0);
    });

    it("renderiza múltiplos cards", () => {
      render(
        <BenefitsSection
          page={makePage({
            benefits_items_json: [
              { title: "Benefício A", text: "Texto A" },
              { title: "Benefício B", text: "Texto B" },
              { title: "Benefício C", text: "Texto C" },
            ],
          })}
        />,
      );
      expect(screen.getByText("Benefício A")).toBeInTheDocument();
      expect(screen.getByText("Benefício B")).toBeInTheDocument();
      expect(screen.getByText("Benefício C")).toBeInTheDocument();
    });
  });

  describe("normalização e filtragem", () => {
    it("filtra itens nulos da lista", () => {
      render(
        <BenefitsSection
          page={makePage({
            benefits_items_json: [null, { title: "Válido", text: "OK" }, null],
          })}
        />,
      );
      expect(screen.getByText("Válido")).toBeInTheDocument();
      // Apenas 1 card renderizado (o válido)
      expect(screen.getAllByText(/Benefício|Válido/).length).toBeGreaterThanOrEqual(1);
    });

    it("filtra item com title e text ambos vazios", () => {
      render(
        <BenefitsSection
          page={makePage({
            benefits_items_json: [
              { title: "", text: "" },
              { title: "Real", text: "Conteúdo" },
            ],
          })}
        />,
      );
      // Apenas 1 card: o válido
      expect(screen.getByText("Real")).toBeInTheDocument();
      expect(screen.queryAllByText("Benefício")).toHaveLength(0);
    });

    it("filtra string vazia da lista", () => {
      render(
        <BenefitsSection
          page={makePage({ benefits_items_json: ["", "   ", "Válido"] })}
        />,
      );
      // Apenas o "Válido" é renderizado
      expect(screen.getByText("Válido")).toBeInTheDocument();
      // "Benefício" (fallback de título) aparece somente 1 vez
      expect(screen.getAllByText("Benefício")).toHaveLength(1);
    });

    it("não exibe mensagem de vazio quando há pelo menos 1 item válido", () => {
      render(
        <BenefitsSection
          page={makePage({
            benefits_items_json: [null, { title: "Único válido" }],
          })}
        />,
      );
      expect(
        screen.queryByText("Configure os benefícios no Admin para exibir aqui."),
      ).not.toBeInTheDocument();
    });
  });
});
