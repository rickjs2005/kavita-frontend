/**
 * AtalhoAjuda.test.tsx
 *
 * Cobertura:
 * - Renderizacao com topicos default (estatico)
 * - Renderizacao com topicos do config
 * - Toggle de topico (expand/collapse)
 * - Busca filtra resultados
 * - Sem resultados na busca → CTA para formulario
 * - Tracking de eventos (mock)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AtalhoAjuda from "@/app/contato/components/AtalhoAjuda";

const trackMock = vi.fn();

vi.mock("../../../app/contato/trackContatoEvent", () => ({
  trackContatoEvent: (...args: unknown[]) => trackMock(...args),
}));

describe("AtalhoAjuda", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza titulo padrao da secao", () => {
    render(<AtalhoAjuda />);

    expect(screen.getByText(/Duvidas frequentes/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Buscar por tema, palavra-chave ou duvida/i)
    ).toBeInTheDocument();
  });

  it("usa titulo e subtitulo do config quando fornecido", () => {
    render(
      <AtalhoAjuda
        config={
          {
            faq_title: "Central de Ajuda Customizada",
            faq_subtitle: "Subtitulo customizado",
          } as any
        }
      />
    );

    expect(screen.getByText("Central de Ajuda Customizada")).toBeInTheDocument();
    expect(screen.getByText("Subtitulo customizado")).toBeInTheDocument();
  });

  it("renderiza topicos default quando nao ha config de topicos", () => {
    render(<AtalhoAjuda />);

    // Topicos do topics.ts estatico — pelo menos 1 dos 4 destacados deve aparecer
    const allButtons = screen.getAllByRole("button");
    const hasTopicCards = allButtons.length > 1;
    expect(hasTopicCards).toBe(true);
  });

  it("usa topicos do config quando fornecido", () => {
    const customTopics = [
      {
        title: "Topico Custom 1",
        description: "Descricao 1",
        content: ["Paragrafo 1"],
        icon: "",
        priority: 1,
        active: true,
        highlighted: true,
      },
      {
        title: "Topico Custom 2",
        description: "Descricao 2",
        content: ["Paragrafo 2"],
        icon: "",
        priority: 2,
        active: true,
        highlighted: true,
      },
    ];

    render(<AtalhoAjuda config={{ faq_topics: customTopics } as any} />);

    expect(screen.getByText("Topico Custom 1")).toBeInTheDocument();
    expect(screen.getByText("Topico Custom 2")).toBeInTheDocument();
  });

  it("filtra topicos inativos (active: false)", () => {
    const customTopics = [
      {
        title: "Topico Ativo",
        description: "ok",
        content: [],
        icon: "",
        priority: 1,
        active: true,
        highlighted: true,
      },
      {
        title: "Topico Inativo",
        description: "off",
        content: [],
        icon: "",
        priority: 2,
        active: false,
        highlighted: true,
      },
    ];

    render(<AtalhoAjuda config={{ faq_topics: customTopics } as any} />);

    expect(screen.getByText("Topico Ativo")).toBeInTheDocument();
    expect(screen.queryByText("Topico Inativo")).not.toBeInTheDocument();
  });

  it("clicar em topico expande conteudo e dispara evento de tracking", () => {
    const customTopics = [
      {
        title: "Topico A",
        description: "desc",
        content: ["Resposta detalhada do topico A."],
        icon: "",
        priority: 1,
        active: true,
        highlighted: true,
      },
    ];

    render(<AtalhoAjuda config={{ faq_topics: customTopics } as any} />);

    const button = screen.getByText("Topico A");
    fireEvent.click(button);

    expect(screen.getByText("Resposta detalhada do topico A.")).toBeInTheDocument();
    expect(trackMock).toHaveBeenCalledWith("faq_topic_view", "Topico A");
  });

  it("busca filtra resultados em tempo real", () => {
    const customTopics = [
      {
        title: "Politica de Entrega",
        description: "Como funciona",
        content: [],
        icon: "",
        priority: 1,
        active: true,
        highlighted: true,
      },
      {
        title: "Pagamentos",
        description: "Formas",
        content: [],
        icon: "",
        priority: 2,
        active: true,
        highlighted: true,
      },
    ];

    render(<AtalhoAjuda config={{ faq_topics: customTopics } as any} />);

    const search = screen.getByPlaceholderText(/Buscar por tema/i);
    fireEvent.change(search, { target: { value: "entrega" } });

    expect(screen.getByText("Politica de Entrega")).toBeInTheDocument();
    expect(screen.queryByText("Pagamentos")).not.toBeInTheDocument();
  });

  it("busca sem resultados → mostra CTA para formulario", () => {
    const customTopics = [
      {
        title: "Topico A",
        description: "x",
        content: [],
        icon: "",
        priority: 1,
        active: true,
        highlighted: true,
      },
    ];

    render(<AtalhoAjuda config={{ faq_topics: customTopics } as any} />);

    const search = screen.getByPlaceholderText(/Buscar por tema/i);
    fireEvent.change(search, { target: { value: "xyz123semresultado" } });

    expect(screen.getByText(/Nenhum resultado encontrado/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Enviar uma mensagem para a equipe/i)
    ).toBeInTheDocument();
  });

  it("botao limpar busca esvazia o input", () => {
    render(<AtalhoAjuda />);

    const search = screen.getByPlaceholderText(/Buscar por tema/i) as HTMLInputElement;
    fireEvent.change(search, { target: { value: "teste" } });
    expect(search.value).toBe("teste");

    const clearBtn = screen.getByLabelText(/Limpar busca/i);
    fireEvent.click(clearBtn);

    expect(search.value).toBe("");
  });
});
