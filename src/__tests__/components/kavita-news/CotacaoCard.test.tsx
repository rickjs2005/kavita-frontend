import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PublicCotacao } from "@/lib/newsPublicApi";
import { CotacaoCard } from "@/components/news/CotacaoCard";

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

  it("deve renderizar link com href e aria-label corretos (positivo)", () => {
    const item = makeItem({ slug: "milho", name: "Milho" });

    render(<CotacaoCard item={item} />);

    const link = screen.getByRole("link", {
      name: "Ver detalhes da cotação: Milho",
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/news/cotacoes/milho");

    // Conteúdo base
    expect(link.textContent).toContain("Milho");
    expect(screen.getByText("Preço")).toBeInTheDocument();
    expect(screen.getByText("Ver detalhes")).toBeInTheDocument();
  });

  it("deve usar emoji de mercado no título (café -> ☕) (positivo)", () => {
    const item = makeItem({ slug: "cafe-arabica", name: "Café Arábica" });

    render(<CotacaoCard item={item} />);

    // Título é "☕ Café Arábica" (texto pode ter espaço, então checamos contains no link)
    const link = screen.getByRole("link", {
      name: `Ver detalhes da cotação: ${item.name}`,
    });
    expect(link.textContent).toContain("☕");
    expect(link.textContent).toContain("Café Arábica");
  });

  it("deve escolher emoji correto por palavras-chave (milho -> 🌽, soja -> 🫘, boi -> 🐂, dolar -> 💵) (positivo)", () => {
    const cases: Array<{ item: Partial<PublicCotacao>; emoji: string }> = [
      // Importante: evitar conter "café" no hay (group_key default do makeItem)
      {
        item: { slug: "milho", name: "Milho", group_key: "Grãos" },
        emoji: "🌽",
      },
      { item: { slug: "soja", name: "Soja", group_key: "Grãos" }, emoji: "🫘" },
      {
        item: {
          slug: "arroba-do-boi-gordo",
          name: "Arroba do Boi Gordo",
          group_key: "Pecuária",
        },
        emoji: "🐂",
      },
      {
        item: { slug: "dolar-ptax", name: "Dólar PTAX", group_key: "Câmbio" },
        emoji: "💵",
      },
    ];

    for (const c of cases) {
      render(<CotacaoCard item={makeItem(c.item)} />);
      const link = screen.getByRole("link", {
        name: `Ver detalhes da cotação: ${c.item.name}`,
      });
      expect(link.textContent).toContain(c.emoji);
    }
  });

  it("deve cair no emoji default 🏷 quando não identificar mercado (negativo/controle)", () => {
    const item = makeItem({
      slug: "algodao",
      name: "Algodão",
      group_key: "Fibra",
    });

    render(<CotacaoCard item={item} />);

    const link = screen.getByRole("link", {
      name: `Ver detalhes da cotação: ${item.name}`,
    });
    expect(link.textContent).toContain("🏷");
    expect(link.textContent).toContain("Algodão");
  });

  it("deve renderizar group_key e type com fallback quando ausentes (negativo)", () => {
    const item = makeItem({ group_key: null as any, type: null as any });

    render(<CotacaoCard item={item} />);

    // "Mercado • Tipo -"
    expect(screen.getByText(/Mercado • Tipo -/)).toBeInTheDocument();
  });

  it("deve renderizar Fonte: X quando source existir; senão Fonte: - (positivo/negativo)", () => {
    const withSource = makeItem({ source: "BCB" as any });
    render(<CotacaoCard item={withSource} />);
    expect(screen.getByText("Fonte: BCB")).toBeInTheDocument();

    const withoutSource = makeItem({
      source: null as any,
      slug: "soja2",
      name: "Soja 2",
    });
    render(<CotacaoCard item={withoutSource} />);
    expect(screen.getAllByText("Fonte: -").length).toBeGreaterThanOrEqual(1);

    // Ícone 🌍 é aria-hidden, então não testamos via role; apenas garantimos que o chip existe
    expect(screen.getAllByText(/Fonte:/).length).toBeGreaterThanOrEqual(2);
  });

  it("deve formatar preço numérico com Intl.NumberFormat (pt-BR) e 2 casas (positivo/estável)", () => {
    const nfSpy = vi.spyOn(Intl, "NumberFormat").mockImplementation(function (
      this: any,
    ) {
      return { format: () => "1.234,50" } as any;
    } as any);

    const item = makeItem({ price: "1234.5" as any });

    render(<CotacaoCard item={item} />);

    expect(screen.getByText("1.234,50")).toBeInTheDocument();
    expect(nfSpy).toHaveBeenCalled();
  });

  it("deve renderizar '-' quando price for null/undefined/string vazia (negativo)", () => {
    const item1 = makeItem({ price: null as any });
    render(<CotacaoCard item={item1} />);
    expect(screen.getByText("-")).toBeInTheDocument();

    const item2 = makeItem({ price: "" as any, slug: "x2", name: "X2" });
    render(<CotacaoCard item={item2} />);
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("deve renderizar string original quando price for não-numérico (negativo)", () => {
    const item = makeItem({ price: "N/A" as any });

    render(<CotacaoCard item={item} />);

    expect(screen.getByText("N/A")).toBeInTheDocument();
  });

  it("deve renderizar unidade quando unit existir e string vazia quando não existir (positivo/negativo)", () => {
    const item = makeItem({ unit: "R$/sc" });
    render(<CotacaoCard item={item} />);
    expect(screen.getByText("R$/sc")).toBeInTheDocument();

    const item2 = makeItem({ unit: null as any, slug: "x3", name: "X3" });
    render(<CotacaoCard item={item2} />);

    // Quando unit é null, o componente renderiza "" (sem texto).
    // Validação: o bloco de preço continua existindo e não quebra.
    expect(screen.getAllByText("Preço").length).toBeGreaterThanOrEqual(2);
  });

  it("deve renderizar variação do dia com sinal '+' para positivo e emoji 📈 (positivo)", () => {
    const item = makeItem({ variation_day: "1.2" as any });

    render(<CotacaoCard item={item} />);

    expect(screen.getByText("Dia: +1.20%")).toBeInTheDocument();
    // Emoji de variação é aria-hidden, mas ainda é texto no DOM
    expect(screen.getByText("📈")).toBeInTheDocument();
  });

  it("deve renderizar variação do dia negativa sem '+' e emoji 📉 (negativo/controle)", () => {
    const item = makeItem({ variation_day: "-2.5" as any });

    render(<CotacaoCard item={item} />);

    expect(screen.getByText("Dia: -2.50%")).toBeInTheDocument();
    expect(screen.getByText("📉")).toBeInTheDocument();
  });

  it("deve renderizar variação do dia como 0.00% e sem emoji quando variação = 0 (controle)", () => {
    const item = makeItem({ variation_day: 0 as any });

    render(<CotacaoCard item={item} />);

    expect(screen.getByText("Dia: 0.00%")).toBeInTheDocument();
    expect(screen.queryByText("📈")).not.toBeInTheDocument();
    expect(screen.queryByText("📉")).not.toBeInTheDocument();
  });

  it("deve renderizar '-' quando variation_day for inválida (null/undefined/vazia/não-numérica) (negativo)", () => {
    const itemNull = makeItem({ variation_day: null as any });
    render(<CotacaoCard item={itemNull} />);
    expect(screen.getByText("Dia: -")).toBeInTheDocument();

    const itemEmpty = makeItem({
      variation_day: "" as any,
      slug: "v2",
      name: "V2",
    });
    render(<CotacaoCard item={itemEmpty} />);
    expect(screen.getAllByText("Dia: -").length).toBeGreaterThanOrEqual(2);

    const itemNaN = makeItem({
      variation_day: "abc" as any,
      slug: "v3",
      name: "V3",
    });
    render(<CotacaoCard item={itemNaN} />);
    expect(screen.getAllByText("Dia: -").length).toBeGreaterThanOrEqual(3);
  });

  it("deve exibir 'Atualização: indisponível' quando last_update_at estiver ausente (negativo)", () => {
    const item = makeItem({ last_update_at: null as any });

    render(<CotacaoCard item={item} />);

    expect(screen.getByText("Atualização: indisponível")).toBeInTheDocument();
  });

  it("deve exibir valor retornado por Intl.DateTimeFormat quando data for válida (positivo/estável)", () => {
    const dtSpy = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function (
      this: any,
    ) {
      return { format: () => "DATA_PTBR" } as any;
    } as any);

    const item = makeItem({ last_update_at: "2025-12-19T13:31:51.000Z" });

    render(<CotacaoCard item={item} />);

    // O componente renderiza: "⏱ Atualizado: DATA_PTBR"
    expect(screen.getByText(/Atualizado: DATA_PTBR/)).toBeInTheDocument();
    expect(dtSpy).toHaveBeenCalled();
  });

  it("deve cair no fallback e exibir string original quando last_update_at for inválida (negativo)", () => {
    const item = makeItem({ last_update_at: "data-invalida" as any });

    render(<CotacaoCard item={item} />);

    expect(screen.getByText(/Atualizado: data-invalida/)).toBeInTheDocument();
  });

  it("deve renderizar texto extra em mobile quando variação estiver flat (0) (controle)", () => {
    const item = makeItem({ variation_day: 0 as any });

    render(<CotacaoCard item={item} />);

    expect(
      screen.getByText("Sem variação relevante no dia."),
    ).toBeInTheDocument();
  });

  it("não deve renderizar texto extra quando variação não for flat (positivo/negativo)", () => {
    const up = makeItem({ variation_day: 1 as any });
    render(<CotacaoCard item={up} />);
    expect(
      screen.queryByText("Sem variação relevante no dia."),
    ).not.toBeInTheDocument();

    const down = makeItem({
      variation_day: -1 as any,
      slug: "down",
      name: "Down",
    });
    render(<CotacaoCard item={down} />);
    expect(
      screen.queryByText("Sem variação relevante no dia."),
    ).not.toBeInTheDocument();

    const invalid = makeItem({
      variation_day: null as any,
      slug: "inv",
      name: "Inv",
    });
    render(<CotacaoCard item={invalid} />);
    expect(
      screen.queryByText("Sem variação relevante no dia."),
    ).not.toBeInTheDocument();
  });
});
