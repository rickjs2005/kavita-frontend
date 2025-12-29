import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

/* ------------------------------------------------------------------ */
/* Mocks                                                              */
/* ------------------------------------------------------------------ */

// next/link → <a>
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: any;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

/* ------------------------------------------------------------------ */

import HeroSection from "@/components/layout/HeroSection";

function getHeroVideo(container: HTMLElement) {
  return container.querySelector("video");
}

function getHeroFallback(container: HTMLElement) {
  // Fallback é uma <div> com style={{ backgroundImage: "url('/images/drone/fallback-hero1.jpg')" }}
  // Em JSDOM isso aparece como atributo style com background-image.
  return container.querySelector(
    "div[style*=\"background-image\"][style*=\"fallback-hero1.jpg\"]"
  );
}

describe("HeroSection (src/components/HeroSection.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza vídeo por padrão quando não há erro (positivo)", () => {
    // Act
    const { container } = render(<HeroSection />);

    // Assert
    const video = getHeroVideo(container);
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "/videos/drone2.mp4");

    // Controle: não deve existir fallback nesse estado
    expect(getHeroFallback(container)).not.toBeInTheDocument();
  });

  it("exibe fallback de imagem quando o vídeo dispara erro (positivo)", () => {
    // Arrange
    const { container } = render(<HeroSection />);
    const video = getHeroVideo(container);
    expect(video).toBeInTheDocument();

    // Act
    fireEvent.error(video!);

    // Assert
    expect(getHeroVideo(container)).not.toBeInTheDocument();

    const fallback = getHeroFallback(container);
    expect(fallback).toBeInTheDocument();
    expect(fallback).toHaveStyle(
      "background-image: url('/images/drone/fallback-hero1.jpg')"
    );
  });

  it("renderiza overlay escuro independentemente do estado (controle)", () => {
    // Arrange
    const { container } = render(<HeroSection />);

    // Act/Assert (estado inicial)
    expect(container.querySelector(".bg-black\\/60")).toBeInTheDocument();

    // Act: força erro do vídeo para trocar para fallback
    const video = getHeroVideo(container);
    expect(video).toBeInTheDocument();
    fireEvent.error(video!);

    // Assert (continua existindo)
    expect(container.querySelector(".bg-black\\/60")).toBeInTheDocument();
  });

  it("renderiza título, descrição e CTA corretamente (positivo)", () => {
    // Act
    render(<HeroSection />);

    // Assert
    expect(
      screen.getByRole("heading", { name: /Revolucione sua Gestão Agrícola/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Conheça a tecnologia que otimiza o monitoramento e a eficiência no campo\./i
      )
    ).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: /Saiba Mais/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/drones");
  });

  it("mantém o CTA visível mesmo após erro no vídeo (positivo)", () => {
    // Arrange
    const { container } = render(<HeroSection />);
    const video = getHeroVideo(container);
    expect(video).toBeInTheDocument();

    // Act
    fireEvent.error(video!);

    // Assert
    const cta = screen.getByRole("link", { name: /Saiba Mais/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/drones");
  });
});
