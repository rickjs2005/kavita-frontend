// src/__tests__/components/drones/HeroSection.test.tsx
//
// HeroSection v3 (cinematográfica) — layout editorial com 2 colunas:
// texto à esquerda (headline em 3 linhas com palavra "Transforma"
// destacada, subtítulo, CTAs, trust pills) + mídia + HUD de specs à
// direita. Sem grid de representantes inline e sem contagem agregada
// — substituídos por trust pills fixas (Tecnologia DJI, Suporte
// especializado, Resultados comprovados).
//
// Mudanças que invalidaram testes antigos:
//   - DEFAULT_HERO_SUBTITLE = "Soluções DJI Agriculture para pulverização
//     e espalhamento com máxima precisão, eficiência e segurança."
//   - DEFAULT_CTA_BUTTON = "Fale com um especialista" (não "Falar com")
//   - Default title em 3 linhas: "Tecnologia que / Transforma / A sua
//     lavoura" — palavra "Transforma" é o token único pra matching
//   - FallbackStage exibe "Kavita Drones" (sem aria-label "Drone agrícola
//     Kavita") quando não há vídeo nem imagem
//   - Sem grid de representantes; sem contagem "X representantes
//     autorizados"; sem link "ver lista completa". O CTA primário
//     continua apontando pra "#drones-representatives" quando reps
//     vazia (preservado, é UX de ancoragem para a seção dedicada
//     RepresentativesSection mais abaixo na página)

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
      // DEFAULT_HERO_SUBTITLE atual cita "pulverização e espalhamento".
      // Esse trecho é único do default e robusto a edições editoriais
      // pequenas no resto da string.
      render(
        <HeroSection page={makePage({ hero_subtitle: null })} representatives={[]} />,
      );
      expect(
        screen.getByText(/pulverização e espalhamento/i),
      ).toBeInTheDocument();
    });

    it("usa hero_title default quando hero_title vier vazio", () => {
      // Default em 3 linhas — "Tecnologia que / Transforma / A sua lavoura".
      // A palavra "Transforma" recebe gradient destacado e é o token
      // único pra matching (resistente a refator do split em mais/menos
      // linhas).
      render(
        <HeroSection
          page={makePage({ hero_title: "" })}
          representatives={[]}
        />,
      );
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h1).toHaveTextContent(/Transforma/i);
      expect(h1).toHaveTextContent(/A sua lavoura/i);
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

    it("renderiza fallback visual com identidade 'Kavita Drones' quando não há mídia", () => {
      // FallbackStage atual exibe SVG decorativo + texto "Kavita Drones"
      // como caption editorial. Não há mais aria-label dedicado nem
      // o placeholder textual antigo "Configure o vídeo...".
      render(<HeroSection page={makePage()} representatives={[]} />);
      expect(screen.getByText(/Kavita Drones/i)).toBeInTheDocument();
      // Não deve renderizar <video> nem <img> (sem mídia configurada)
      expect(document.querySelector("video")).not.toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      // Regressão de copy antigo
      expect(
        screen.queryByText(/Configure o vídeo/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("botão CTA principal", () => {
    it("usa 'Fale com um especialista' como label padrão do CTA", () => {
      // DEFAULT_CTA_BUTTON atual é "Fale com um especialista" (com
      // "um"). String customizada via cta_button_label sobrescreve.
      render(
        <HeroSection page={makePage()} representatives={[makeRep()]} />,
      );
      expect(
        screen.getByText("Fale com um especialista"),
      ).toBeInTheDocument();
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

  describe("trust pills e CTA secundário (substituiu grid antigo de representantes)", () => {
    // A v3 da landing trocou o grid de até 4 representantes inline
    // por 3 trust pills fixas + CTA secundário "Conheça os modelos"
    // ancorado a #drones-models. A lista completa de representantes
    // vive na seção dedicada RepresentativesSection mais abaixo.

    it("renderiza as 3 trust pills fixas", () => {
      render(<HeroSection page={makePage()} representatives={[]} />);
      expect(screen.getByText("Tecnologia DJI")).toBeInTheDocument();
      expect(screen.getByText("Suporte especializado")).toBeInTheDocument();
      expect(screen.getByText("Resultados comprovados")).toBeInTheDocument();
    });

    it("CTA secundário 'Conheça os modelos' aponta para #drones-models", () => {
      render(<HeroSection page={makePage()} representatives={[]} />);
      const link = screen
        .getByText(/Conheça os modelos/i)
        .closest("a");
      expect(link?.getAttribute("href")).toBe("#drones-models");
    });

    it("CTA secundário renderiza independente de haver representantes", () => {
      // Diferença vs CTA primário: o secundário é editorial fixo,
      // não muda comportamento por conta de reps.
      render(
        <HeroSection
          page={makePage()}
          representatives={[makeRep(), makeRep({ id: 2 })]}
        />,
      );
      expect(screen.getByText(/Conheça os modelos/i)).toBeInTheDocument();
    });
  });

  describe("HUD de specs (4 cards sobrepostos)", () => {
    // Hero v3 introduziu HUD com 4 specs conservadores da categoria
    // DJI Agras. Garantir presença evita regressão da camada visual
    // sem testar pixels.
    it("renderiza os 4 specs da categoria DJI Agras", () => {
      render(<HeroSection page={makePage()} representatives={[]} />);
      expect(screen.getByText(/Capacidade de tanque/i)).toBeInTheDocument();
      expect(screen.getByText(/Largura de pulverização/i)).toBeInTheDocument();
      expect(screen.getByText(/Produtividade no campo/i)).toBeInTheDocument();
      expect(screen.getByText(/Detecção de obstáculos/i)).toBeInTheDocument();
    });
  });
});

// Sanity: garantir que o CTA "Conheça os modelos" não é confundido
// com o CTA primário (que pode ter label customizado igual). Isso
// evita teste flake quando admin define cta_button_label como
// "Conheça os modelos" coincidentemente.
describe("drones/HeroSection — CTA primário vs secundário (cobertura cruzada)", () => {
  it("primário e secundário têm hrefs distintos por padrão", () => {
    render(<HeroSection page={makePage()} representatives={[]} />);
    const primary = screen
      .getByText("Fale com um especialista")
      .closest("a");
    const secondary = screen.getByText(/Conheça os modelos/i).closest("a");
    expect(primary?.getAttribute("href")).toBe("#drones-representatives");
    expect(secondary?.getAttribute("href")).toBe("#drones-models");
    expect(primary).not.toBe(secondary);
  });
});

// Imports auxiliares no escopo do teste (já presentes acima): within
void within;
