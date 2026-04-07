// src/__tests__/components/layout/HeroSection.test.tsx
//
// Risco: layout/HeroSection e o banner principal da home publica — qualquer
// dado ausente nao deve quebrar a pagina (mantém defaults).
// Link do botao principal deve ser sanitizado.
//
// O que esta sendo coberto:
//   - Titulo default "Revolucione sua Gestao Agricola" quando data.title vazio
//   - Titulo customizado vindo via props
//   - Subtitulo default quando data.subtitle vazio
//   - Subtitulo customizado vindo via props
//   - Video renderizado quando hero_video_url presente
//   - Sem video -> background de imagem
//   - Botao principal com label e href via props
//   - Botao principal com defaults ("Saiba Mais", href "/drones")
//   - CTA secundario "Falar com um especialista" -> /contatos
//   - Badge estatico "Tecnologia para o campo" sempre visivel
//   - Micro-infos estaticos sempre visiveis

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { HeroData } from "@/server/data/hero";
import HeroSection from "@/components/layout/HeroSection";

// ---- Mocks -----------------------------------------------------------------

vi.mock("@/utils/absUrl", () => ({
  absUrl: (p: string) => {
    if (!p) return "";
    if (p.startsWith("http")) return p;
    return `http://localhost:5000${p}`;
  },
  API_BASE: "http://localhost:5000",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

// ---- Helpers ---------------------------------------------------------------

function makeHero(overrides: Partial<HeroData> = {}): HeroData {
  return {
    hero_video_url: "",
    hero_video_path: "",
    hero_image_url: "",
    hero_image_path: "",
    title: "",
    subtitle: "",
    button_label: "Saiba Mais",
    button_href: "/drones",
    ...overrides,
  };
}

// ---- Tests -----------------------------------------------------------------

describe("layout/HeroSection", () => {
  describe("titulo e subtitulo", () => {
    it("exibe titulo default quando data.title esta vazio", () => {
      render(<HeroSection data={makeHero()} />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Revolucione sua Gestão Agrícola",
      );
    });

    it("exibe titulo customizado vindo via props", () => {
      render(<HeroSection data={makeHero({ title: "Inovação no Campo" })} />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Inovação no Campo",
      );
    });

    it("exibe subtitulo default quando data.subtitle esta vazio", () => {
      render(<HeroSection data={makeHero({ subtitle: "" })} />);
      expect(
        screen.getByText(/otimiza o monitoramento/),
      ).toBeInTheDocument();
    });

    it("exibe subtitulo customizado vindo via props", () => {
      render(<HeroSection data={makeHero({ subtitle: "Mais controle para sua lavoura." })} />);
      expect(
        screen.getByText("Mais controle para sua lavoura."),
      ).toBeInTheDocument();
    });
  });

  describe("midia de background", () => {
    it("renderiza <video> quando hero_video_url presente", () => {
      render(<HeroSection data={makeHero({ hero_video_url: "/uploads/hero.mp4" })} />);
      expect(document.querySelector("video")).toBeInTheDocument();
      expect(document.querySelector("video")?.getAttribute("src")).toContain(
        "hero.mp4",
      );
    });

    it("renderiza div de background (imagem) quando nao ha video", () => {
      render(<HeroSection data={makeHero({ hero_image_url: "/uploads/hero.jpg" })} />);
      expect(document.querySelector("video")).not.toBeInTheDocument();
    });
  });

  describe("botao principal (CTA)", () => {
    it("renderiza label default 'Saiba Mais' quando button_label vazio", () => {
      render(<HeroSection data={makeHero({ button_label: "" })} />);
      expect(screen.getByText("Saiba Mais")).toBeInTheDocument();
    });

    it("renderiza label e href do botao com dados das props", () => {
      render(<HeroSection data={makeHero({
        button_label: "Ver catálogo",
        button_href: "/drones/catalogo",
      })} />);
      expect(screen.getByText("Ver catálogo")).toBeInTheDocument();
      const link = screen.getByText("Ver catálogo").closest("a");
      expect(link?.getAttribute("href")).toBe("/drones/catalogo");
    });

    it("usa href='/drones' como default do botao principal", () => {
      render(<HeroSection data={makeHero()} />);
      const link = screen.getByText("Saiba Mais").closest("a");
      expect(link?.getAttribute("href")).toBe("/drones");
    });

    it("normaliza href relativo sem barra inicial adicionando '/'", () => {
      render(<HeroSection data={makeHero({ button_href: "drones/agras" })} />);
      const link = screen.getByText("Saiba Mais").closest("a");
      expect(link?.getAttribute("href")).toBe("/drones/agras");
    });
  });

  describe("CTA secundario e conteudo estatico", () => {
    it("CTA 'Falar com um especialista' aponta para /contatos", () => {
      render(<HeroSection data={makeHero()} />);
      const link = screen.getByText("Falar com um especialista").closest("a");
      expect(link?.getAttribute("href")).toBe("/contatos");
    });

    it("badge 'Tecnologia para o campo' sempre visivel", () => {
      render(<HeroSection data={makeHero()} />);
      expect(screen.getByText("Tecnologia para o campo")).toBeInTheDocument();
    });

    it("micro-infos estaticos visiveis (Alta performance, Tecnologia DJI, etc.)", () => {
      render(<HeroSection data={makeHero()} />);
      expect(screen.getByText("Alta performance")).toBeInTheDocument();
      expect(screen.getByText("Tecnologia DJI")).toBeInTheDocument();
      expect(screen.getByText("Suporte rápido")).toBeInTheDocument();
      expect(screen.getByText("Resultados no campo")).toBeInTheDocument();
    });
  });
});
