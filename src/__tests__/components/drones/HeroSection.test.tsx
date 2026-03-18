// src/__tests__/components/drones/HeroSection.test.tsx
//
// Risco: HeroSection é a vitrine pública dos drones — exibe o título, vídeo/
// imagem e os links de WhatsApp dos representantes. Quebra no buildWaLink ou
// no fallback de mídia torna a landing page inacessível ou sem CTA principal.
//
// O que está sendo coberto:
//   - hero_title renderizado no h1
//   - hero_subtitle renderizado quando presente; ausente quando null
//   - hero_video_path → elemento <video>
//   - hero_image_fallback_path sem vídeo → elemento <img>
//   - Sem vídeo nem imagem → placeholder de configuração
//   - CTA button com label customizado e fallback "Falar no WhatsApp"
//   - cta_title customizado e fallback
//   - Links WhatsApp dos representantes (até 4)
//   - CTA href="#" quando não há representantes
//   - "Ver todos os representantes" link sempre presente
//   - Representante com telefone já com código 55 não duplica prefixo

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HeroSection from "@/components/drones/HeroSection";
import type { DronePageSettings, DroneRepresentative } from "@/types/drones";

// ---- Mocks -----------------------------------------------------------------

vi.mock("@/utils/absUrl", () => ({
  absUrl: (p: string) => `http://localhost:5000${p}`,
  API_BASE: "http://localhost:5000",
}));

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

function makeRep(overrides: Partial<DroneRepresentative> = {}): DroneRepresentative {
  return {
    id: 1,
    name: "Loja Agro SP",
    whatsapp: "11999999999",
    cnpj: "00.000.000/0001-00",
    instagram_url: null,
    notes: null,
    address_cep: null,
    address_street: "Rua das Flores",
    address_number: "100",
    address_neighborhood: null,
    address_city: "São Paulo",
    address_uf: "SP",
    sort_order: 1,
    is_active: 1,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ---- Tests -----------------------------------------------------------------

import { vi } from "vitest";

describe("drones/HeroSection", () => {
  describe("conteúdo de texto", () => {
    it("renderiza hero_title no h1", () => {
      render(<HeroSection page={makePage({ hero_title: "Drones para o Agro" })} representatives={[]} />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Drones para o Agro");
    });

    it("renderiza hero_subtitle quando presente", () => {
      render(
        <HeroSection
          page={makePage({ hero_subtitle: "Alta eficiência no campo." })}
          representatives={[]}
        />,
      );
      expect(screen.getByText("Alta eficiência no campo.")).toBeInTheDocument();
    });

    it("não renderiza parágrafo de subtítulo quando hero_subtitle é null", () => {
      render(<HeroSection page={makePage({ hero_subtitle: null })} representatives={[]} />);
      // "Alta eficiência" não aparece
      expect(screen.queryByText(/Alta eficiência/)).not.toBeInTheDocument();
    });

    it("usa 'Fale com um representante' como cta_title padrão", () => {
      render(<HeroSection page={makePage()} representatives={[]} />);
      expect(screen.getByText("Fale com um representante")).toBeInTheDocument();
    });

    it("renderiza cta_title customizado", () => {
      render(
        <HeroSection
          page={makePage({ cta_title: "Nossos distribuidores" })}
          representatives={[]}
        />,
      );
      expect(screen.getByText("Nossos distribuidores")).toBeInTheDocument();
    });
  });

  describe("mídia (vídeo / imagem)", () => {
    it("renderiza <video> quando hero_video_path está definido", () => {
      render(
        <HeroSection
          page={makePage({ hero_video_path: "/uploads/drones/hero.mp4" })}
          representatives={[]}
        />,
      );
      expect(document.querySelector("video")).toBeInTheDocument();
      expect(document.querySelector("video")?.getAttribute("src")).toContain("hero.mp4");
    });

    it("renderiza <img> quando há imagem mas não há vídeo", () => {
      render(
        <HeroSection
          page={makePage({ hero_image_fallback_path: "/uploads/drones/hero.jpg" })}
          representatives={[]}
        />,
      );
      const img = screen.getByRole("img");
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toContain("hero.jpg");
    });

    it("renderiza placeholder quando não há vídeo nem imagem", () => {
      render(<HeroSection page={makePage()} representatives={[]} />);
      expect(
        screen.getByText("Configure o vídeo ou imagem do Hero no Admin."),
      ).toBeInTheDocument();
    });
  });

  describe("botão CTA principal", () => {
    it("usa 'Falar no WhatsApp' como label padrão do CTA", () => {
      render(<HeroSection page={makePage()} representatives={[makeRep()]} />);
      // Link CTA principal tem o label do botão
      expect(screen.getByText("Falar no WhatsApp")).toBeInTheDocument();
    });

    it("renderiza label customizado do CTA", () => {
      render(
        <HeroSection
          page={makePage({ cta_button_label: "Solicitar demonstração" })}
          representatives={[makeRep()]}
        />,
      );
      expect(screen.getByText("Solicitar demonstração")).toBeInTheDocument();
    });

    it("CTA href aponta para '#' quando não há representantes", () => {
      render(<HeroSection page={makePage({ cta_button_label: "Falar" })} representatives={[]} />);
      const link = screen.getByText("Falar").closest("a");
      expect(link?.getAttribute("href")).toBe("#");
    });

    it("CTA href é link de WhatsApp quando há representantes", () => {
      // Usa label único para evitar ambiguidade com o texto "WhatsApp" dos cards de rep
      render(
        <HeroSection
          page={makePage({ cta_button_label: "Falar no WA agora" })}
          representatives={[makeRep({ whatsapp: "11999990000" })]}
        />,
      );
      const link = screen.getByText("Falar no WA agora").closest("a");
      expect(link?.getAttribute("href")).toContain("wa.me");
      expect(link?.getAttribute("href")).toContain("5511999990000");
    });

    it("não duplica prefixo 55 quando whatsapp já começa com 55", () => {
      render(
        <HeroSection
          page={makePage({ cta_button_label: "WA" })}
          representatives={[makeRep({ whatsapp: "5511999990000" })]}
        />,
      );
      const link = screen.getByText("WA").closest("a");
      // 55 não aparece duplicado (5555...)
      expect(link?.getAttribute("href")).not.toContain("5555");
      expect(link?.getAttribute("href")).toContain("5511999990000");
    });
  });

  describe("representantes no grid", () => {
    it("renderiza nomes dos representantes como links de WhatsApp", () => {
      render(
        <HeroSection
          page={makePage()}
          representatives={[
            makeRep({ id: 1, name: "Loja SP" }),
            makeRep({ id: 2, name: "Loja RJ" }),
          ]}
        />,
      );
      expect(screen.getByText("Loja SP")).toBeInTheDocument();
      expect(screen.getByText("Loja RJ")).toBeInTheDocument();
    });

    it("exibe no máximo 4 representantes no grid do hero", () => {
      const reps = [1, 2, 3, 4, 5].map((i) =>
        makeRep({ id: i, name: `Loja ${i}` }),
      );
      render(<HeroSection page={makePage()} representatives={reps} />);
      // "Loja 5" não deve aparecer no grid do hero (só primeiros 4)
      expect(screen.queryByText("Loja 5")).not.toBeInTheDocument();
    });

    it("exibe cidade e UF do representante no card", () => {
      render(
        <HeroSection
          page={makePage()}
          representatives={[makeRep({ address_city: "Curitiba", address_uf: "PR" })]}
        />,
      );
      expect(screen.getByText(/Curitiba.*PR/)).toBeInTheDocument();
    });

    it("link 'Ver todos os representantes' aponta para #representantes", () => {
      render(<HeroSection page={makePage()} representatives={[]} />);
      const link = screen.getByText("Ver todos os representantes").closest("a");
      expect(link?.getAttribute("href")).toBe("#representantes");
    });
  });
});
