// src/__tests__/components/layout/HeroSection.test.tsx
//
// Risco: layout/HeroSection é o banner principal da home pública — qualquer
// falha no fetch de /api/public/site-hero não deve quebrar a página (mantém
// defaults). Link do botão principal deve ser sanitizado.
//
// O que está sendo coberto:
//   - Título default "Revolucione sua Gestão Agrícola" antes/sem dados da API
//   - Título customizado vindo da API
//   - Subtítulo default quando API retorna vazio
//   - Subtítulo customizado vindo da API
//   - Vídeo renderizado quando hero_video_url presente na API
//   - Sem vídeo → background de imagem
//   - Botão principal com label e href da API
//   - Botão principal com defaults ("Saiba Mais", href "/drones")
//   - CTA secundário "Falar com um especialista" → /contatos
//   - Badge estático "Tecnologia para o campo" sempre visível
//   - Micro-infos estáticos sempre visíveis
//   - Erro na API mantém defaults silenciosamente (sem mensagem de erro)

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import HeroSection from "@/components/layout/HeroSection";

// ---- Mocks -----------------------------------------------------------------

const mockGet = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

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

// ---- Tests -----------------------------------------------------------------

describe("layout/HeroSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("título e subtítulo", () => {
    it("exibe título default quando API retorna objeto vazio", async () => {
      mockGet.mockResolvedValue({});
      render(<HeroSection />);
      await waitFor(() =>
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          "Revolucione sua Gestão Agrícola",
        ),
      );
    });

    it("exibe título customizado vindo da API", async () => {
      mockGet.mockResolvedValue({ title: "Inovação no Campo" });
      render(<HeroSection />);
      await waitFor(() =>
        expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
          "Inovação no Campo",
        ),
      );
    });

    it("exibe subtítulo default quando API retorna subtitle vazio", async () => {
      mockGet.mockResolvedValue({ subtitle: "" });
      render(<HeroSection />);
      await waitFor(() =>
        expect(
          screen.getByText(/otimiza o monitoramento/),
        ).toBeInTheDocument(),
      );
    });

    it("exibe subtítulo customizado vindo da API", async () => {
      mockGet.mockResolvedValue({ subtitle: "Mais controle para sua lavoura." });
      render(<HeroSection />);
      await waitFor(() =>
        expect(
          screen.getByText("Mais controle para sua lavoura."),
        ).toBeInTheDocument(),
      );
    });
  });

  describe("mídia de background", () => {
    it("renderiza <video> quando API retorna hero_video_url", async () => {
      mockGet.mockResolvedValue({
        hero_video_url: "/uploads/hero.mp4",
      });
      render(<HeroSection />);
      await waitFor(() =>
        expect(document.querySelector("video")).toBeInTheDocument(),
      );
      expect(document.querySelector("video")?.getAttribute("src")).toContain(
        "hero.mp4",
      );
    });

    it("renderiza div de background (imagem) quando não há vídeo", async () => {
      mockGet.mockResolvedValue({ hero_image_url: "/uploads/hero.jpg" });
      render(<HeroSection />);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      // Sem vídeo, não deve haver elemento video
      expect(document.querySelector("video")).not.toBeInTheDocument();
    });
  });

  describe("botão principal (CTA)", () => {
    it("renderiza label default 'Saiba Mais' antes da API resolver", () => {
      mockGet.mockReturnValue(new Promise(() => {})); // pendente
      render(<HeroSection />);
      expect(screen.getByText("Saiba Mais")).toBeInTheDocument();
    });

    it("atualiza label e href do botão com dados da API", async () => {
      mockGet.mockResolvedValue({
        button_label: "Ver catálogo",
        button_href: "/drones/catalogo",
      });
      render(<HeroSection />);
      await waitFor(() =>
        expect(screen.getByText("Ver catálogo")).toBeInTheDocument(),
      );
      const link = screen.getByText("Ver catálogo").closest("a");
      expect(link?.getAttribute("href")).toBe("/drones/catalogo");
    });

    it("usa href='/drones' como default do botão principal", async () => {
      mockGet.mockResolvedValue({});
      render(<HeroSection />);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      const link = screen.getByText("Saiba Mais").closest("a");
      expect(link?.getAttribute("href")).toBe("/drones");
    });

    it("normaliza href relativo sem barra inicial adicionando '/'", async () => {
      mockGet.mockResolvedValue({ button_href: "drones/agras" });
      render(<HeroSection />);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      const link = screen.getByText("Saiba Mais").closest("a");
      expect(link?.getAttribute("href")).toBe("/drones/agras");
    });
  });

  describe("CTA secundário e conteúdo estático", () => {
    it("CTA 'Falar com um especialista' aponta para /contatos", async () => {
      mockGet.mockResolvedValue({});
      render(<HeroSection />);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      const link = screen.getByText("Falar com um especialista").closest("a");
      expect(link?.getAttribute("href")).toBe("/contatos");
    });

    it("badge 'Tecnologia para o campo' sempre visível", async () => {
      mockGet.mockResolvedValue({});
      render(<HeroSection />);
      expect(screen.getByText("Tecnologia para o campo")).toBeInTheDocument();
    });

    it("micro-infos estáticos visíveis (Alta performance, Tecnologia DJI, etc.)", async () => {
      mockGet.mockResolvedValue({});
      render(<HeroSection />);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      expect(screen.getByText("Alta performance")).toBeInTheDocument();
      expect(screen.getByText("Tecnologia DJI")).toBeInTheDocument();
      expect(screen.getByText("Suporte rápido")).toBeInTheDocument();
      expect(screen.getByText("Resultados no campo")).toBeInTheDocument();
    });
  });

  describe("resiliência a falhas da API", () => {
    it("mantém defaults silenciosamente quando API retorna erro (sem msg de erro visível)", async () => {
      mockGet.mockRejectedValue(new Error("Network Error"));
      render(<HeroSection />);
      await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
      // Título default ainda visível
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "Revolucione sua Gestão Agrícola",
      );
      // Nenhuma mensagem de erro exposta ao usuário
      expect(screen.queryByText("Network Error")).not.toBeInTheDocument();
    });
  });
});
