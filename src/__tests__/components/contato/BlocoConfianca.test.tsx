/**
 * BlocoConfianca.test.tsx
 *
 * Cobertura:
 * - Renderizacao com defaults
 * - Renderizacao com config customizada
 * - Exibicao de canais (whatsapp, email)
 * - Bloco de metricas reais (so quando metrics existe)
 * - Trust items custom
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import BlocoConfianca from "@/app/contato/components/BlocoConfianca";

describe("BlocoConfianca", () => {
  it("renderiza titulo padrao", () => {
    render(<BlocoConfianca />);

    expect(
      screen.getByText(/Por que confiar no atendimento Kavita/i)
    ).toBeInTheDocument();
  });

  it("usa titulo e subtitulo do config", () => {
    render(
      <BlocoConfianca
        config={
          {
            trust_title: "Titulo Custom",
            trust_subtitle: "Subtitulo Custom",
          } as any
        }
      />
    );

    expect(screen.getByText("Titulo Custom")).toBeInTheDocument();
    expect(screen.getByText("Subtitulo Custom")).toBeInTheDocument();
  });

  it("renderiza 4 trust items default quando sem config", () => {
    render(<BlocoConfianca />);

    // Estes labels so aparecem nos cards
    expect(screen.getByText("Resposta rapida")).toBeInTheDocument();
    expect(screen.getByText("Horario comercial")).toBeInTheDocument();
    expect(screen.getByText("Equipe qualificada")).toBeInTheDocument();
    // "Empresa real" tambem aparece no subtitulo, entao buscamos por todas
    const empresaReal = screen.getAllByText(/Empresa real/i);
    expect(empresaReal.length).toBeGreaterThanOrEqual(1);
  });

  it("renderiza trust items custom do config", () => {
    render(
      <BlocoConfianca
        config={
          {
            trust_items: [
              { label: "Custom Item 1", desc: "Desc 1", icon: "bolt", color: "" },
              { label: "Custom Item 2", desc: "Desc 2", icon: "clock", color: "" },
            ],
          } as any
        }
      />
    );

    expect(screen.getByText("Custom Item 1")).toBeInTheDocument();
    expect(screen.getByText("Custom Item 2")).toBeInTheDocument();
    expect(screen.queryByText(/Resposta rapida/i)).not.toBeInTheDocument();
  });

  it("exibe canal WhatsApp quando whatsapp e fornecido", () => {
    render(
      <BlocoConfianca
        whatsapp="(31) 99999-0000"
        whatsappUrl="https://wa.me/5531999990000"
      />
    );

    expect(screen.getByText(/WhatsApp/i)).toBeInTheDocument();
    expect(screen.getByText("(31) 99999-0000")).toBeInTheDocument();
  });

  it("exibe canal email quando email e fornecido", () => {
    render(<BlocoConfianca email="contato@kavita.com.br" />);

    expect(screen.getByText("contato@kavita.com.br")).toBeInTheDocument();
  });

  it("nao exibe bloco de canais quando nao ha whatsapp nem email", () => {
    render(<BlocoConfianca />);

    expect(screen.queryByText(/Canais diretos/i)).not.toBeInTheDocument();
  });

  it("exibe bloco de metricas quando metrics fornecido", () => {
    render(
      <BlocoConfianca
        metrics={{ total_mensagens: 127, taxa_resposta: 95, tempo_medio: "4h" }}
      />
    );

    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("4h")).toBeInTheDocument();
    expect(screen.getByText("127+")).toBeInTheDocument();
    expect(screen.getByText(/Dados reais/i)).toBeInTheDocument();
  });

  it("nao exibe bloco de metricas quando metrics e null", () => {
    render(<BlocoConfianca />);

    expect(screen.queryByText(/Dados reais/i)).not.toBeInTheDocument();
  });

  it("usa tempo_medio das metricas no card 'Resposta rapida'", () => {
    render(
      <BlocoConfianca
        metrics={{ total_mensagens: 50, taxa_resposta: 90, tempo_medio: "2h" }}
      />
    );

    expect(screen.getByText(/Media de 2h/i)).toBeInTheDocument();
  });
});
