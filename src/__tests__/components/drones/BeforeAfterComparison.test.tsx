// src/__tests__/components/drones/BeforeAfterComparison.test.tsx
//
// Fluxo crítico: slider antes/depois nas seções de cases dos drones.
// Apresenta resultado real do serviço — é o componente storytelling
// que converte interesse em pedido de orçamento.
//
// Cobertura focada em comportamento:
//   - Renderiza ambas as imagens (antes + depois) com src corretos
//   - Aceita labels customizados quando passados
//   - Slider tem controle de posição via input range (acessibilidade)

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import BeforeAfterComparison from "@/components/drones/cases/BeforeAfterComparison";

vi.mock("@/utils/absUrl", () => ({
  absUrl: (p: string) =>
    p?.startsWith("http") ? p : `http://localhost:5000${p}`,
  API_BASE: "http://localhost:5000",
}));

vi.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, ...rest }: any) => {
    const resolvedSrc = typeof src === "string" ? src : src?.src ?? "";
    return <img src={resolvedSrc} alt={alt} {...rest} />;
  },
}));

describe("BeforeAfterComparison — fluxo crítico", () => {
  it("renderiza imagem 'antes' e 'depois' com srcs absolutos", () => {
    // O componente usa 2 layers: o "depois" como background e o "antes"
    // dentro de um <div aria-hidden> com clip-path. `getAllByRole("img")`
    // por padrão ignora elementos em aria-hidden — daí buscamos via
    // querySelectorAll para pegar as DUAS imagens (são 2 sempre).
    const { container } = render(
      <BeforeAfterComparison
        beforeUrl="/uploads/cases/before.jpg"
        afterUrl="/uploads/cases/after.jpg"
        alt="Lavoura tratada"
      />,
    );

    const imgs = Array.from(container.querySelectorAll("img"));
    expect(imgs.length).toBeGreaterThanOrEqual(2);

    const srcs = imgs.map((img) => img.getAttribute("src"));
    expect(srcs.some((s) => s?.includes("before.jpg"))).toBe(true);
    expect(srcs.some((s) => s?.includes("after.jpg"))).toBe(true);
  });

  it("retorna null quando beforeUrl ou afterUrl está vazio (defensivo)", () => {
    // Garante que admin que esqueceu de subir uma das mídias do case
    // não quebra a página inteira — componente apenas omite o slider.
    const { container: c1 } = render(
      <BeforeAfterComparison beforeUrl="" afterUrl="/b.jpg" />,
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <BeforeAfterComparison beforeUrl="/a.jpg" afterUrl="" />,
    );
    expect(c2.firstChild).toBeNull();
  });

  it("aceita URLs absolutas no beforeUrl/afterUrl sem reescrever", () => {
    const { container } = render(
      <BeforeAfterComparison
        beforeUrl="https://cdn.exemplo.com/a.jpg"
        afterUrl="https://cdn.exemplo.com/b.jpg"
      />,
    );

    const imgs = Array.from(container.querySelectorAll("img"));
    const srcs = imgs.map((img) => img.getAttribute("src"));
    expect(srcs.some((s) => s === "https://cdn.exemplo.com/a.jpg")).toBe(true);
    expect(srcs.some((s) => s === "https://cdn.exemplo.com/b.jpg")).toBe(true);
  });

  it("renderiza labels customizados quando passados", () => {
    render(
      <BeforeAfterComparison
        beforeUrl="/a.jpg"
        afterUrl="/b.jpg"
        beforeLabel="Antes da pulverização"
        afterLabel="Depois da pulverização"
      />,
    );

    expect(
      screen.getByText("Antes da pulverização"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Depois da pulverização"),
    ).toBeInTheDocument();
  });

  it("expõe input range para controle por teclado (acessibilidade)", () => {
    // Cenário: usuário com leitor de tela ou teclado precisa
    // acessar o slider. O componente usa <input type="range">
    // invisível mas acessível via role="slider".
    render(
      <BeforeAfterComparison
        beforeUrl="/a.jpg"
        afterUrl="/b.jpg"
      />,
    );

    expect(screen.getByRole("slider")).toBeInTheDocument();
  });
});
