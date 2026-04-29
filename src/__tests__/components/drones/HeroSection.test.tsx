// src/__tests__/components/drones/HeroSection.test.tsx
//
// HeroSection foi reescrita para layout editorial. Mudanças relevantes:
//   - cta_title removido — nao existe mais bloco "Fale com um representante"
//   - cta_button_label default agora e "Falar com especialista"
//   - Sem placeholder textual ("Configure o video..."); fallback virou
//     visual neutro com "Kavita Drones / DJI Agras para o campo brasileiro"
//   - Sem grid de ate 4 representantes — substituido por link inline
//     "ver lista completa" + contagem agregada
//   - Quando nao ha representantes, CTA aponta para "#drones-representatives"
//
// Os smokes abaixo refletem essa UI atual; cobertura mantida.

import React from "react";
import { describe, it, expect, vi } from "vitest";
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

describe("drones/HeroSection", () => {
  describe("conteúdo de texto", () => {
    it("renderiza hero_title no h1", () => {
      render(
        <HeroSection
          page={makePage({ hero_title: "Drones para o Agro" })}
          representatives={[]}
        />,
      );
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Drones para o Agro",
      );
    });

    it("renderiza hero_subtitle quando presente", () => {
      render(
        <HeroSection
          page={makePage({ hero_subtitle: "Alta eficiência no campo." })}
          representatives={[]}
        />,
      );
      expect(
        screen.getByText("Alta eficiência no campo."),
      ).toBeInTheDocument();
    });

    it("usa subtitle padrão quando hero_subtitle é null", () => {
      // Antes: nao renderizava nada. Agora: cai no DEFAULT_HERO_SUBTITLE
      // pra evitar layout vazio em produçao. Procuramos por uma frase
      // unica do default ("pulverizacao, dispersao") em vez de "DJI Agras"
      // que tambem aparece em outras partes do hero.
      render(
        <HeroSection page={makePage({ hero_subtitle: null })} representatives={[]} />,
      );
      expect(
        screen.getByText(/pulverização, dispersão/i),
      ).toBeInTheDocument();
    });

    it("usa hero_title default quando hero_title vier vazio", () => {
      render(
        <HeroSection
          page={makePage({ hero_title: "" })}
          representatives={[]}
        />,
      );
      // Default: "Tecnologia aerea para pulverizar..."
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        /Tecnologia aérea/i,
      );
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
      expect(document.querySelector("video")?.getAttribute("src")).toContain(
        "hero.mp4",
      );
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

    it("renderiza fallback visual neutro quando não há vídeo nem imagem", () => {
      // Antes: placeholder textual "Configure o video...". Agora:
      // bloco visual com aria-label e copy "Kavita Drones / DJI Agras...".
      render(<HeroSection page={makePage()} representatives={[]} />);
      expect(
        screen.getByLabelText(/Drone agrícola Kavita/i),
      ).toBeInTheDocument();
      // E garante que o placeholder antigo nao aparece mais (regressao de copy).
      expect(
        screen.queryByText(/Configure o vídeo/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("botão CTA principal", () => {
    it("usa 'Falar com especialista' como label padrão do CTA", () => {
      render(
        <HeroSection page={makePage()} representatives={[makeRep()]} />,
      );
      expect(screen.getByText("Falar com especialista")).toBeInTheDocument();
    });

    it("renderiza label customizado do CTA", () => {
      render(
        <HeroSection
          page={makePage({ cta_button_label: "Solicitar demonstração" })}
          representatives={[makeRep()]}
        />,
      );
      expect(
        screen.getByText("Solicitar demonstração"),
      ).toBeInTheDocument();
    });

    it("CTA aponta para âncora '#drones-representatives' quando não há representantes", () => {
      render(
        <HeroSection
          page={makePage({ cta_button_label: "Falar" })}
          representatives={[]}
        />,
      );
      const link = screen.getByText("Falar").closest("a");
      // Antes era "#" — passou a apontar pra ancora real onde a lista
      // completa de representantes existe (melhor UX, sem dead link).
      expect(link?.getAttribute("href")).toBe("#drones-representatives");
    });

    it("CTA href é link de WhatsApp quando há representantes", () => {
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
      expect(link?.getAttribute("href")).not.toContain("5555");
      expect(link?.getAttribute("href")).toContain("5511999990000");
    });
  });

  describe("contagem de representantes (substitui o grid antigo)", () => {
    it("exibe contagem singular quando há 1 representante", () => {
      render(
        <HeroSection
          page={makePage()}
          representatives={[makeRep({ id: 1, name: "Loja Única" })]}
        />,
      );
      expect(
        screen.getByText(/1 representante autorizado/i),
      ).toBeInTheDocument();
    });

    it("exibe contagem plural quando há mais de 1 representante", () => {
      const reps = [1, 2, 3].map((i) => makeRep({ id: i, name: `Loja ${i}` }));
      render(<HeroSection page={makePage()} representatives={reps} />);
      expect(
        screen.getByText(/3 representantes autorizados/i),
      ).toBeInTheDocument();
    });

    it("link 'ver lista completa' aponta para #drones-representatives", () => {
      render(
        <HeroSection
          page={makePage()}
          representatives={[makeRep()]}
        />,
      );
      // Antes era "Ver todos os representantes" -> "#representantes".
      // Agora e "ver lista completa" -> "#drones-representatives".
      const link = screen.getByText(/ver lista completa/i).closest("a");
      expect(link?.getAttribute("href")).toBe("#drones-representatives");
    });
  });
});
