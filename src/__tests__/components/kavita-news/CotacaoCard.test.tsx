import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PublicCotacao } from "@/lib/newsPublicApi";
import { CotacaoCard } from "@/components/news/CotacaoCard";

// CotacaoCard foi reescrito para layout dark-glass editorial. Mudanças:
//   - Eyebrow agora e source (ou "Mercado" como fallback), nao
//     "Preço" / "Mercado • Tipo - "
//   - Variacao virou chip "▲ +X%" / "▼ -X%" (sem prefixo "Dia:")
//   - Preço e exibido herói com tipografia 3xl; sem label "Preço"
//   - Quando nao ha preço, texto e "Preço ainda não disponível"
//   - Rodapé tem trend (livre) + timestamp; sem "Atualização: indisponível"
//   - "Fonte: -" sumiu (source virou eyebrow)

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

function makeItem(partial: Partial<PublicCotacao> = {}): PublicCotacao {
  return {
    id: 1,
    slug: "cafe-arabica",
    name: "Café Arábica",
    group_key: "Café",
    market: "BR",
    type: "Spot",
    price: "1234.5",
    unit: "R$/sc",
    variation_day: "1.25",
    source: "CEPEA",
    last_update_at: "2025-12-19T13:31:51.000Z",
    ...partial,
  } as PublicCotacao;
}

describe("CotacaoCard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza link com aria-label e href corretos", () => {
    const item = makeItem({ slug: "milho", name: "Milho" });
    render(<CotacaoCard item={item} />);

    const link = screen.getByRole("link", {
      name: "Ver detalhes da cotação: Milho",
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/news/cotacoes/milho");
    expect(link.textContent).toContain("Milho");
  });

  it("renderiza eyebrow com source simplificado quando slug está mapeado", () => {
    // simplifySource("cafe-arabica") -> "ICE/Nova York" (mapeamento conhecido)
    const item = makeItem({ slug: "cafe-arabica" });
    render(<CotacaoCard item={item} />);
    expect(screen.getByText(/ICE\/Nova York/)).toBeInTheDocument();
  });

  it("usa fallback '-' como eyebrow quando source for ausente e slug não mapeado", () => {
    // simplifySource("algodao", null) -> "-" (helper de cotacoes.ts).
    // O template usa `{source || "Mercado"}` mas "-" e truthy, entao
    // o card mostra literalmente "-" no eyebrow.
    const item = makeItem({ slug: "algodao", source: null as any });
    render(<CotacaoCard item={item} />);
    // Pelo menos um "-" no eyebrow (pode coexistir com "—" do timestamp).
    const dashes = screen.getAllByText(/^-$/);
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza nome do item no titulo", () => {
    const item = makeItem({ name: "Soja Futura" });
    render(<CotacaoCard item={item} />);
    expect(screen.getByText("Soja Futura")).toBeInTheDocument();
  });

  it("renderiza chip de variação positiva com ▲ e sinal '+'", () => {
    const item = makeItem({ variation_day: "1.25" as any });
    render(<CotacaoCard item={item} />);
    expect(screen.getByText("▲")).toBeInTheDocument();
    // formatPct retorna algo como "+1,25%" ou "+1.25%" — checa apenas o sinal +
    expect(screen.getByText(/\+/)).toBeInTheDocument();
  });

  it("renderiza chip de variação negativa com ▼", () => {
    const item = makeItem({ variation_day: "-2.5" as any });
    render(<CotacaoCard item={item} />);
    expect(screen.getByText("▼")).toBeInTheDocument();
  });

  it("não renderiza chip de variação quando variation_day for inválida", () => {
    const item = makeItem({ variation_day: null as any });
    render(<CotacaoCard item={item} />);
    expect(screen.queryByText("▲")).not.toBeInTheDocument();
    expect(screen.queryByText("▼")).not.toBeInTheDocument();
  });

  it("renderiza preço formatado e unidade quando price valido", () => {
    const item = makeItem({ price: "1234.5" as any, unit: "R$/sc" });
    render(<CotacaoCard item={item} />);
    expect(screen.getByText("R$/sc")).toBeInTheDocument();
    // formatPrice usa Intl.NumberFormat pt-BR; o numero formatado contem
    // "1.234" (separador de milhar) ou similar — checamos o digito raiz.
    expect(screen.getByText(/1\.?234/)).toBeInTheDocument();
  });

  it("renderiza fallback 'Preço ainda não disponível' quando price for null", () => {
    const item = makeItem({ price: null as any });
    render(<CotacaoCard item={item} />);
    expect(
      screen.getByText("Preço ainda não disponível"),
    ).toBeInTheDocument();
  });

  it("renderiza fallback 'Preço ainda não disponível' quando price for string vazia", () => {
    const item = makeItem({ price: "" as any });
    render(<CotacaoCard item={item} />);
    expect(
      screen.getByText("Preço ainda não disponível"),
    ).toBeInTheDocument();
  });

  it("renderiza timestamp de atualização no rodapé quando data válida", () => {
    const dtSpy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(function (this: any) {
        return { format: () => "19/12/2025" } as any;
      } as any);

    const item = makeItem({ last_update_at: "2025-12-19T13:31:51.000Z" });
    render(<CotacaoCard item={item} />);

    // O texto do rodape e gerado por formatDatePtBR; pode incluir prefixo
    // "Atualizado em" ou outras variantes — usamos regex para robustez.
    const elements = screen.getAllByText(/19\/12\/2025/i);
    expect(elements.length).toBeGreaterThanOrEqual(1);
    expect(dtSpy).toHaveBeenCalled();
  });

  it("renderiza '—' como fallback de timestamp quando data ausente/inválida", () => {
    const item = makeItem({ last_update_at: null as any });
    render(<CotacaoCard item={item} />);
    // Em-dash unicode; ha pelo menos uma ocorrencia (rodape).
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });
});
