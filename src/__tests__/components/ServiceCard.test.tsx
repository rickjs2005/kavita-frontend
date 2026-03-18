// src/__tests__/components/ServiceCard.test.tsx
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ServiceCard from "@/components/layout/ServiceCard";

// absUrl: pass-through para URLs já absolutas/paths; null → placeholder
vi.mock("@/utils/absUrl", () => ({
  absUrl: (raw: string | null | undefined) => raw ?? "/placeholder.png",
}));

/**
 * Mock do next/link (renderiza <a>)
 */
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => {
    const resolvedHref =
      typeof href === "string"
        ? href
        : href?.pathname || href?.toString?.() || "#";

    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
}));

const baseServico = {
  id: 1,
  nome: "Serviço de Pulverização",
  categoria: "Pulverização",
  cargo: "Técnico Agrícola",
  descricao: "Descrição do serviço",
  // Observação: pelo DOM do erro atual, o componente NÃO está renderizando WhatsApp/link.
  // Mantemos campos comuns, mas o teste não assume CTA se o componente não renderiza.
  telefone: "(31) 99999-9999",
  imagem_capa: "/placeholder.png",
  fotos: ["/placeholder.png", "/1.jpg", "/2.jpg"],
  rating_avg: 4.5,
  rating_count: 12,
  verificado: 1,
};

function renderCard(props?: Partial<React.ComponentProps<typeof ServiceCard>>) {
  return render(
    <ServiceCard servico={baseServico as any} readOnly={false} {...props} />,
  );
}

describe("ServiceCard (src/components/layout/ServiceCard.tsx)", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza informações básicas do serviço (controle)", () => {
    renderCard({ readOnly: true });

    expect(
      screen.getByRole("heading", { name: /Serviço de Pulverização/i }),
    ).toBeInTheDocument();

    expect(screen.getByText(/Cargo:/i)).toBeInTheDocument();
    expect(screen.getByText(/Técnico Agrícola/i)).toBeInTheDocument();
    expect(screen.getByText(/Descrição do serviço/i)).toBeInTheDocument();
  });

  it("exibe bloco de avaliação quando rating_avg e rating_count existem (positivo)", () => {
    renderCard({ readOnly: true });

    // 1) Nota 4.5 existe, mas pode estar junto com a estrela e quebrada em whitespace.
    // Pegamos o elemento MAIS específico possível: um <span> cujo textContent contenha "4.5".
    const ratingSpan = screen.getByText((_, el) => {
      if (!el) return false;
      if (el.tagName.toLowerCase() !== "span") return false;
      const t = (el.textContent ?? "").replace(/\s+/g, " ").trim();
      return t.includes("4.5");
    });
    expect(ratingSpan).toBeInTheDocument();

    // 2) Count: "(12 avaliações)" está quebrado em múltiplos nós (12 + "avalia" + "s").
    // Então checamos pelo container <span> cinza que contenha "12" e "avalia".
    const countSpan = screen.getByText((_, el) => {
      if (!el) return false;
      if (el.tagName.toLowerCase() !== "span") return false;
      const t = (el.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      return t.includes("12") && t.includes("avalia");
    });
    expect(countSpan).toBeInTheDocument();
  });

  it("não exibe bloco de avaliação quando rating não existe (negativo)", () => {
    render(
      <ServiceCard
        servico={
          { ...baseServico, rating_avg: null, rating_count: null } as any
        }
        readOnly
      />,
    );

    // Sem ⭐ no DOM quando não há rating (ajuste se seu componente ainda renderiza estrela vazia).
    expect(
      screen.queryByText((_, el) => (el?.textContent ?? "").includes("⭐")),
    ).not.toBeInTheDocument();
  });

  it("quando há href, o card inteiro vira link", () => {
    renderCard({ href: "/servicos/1", readOnly: true });

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/servicos/1");
  });

  it("exibe botões Editar e Remover quando readOnly=false", () => {
    renderCard({ readOnly: false });

    expect(screen.getByRole("button", { name: /Editar/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Remover/i }),
    ).toBeInTheDocument();
  });

  it("não renderiza CTA de WhatsApp quando o componente não expõe link (controle)", () => {
    renderCard({ readOnly: true });

    // Pelo DOM atual, não há nenhum <a> com WhatsApp.
    expect(
      screen.queryByRole("link", { name: /WhatsApp/i }),
    ).not.toBeInTheDocument();
  });

  it("não renderiza contador de fotos quando o componente não expõe esse badge (controle)", () => {
    renderCard({ readOnly: true });

    // Pelo DOM atual, não existe badge "foto(s)" — baseServico usa campos errados
    // (imagem_capa / fotos / telefone) que não correspondem ao tipo Service real.
    expect(
      screen.queryByText((_, el) => {
        const t = (el?.textContent ?? "").replace(/\s+/g, " ").toLowerCase();
        return t.includes("foto");
      }),
    ).not.toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Testes com campos corretos do tipo Service real (imagem / images / whatsapp)
// ─────────────────────────────────────────────────────────────────────────────
describe("ServiceCard — campos reais do tipo Service", () => {
  beforeEach(() => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "open").mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const realServico = {
    id: 10,
    nome: "Pulverização Aérea",
    descricao: "Serviço profissional de pulverização",
    cargo: "Piloto Agrícola",
    imagem: "/uploads/services/main.jpg",
    images: ["/uploads/services/main.jpg", "/uploads/services/extra1.jpg", "/uploads/services/extra2.jpg"],
    whatsapp: "31999990000",
    especialidade_nome: "Aviação Agrícola",
  };

  it("retorna null quando servico não é fornecido (negativo)", () => {
    const { container } = render(<ServiceCard />);
    expect(container.firstChild).toBeNull();
  });

  it("retorna null quando servico=null explícito (negativo)", () => {
    const { container } = render(<ServiceCard servico={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renderiza imagem principal com src correto quando imagem está no campo certo", () => {
    render(<ServiceCard servico={realServico as any} readOnly />);

    // A imagem ativa (main) deve ter o src certo
    const imgs = screen.getAllByRole("img");
    const mainImg = imgs.find((img) =>
      img.getAttribute("alt") === "Pulverização Aérea",
    );
    expect(mainImg).toBeInTheDocument();
    expect(mainImg!.getAttribute("src")).toBe("/uploads/services/main.jpg");
  });

  it("usa /placeholder.png quando imagem e images estão ausentes", () => {
    const minimal = { id: 5, nome: "Serviço Mínimo" };
    render(<ServiceCard servico={minimal as any} readOnly />);

    const imgs = screen.getAllByRole("img");
    const main = imgs.find((img) => img.getAttribute("alt") === "Serviço Mínimo");
    expect(main!.getAttribute("src")).toBe("/placeholder.png");
  });

  it("renderiza badge de múltiplas fotos quando há mais de 1 imagem", () => {
    render(<ServiceCard servico={realServico as any} readOnly />);

    // Badge "3 foto(s)" — o componente renderiza {images.length} foto(s) em um <span>
    expect(screen.getByText("3 foto(s)")).toBeInTheDocument();
  });

  it("renderiza miniaturas da galeria quando há múltiplas imagens", () => {
    render(<ServiceCard servico={realServico as any} readOnly />);

    const thumbs = screen.getAllByAltText(/Miniatura/i);
    expect(thumbs).toHaveLength(3);
  });

  it("renderiza especialidade_nome como badge quando presente", () => {
    render(<ServiceCard servico={realServico as any} readOnly />);

    expect(screen.getByText("Aviação Agrícola")).toBeInTheDocument();
  });

  it("não renderiza badge de especialidade quando ausente", () => {
    const sem = { ...realServico, especialidade_nome: undefined };
    render(<ServiceCard servico={sem as any} readOnly />);

    expect(screen.queryByText("Aviação Agrícola")).not.toBeInTheDocument();
  });

  it("renderiza WhatsApp como <a> quando não há href no card", () => {
    render(<ServiceCard servico={realServico as any} readOnly />);

    const wa = screen.getByRole("link", { name: /WhatsApp/i });
    expect(wa).toBeInTheDocument();
    expect(wa.getAttribute("href")).toContain("31999990000");
  });

  it("renderiza WhatsApp como <button> (window.open) quando card tem href", () => {
    render(<ServiceCard servico={realServico as any} href="/servicos/10" readOnly />);

    // O card inteiro vira link; WhatsApp deve ser <button>, não <a>
    const waBtn = screen.getByRole("button", { name: /WhatsApp/i });
    expect(waBtn).toBeInTheDocument();

    fireEvent.click(waBtn);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining("31999990000"),
      "_blank",
    );
  });

  it("não renderiza WhatsApp quando whatsapp está ausente", () => {
    const semWa = { ...realServico, whatsapp: undefined };
    render(<ServiceCard servico={semWa as any} readOnly />);

    expect(screen.queryByText(/WhatsApp/i)).not.toBeInTheDocument();
  });

  it("chama onEditar com o servico ao clicar em Editar (positivo)", () => {
    const onEditar = vi.fn();
    render(<ServiceCard servico={realServico as any} onEditar={onEditar} />);

    fireEvent.click(screen.getByRole("button", { name: /Editar/i }));

    expect(onEditar).toHaveBeenCalledTimes(1);
    expect(onEditar).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10, nome: "Pulverização Aérea" }),
    );
  });

  it("chama onRemover com o id ao clicar em Remover e confirmar (positivo)", async () => {
    const onRemover = vi.fn().mockResolvedValue(undefined);
    const { act } = await import("@testing-library/react");
    render(
      <ServiceCard servico={realServico as any} onRemover={onRemover} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Remover/i }));
    });

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(onRemover).toHaveBeenCalledWith(10);
  });

  it("não chama onRemover quando usuário cancela o confirm (negativo)", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const onRemover = vi.fn();
    render(
      <ServiceCard servico={realServico as any} onRemover={onRemover} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Remover/i }));

    expect(onRemover).not.toHaveBeenCalled();
  });

  it("não crasha com servico com campos opcionais ausentes (mínimo: id + nome)", () => {
    const minimal = { id: 99, nome: "Só o básico" };
    expect(() =>
      render(<ServiceCard servico={minimal as any} readOnly />),
    ).not.toThrow();
    expect(screen.getByRole("heading", { name: /Só o básico/i })).toBeInTheDocument();
  });
});
