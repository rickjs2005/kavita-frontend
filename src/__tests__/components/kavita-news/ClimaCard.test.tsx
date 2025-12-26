import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PublicClima } from "@/lib/newsPublicApi";
import { ClimaCard } from "@/components/news/ClimaCard";

// Mock de next/link para virar <a> no jsdom
vi.mock("next/link", () => {
  return {
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
  };
});

function makeItem(partial: Partial<PublicClima> = {}): PublicClima {
  return {
    id: 1,
    city_name: "Santana do Manhuaçu",
    slug: "santana-do-manhuacu",
    uf: "MG",
    mm_24h: "0.2",
    mm_7d: "101.1",
    source: "OPEN_METEO",
    last_update_at: "2025-12-19T13:31:51.000Z",
    ...partial,
  } as PublicClima;
}

describe("ClimaCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve renderizar link com href e aria-label corretos (positivo)", () => {
    const item = makeItem({
      city_name: "Matipó",
      uf: "MG",
      slug: "matipo",
    });

    render(<ClimaCard item={item} />);

    const link = screen.getByRole("link", {
      name: "Ver detalhes do clima em Matipó-MG",
    });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/news/clima/matipo");

    // Conteúdo principal (robusto contra texto "quebrado" por spans/whitespace)
    expect(link.textContent).toContain("Matipó");
    expect(link.textContent).toContain("MG");

    expect(
      screen.getByText("Monitoramento de chuva (24h e 7 dias).")
    ).toBeInTheDocument();
    expect(screen.getByText("Atualização contínua")).toBeInTheDocument();
    expect(screen.getByText("Ver detalhes")).toBeInTheDocument();
  });

  it("deve formatar mm (numérico) com 2 casas decimais e exibir unidade mm (positivo)", () => {
    const item = makeItem({
      mm_24h: 0.2 as any,
      mm_7d: "101.1" as any,
    });

    render(<ClimaCard item={item} />);

    expect(screen.getByText("24h")).toBeInTheDocument();
    expect(screen.getByText("0.20")).toBeInTheDocument();

    expect(screen.getByText("7d")).toBeInTheDocument();
    expect(screen.getByText("101.10")).toBeInTheDocument();

    const units = screen.getAllByText("mm");
    expect(units.length).toBeGreaterThanOrEqual(2);
  });

  it("deve renderizar '-' quando mm for null/undefined/string vazia (negativo)", () => {
    const item = makeItem({
      mm_24h: null as any,
      mm_7d: "" as any,
    });

    render(<ClimaCard item={item} />);

    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("deve renderizar string original quando mm for não-numérico (negativo)", () => {
    const item = makeItem({
      mm_24h: "N/A" as any,
      mm_7d: "abc" as any,
    });

    render(<ClimaCard item={item} />);

    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.getByText("abc")).toBeInTheDocument();
  });

  it("deve exibir 'Fonte: -' quando source estiver ausente (negativo)", () => {
    const item = makeItem({ source: null as any });

    render(<ClimaCard item={item} />);

    expect(screen.getByText("Fonte: -")).toBeInTheDocument();
  });

  it("deve exibir 'Fonte: X' quando source estiver presente (positivo)", () => {
    const item = makeItem({ source: "INMET" as any });

    render(<ClimaCard item={item} />);

    expect(screen.getByText("Fonte: INMET")).toBeInTheDocument();
  });

  it("deve exibir 'Atualização: indisponível' quando last_update_at for vazio (negativo)", () => {
    const item = makeItem({ last_update_at: null as any });

    render(<ClimaCard item={item} />);

    expect(screen.getByText("Atualização: indisponível")).toBeInTheDocument();
  });

  it("deve exibir valor retornado por Intl.DateTimeFormat quando data for válida (positivo/controle estável)", () => {
    // precisa ser "newable": use function, não arrow
    const fmtSpy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(function (this: any) {
        return { format: () => "DATA_FORMATADA" } as any;
      } as any);

    const item = makeItem({ last_update_at: "2025-12-19T13:31:51.000Z" });

    render(<ClimaCard item={item} />);

    expect(screen.getByText("Atualizado: DATA_FORMATADA")).toBeInTheDocument();
    expect(fmtSpy).toHaveBeenCalled();
  });

  it("deve cair no fallback e exibir string original quando last_update_at for inválida (negativo)", () => {
    const item = makeItem({ last_update_at: "data-invalida" as any });

    render(<ClimaCard item={item} />);

    expect(screen.getByText("Atualizado: data-invalida")).toBeInTheDocument();
  });
});
