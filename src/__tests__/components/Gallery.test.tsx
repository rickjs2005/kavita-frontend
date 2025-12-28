import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

import Gallery from "@/components/ui/Gallery";

// Mock do next/image para virar um <img /> normal no jsdom.
vi.mock("next/image", () => {
  return {
    __esModule: true,
    default: (props: any) => {
      // eslint-disable-next-line jsx-a11y/alt-text
      return <img {...props} />;
    },
  };
});

const PLACEHOLDER = "/placeholder.png";

describe("Gallery (src/components/Gallery.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza a imagem principal com o primeiro src e alt fornecido (positivo)", () => {
    // Arrange
    const images = ["/a.jpg", "/b.jpg"];
    const alt = "Produto X";

    // Act
    render(<Gallery images={images} alt={alt} />);

    // Assert
    const mainImg = screen.getByAltText(alt) as HTMLImageElement;
    expect(mainImg).toBeInTheDocument();
    expect(mainImg.getAttribute("src")).toBe(images[0]);
  });

  it("renderiza thumbs quando há mais de uma imagem, com labels acessíveis (positivo)", () => {
    // Arrange
    const images = ["/a.jpg", "/b.jpg", "/c.jpg"];

    // Act
    render(<Gallery images={images} alt="Produto" />);

    // Assert
    const thumbButtons = [
      screen.getByRole("button", { name: "Ver imagem 1" }),
      screen.getByRole("button", { name: "Ver imagem 2" }),
      screen.getByRole("button", { name: "Ver imagem 3" }),
    ];
    expect(thumbButtons).toHaveLength(3);

    expect(screen.getByAltText("thumb-1")).toBeInTheDocument();
    expect(screen.getByAltText("thumb-2")).toBeInTheDocument();
    expect(screen.getByAltText("thumb-3")).toBeInTheDocument();
  });

  it("ao clicar em uma thumb, troca a imagem principal (positivo)", () => {
    // Arrange
    const images = ["/a.jpg", "/b.jpg"];
    const alt = "Produto";

    render(<Gallery images={images} alt={alt} />);
    const mainImg = screen.getByAltText(alt) as HTMLImageElement;

    // Act
    const secondThumbButton = screen.getByRole("button", { name: "Ver imagem 2" });
    fireEvent.click(secondThumbButton);

    // Assert
    expect(mainImg.getAttribute("src")).toBe(images[1]);
  });

  it("marca a thumb ativa com a classe de borda selecionada (positivo/controle)", () => {
    // Arrange
    const images = ["/a.jpg", "/b.jpg"];
    render(<Gallery images={images} alt="Produto" />);

    const btn1 = screen.getByRole("button", { name: "Ver imagem 1" });
    const btn2 = screen.getByRole("button", { name: "Ver imagem 2" });

    // Assert inicial: primeira é ativa
    expect(btn1.className).toContain("border-[#2F7E7F]");
    expect(btn2.className).not.toContain("border-[#2F7E7F]");

    // Act
    fireEvent.click(btn2);

    // Assert
    expect(btn2.className).toContain("border-[#2F7E7F]");
    expect(btn1.className).not.toContain("border-[#2F7E7F]");
  });

  it("se der erro na imagem principal, faz fallback para placeholder (negativo)", () => {
    // Arrange
    const images = ["/broken.jpg"];
    const alt = "Produto";

    render(<Gallery images={images} alt={alt} />);
    const mainImg = screen.getByAltText(alt) as HTMLImageElement;

    // Act
    fireEvent.error(mainImg);

    // Assert
    expect(mainImg.getAttribute("src")).toBe(PLACEHOLDER);
  });

  it("quando images vier vazio/ inválido, usa placeholder e não renderiza thumbs (negativo)", () => {
    // Arrange
    render(<Gallery images={[]} alt="Produto" />);

    // Assert
    const mainImg = screen.getByAltText("Produto") as HTMLImageElement;
    expect(mainImg.getAttribute("src")).toBe(PLACEHOLDER);

    // thumbs só aparecem se safeImages.length > 1 (aqui é 1: placeholder)
    expect(screen.queryByRole("button", { name: /Ver imagem/i })).not.toBeInTheDocument();
  });

  it("aplica className no container raiz e respeita thumbSize nas dimensões do botão (positivo)", () => {
    // Arrange
    const thumbSize = 64; // width/height do botão = thumbSize + 4
    const { container } = render(
      <Gallery images={["/a.jpg", "/b.jpg"]} alt="Produto" className="minha-classe" thumbSize={thumbSize} />
    );

    // Assert: raiz é o primeiro elemento renderizado
    const root = container.firstElementChild as HTMLElement;
    expect(root).toBeTruthy();
    expect(root).toHaveClass("minha-classe");

    const btn1 = screen.getByRole("button", { name: "Ver imagem 1" });
    expect(btn1).toHaveStyle({ width: `${thumbSize + 4}px`, height: `${thumbSize + 4}px` });
  });

  it("se der erro numa thumb, o src do <img> da thumb vira placeholder (negativo)", () => {
    // Arrange
    render(<Gallery images={["/a.jpg", "/broken-thumb.jpg"]} alt="Produto" />);
    const thumb2 = screen.getByAltText("thumb-2") as HTMLImageElement;

    expect(thumb2.getAttribute("src")).toBe("/broken-thumb.jpg");

    // Act
    fireEvent.error(thumb2);

    // Assert
    expect(thumb2.getAttribute("src")).toBe(PLACEHOLDER);
  });
});
