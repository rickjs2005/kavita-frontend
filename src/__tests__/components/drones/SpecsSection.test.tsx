// src/__tests__/components/drones/SpecsSection.test.tsx
//
// Risco: SpecsSection exibe especificações técnicas agrupadas — o tipo de dado
// é diferente dos outros (grupos com items: string[]). Se asGroups filtrar
// grupos válidos incorretamente, specs inteiras desaparecem para o cliente.
//
// O que está sendo coberto:
//   - Título customizado e fallback "Especificações"
//   - Renderização de grupos com título e lista de itens
//   - Fallback "Grupo" quando grupo não tem título
//   - Filtragem de não-strings dentro de items[]
//   - Filtragem de grupos sem título E sem itens
//   - Estado vazio (null e [])

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SpecsSection from "@/components/drones/SpecsSection";
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

describe("SpecsSection", () => {
  describe("título", () => {
    it("usa 'Especificações' como padrão quando specs_title é null", () => {
      render(<SpecsSection page={makePage()} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Especificações");
    });

    it("renderiza título customizado", () => {
      render(<SpecsSection page={makePage({ specs_title: "Ficha técnica" })} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Ficha técnica");
    });
  });

  describe("estado vazio", () => {
    it("exibe mensagem quando specs_items_json é null", () => {
      render(<SpecsSection page={makePage()} />);
      expect(
        screen.getByText("Configure os itens de especificações no Admin para exibir aqui."),
      ).toBeInTheDocument();
    });

    it("exibe mensagem quando specs_items_json é []", () => {
      render(<SpecsSection page={makePage({ specs_items_json: [] })} />);
      expect(
        screen.getByText("Configure os itens de especificações no Admin para exibir aqui."),
      ).toBeInTheDocument();
    });
  });

  describe("renderização de grupos", () => {
    it("renderiza grupo com título e itens", () => {
      render(
        <SpecsSection
          page={makePage({
            specs_items_json: [
              { title: "Voo", items: ["Alcance: 10 km", "Autonomia: 45 min"] },
            ],
          })}
        />,
      );
      expect(screen.getByText("Voo")).toBeInTheDocument();
      expect(screen.getByText("Alcance: 10 km")).toBeInTheDocument();
      expect(screen.getByText("Autonomia: 45 min")).toBeInTheDocument();
    });

    it("usa 'Grupo' como fallback quando title está ausente mas items existe", () => {
      render(
        <SpecsSection
          page={makePage({
            specs_items_json: [{ items: ["Item sem grupo"] }],
          })}
        />,
      );
      expect(screen.getByText("Grupo")).toBeInTheDocument();
      expect(screen.getByText("Item sem grupo")).toBeInTheDocument();
    });

    it("renderiza múltiplos grupos", () => {
      render(
        <SpecsSection
          page={makePage({
            specs_items_json: [
              { title: "Câmera", items: ["Resolução: 4K"] },
              { title: "Bateria", items: ["Capacidade: 5000 mAh"] },
            ],
          })}
        />,
      );
      expect(screen.getByText("Câmera")).toBeInTheDocument();
      expect(screen.getByText("Bateria")).toBeInTheDocument();
    });

    it("filtra não-strings dentro de items[]", () => {
      render(
        <SpecsSection
          page={makePage({
            specs_items_json: [
              {
                title: "Motor",
                items: ["6000W", null, 42, undefined, "Eficiência: 95%"],
              },
            ],
          })}
        />,
      );
      expect(screen.getByText("6000W")).toBeInTheDocument();
      expect(screen.getByText("Eficiência: 95%")).toBeInTheDocument();
      // null/números não aparecem como texto
      expect(screen.queryByText("42")).not.toBeInTheDocument();
    });

    it("filtra grupo sem título E sem itens válidos", () => {
      render(
        <SpecsSection
          page={makePage({
            specs_items_json: [
              { title: "", items: [] },       // filtrado
              { title: "Válido", items: ["OK"] }, // mantido
            ],
          })}
        />,
      );
      expect(screen.getByText("Válido")).toBeInTheDocument();
      expect(screen.queryByText("Grupo")).not.toBeInTheDocument();
    });
  });
});
