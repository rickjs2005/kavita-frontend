// src/__tests__/components/drones/FeaturesSection.test.tsx
//
// Risco: FeaturesSection segue a mesma normalização de BenefitsSection mas
// opera sobre features_items_json e features_title — campos separados que
// podem divergir se alguém renomear o contrato da API.
//
// O que está sendo coberto:
//   - Título customizado e fallback "Funcionalidades"
//   - Renderização de cards (título + texto)
//   - Fallback "Funcionalidade" quando item tem apenas texto
//   - Normalização: formato novo, legado, string pura
//   - Filtragem de itens inválidos
//   - Estado vazio (null e [])

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FeaturesSection from "@/components/drones/FeaturesSection";
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

describe("FeaturesSection", () => {
  describe("título", () => {
    it("usa 'Funcionalidades' como título padrão quando features_title é null", () => {
      render(<FeaturesSection page={makePage()} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Funcionalidades");
    });

    it("renderiza título customizado", () => {
      render(<FeaturesSection page={makePage({ features_title: "Recursos avançados" })} />);
      expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Recursos avançados");
    });
  });

  describe("estado vazio", () => {
    it("exibe mensagem quando features_items_json é null", () => {
      render(<FeaturesSection page={makePage()} />);
      expect(
        screen.getByText("Configure as funcionalidades no Admin para exibir aqui."),
      ).toBeInTheDocument();
    });

    it("exibe mensagem quando features_items_json é []", () => {
      render(<FeaturesSection page={makePage({ features_items_json: [] })} />);
      expect(
        screen.getByText("Configure as funcionalidades no Admin para exibir aqui."),
      ).toBeInTheDocument();
    });
  });

  describe("renderização de cards", () => {
    it("renderiza card no formato legado { title, text }", () => {
      render(
        <FeaturesSection
          page={makePage({
            features_items_json: [
              { title: "Câmera 4K", text: "Vídeos em alta resolução." },
            ],
          })}
        />,
      );
      expect(screen.getByText("Câmera 4K")).toBeInTheDocument();
      expect(screen.getByText("Vídeos em alta resolução.")).toBeInTheDocument();
    });

    it("usa 'Funcionalidade' como fallback de título para item com só { text }", () => {
      render(
        <FeaturesSection
          page={makePage({
            features_items_json: [{ text: "Pouso automático de emergência." }],
          })}
        />,
      );
      expect(screen.getByText("Funcionalidade")).toBeInTheDocument();
      expect(screen.getByText("Pouso automático de emergência.")).toBeInTheDocument();
    });

    it("renderiza item no formato string pura", () => {
      render(
        <FeaturesSection
          page={makePage({ features_items_json: ["Controle remoto longo alcance"] })}
        />,
      );
      expect(screen.getByText("Controle remoto longo alcance")).toBeInTheDocument();
    });

    it("não exibe parágrafo de texto quando item tem só título", () => {
      render(
        <FeaturesSection
          page={makePage({
            features_items_json: [{ title: "GPS integrado", text: "" }],
          })}
        />,
      );
      expect(screen.getByText("GPS integrado")).toBeInTheDocument();
    });

    it("renderiza múltiplos cards na grade", () => {
      render(
        <FeaturesSection
          page={makePage({
            features_items_json: [
              { title: "F1", text: "T1" },
              { title: "F2", text: "T2" },
            ],
          })}
        />,
      );
      expect(screen.getByText("F1")).toBeInTheDocument();
      expect(screen.getByText("F2")).toBeInTheDocument();
    });
  });

  describe("normalização e filtragem", () => {
    it("filtra itens nulos da lista", () => {
      render(
        <FeaturesSection
          page={makePage({
            features_items_json: [null, { title: "Válida", text: "OK" }, null],
          })}
        />,
      );
      expect(screen.getByText("Válida")).toBeInTheDocument();
    });

    it("filtra item com title e text ambos em branco", () => {
      render(
        <FeaturesSection
          page={makePage({
            features_items_json: [
              { title: "   ", text: "  " },
              { title: "Real" },
            ],
          })}
        />,
      );
      expect(screen.getByText("Real")).toBeInTheDocument();
      // Apenas 1 card renderizado; não há "Funcionalidade" fallback extra
      expect(screen.queryAllByText("Funcionalidade")).toHaveLength(0);
    });
  });
});
