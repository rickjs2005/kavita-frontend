import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PublicClima } from "@/lib/newsPublicApi";
import { ClimaCard } from "@/components/news/ClimaCard";

// ClimaCard foi reescrito para layout dark-glass com accent sky-400.
// Mudanças relevantes nos textos/contratos:
//   - Eyebrow virou "Monitoramento de chuva" (sem o sufixo "(24h e 7 dias).")
//   - Pill "Ao vivo" + chip de fonte (em vez de "Atualização contínua")
//   - CTA virou "Detalhes" (em vez de "Ver detalhes")
//   - formatMm usa toFixed(1) e fallback "—" (em-dash unicode), nao "-"
//   - Rodapé virou "Atualizado <data>" (sem ":") ou "Indisponível"
//   - Nao ha mais texto "Fonte: X"; source aparece como pill independente

vi.mock("next/link", () => ({
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

  it("renderiza link com href e aria-label corretos", () => {
    const item = makeItem({ city_name: "Matipó", uf: "MG", slug: "matipo" });
    render(<ClimaCard item={item} />);

    const link = screen.getByRole("link", {
      name: "Ver detalhes do clima em Matipó-MG",
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/news/clima/matipo");
    expect(link.textContent).toContain("Matipó");
    expect(link.textContent).toContain("MG");
    // Eyebrow + CTA do rodape.
    expect(screen.getByText("Monitoramento de chuva")).toBeInTheDocument();
    expect(screen.getByText("Detalhes")).toBeInTheDocument();
  });

  it("formata mm (numérico) com 1 casa decimal e exibe unidade mm", () => {
    const item = makeItem({ mm_24h: 0.2 as any, mm_7d: "101.1" as any });
    render(<ClimaCard item={item} />);

    expect(screen.getByText("24h")).toBeInTheDocument();
    expect(screen.getByText("0.2")).toBeInTheDocument();
    expect(screen.getByText("7d")).toBeInTheDocument();
    expect(screen.getByText("101.1")).toBeInTheDocument();

    const units = screen.getAllByText("mm");
    expect(units.length).toBeGreaterThanOrEqual(2);
  });

  it("renderiza fallback '—' quando mm for null/undefined/string vazia", () => {
    const item = makeItem({ mm_24h: null as any, mm_7d: "" as any });
    render(<ClimaCard item={item} />);
    // Fallback agora e em-dash unicode "—" (single char), em vez de "-".
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("renderiza string original quando mm for não-numérico", () => {
    const item = makeItem({ mm_24h: "N/A" as any, mm_7d: "abc" as any });
    render(<ClimaCard item={item} />);
    expect(screen.getByText("N/A")).toBeInTheDocument();
    expect(screen.getByText("abc")).toBeInTheDocument();
  });

  it("renderiza pill de fonte quando source estiver presente", () => {
    const item = makeItem({ source: "INMET" as any });
    render(<ClimaCard item={item} />);
    // Source agora vira chip standalone (sem prefixo "Fonte:").
    expect(screen.getByText("INMET")).toBeInTheDocument();
  });

  it("não renderiza pill de fonte quando source for ausente", () => {
    const item = makeItem({ source: null as any });
    render(<ClimaCard item={item} />);
    // Pill "Ao vivo" continua, mas nao ha pill com nome de fonte.
    expect(screen.getByText(/Ao vivo/i)).toBeInTheDocument();
    // Garantia minima: nao ha texto literal "Fonte:".
    expect(screen.queryByText(/Fonte:/i)).not.toBeInTheDocument();
  });

  it("exibe 'Indisponível' quando last_update_at for vazio", () => {
    const item = makeItem({ last_update_at: null as any });
    render(<ClimaCard item={item} />);
    expect(screen.getByText("Indisponível")).toBeInTheDocument();
  });

  it("exibe valor formatado por Intl.DateTimeFormat quando data válida", () => {
    const fmtSpy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(function (this: any) {
        return { format: () => "DATA_FORMATADA" } as any;
      } as any);

    const item = makeItem({ last_update_at: "2025-12-19T13:31:51.000Z" });
    render(<ClimaCard item={item} />);

    // Texto: "Atualizado <data>" (sem ":" agora).
    expect(screen.getByText(/Atualizado DATA_FORMATADA/)).toBeInTheDocument();
    expect(fmtSpy).toHaveBeenCalled();
  });

  it("cai no fallback e exibe string original quando last_update_at for inválida", () => {
    const item = makeItem({ last_update_at: "data-invalida" as any });
    render(<ClimaCard item={item} />);
    expect(screen.getByText(/Atualizado data-invalida/)).toBeInTheDocument();
  });
});
